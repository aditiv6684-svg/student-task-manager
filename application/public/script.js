// ========================================
// STUDENT TASK MANAGER - SCRIPT.JS
// ========================================

// Cloudflare Worker API
const API_URL =
  "https://student-task-manager.6684aditi.workers.dev/api/tasks";

// Application data
let tasks = [];
let editingTaskId = null;
let currentFilter = "all";
let messageTimer = null;

// HTML elements
const taskForm = document.getElementById("taskForm");
const taskTitle = document.getElementById("taskTitle");
const taskDescription = document.getElementById("taskDescription");
const tasksContainer = document.getElementById("tasksContainer");
const taskDialog = document.getElementById("taskDialog");
const searchInput = document.getElementById("searchInput");
const sortFilter = document.getElementById("sortFilter");
const messageBox = document.getElementById("message");

// ========================================
// 1. SHOW MESSAGES
// ========================================

function showMessage(message, type = "success") {
  if (!messageBox) {
    alert(message);
    return;
  }

  clearTimeout(messageTimer);

  messageBox.textContent = message;
  messageBox.className = `message ${type}`;
  messageBox.hidden = false;

  messageTimer = setTimeout(() => {
    messageBox.hidden = true;
  }, 3500);
}

// ========================================
// 2. API REQUEST HELPER
// ========================================

async function apiRequest(url, options = {}) {
  let response;

  try {
    response = await fetch(url, {
      ...options,
      headers: {
        ...(options.body
          ? { "Content-Type": "application/json" }
          : {}),
        ...options.headers,
      },
    });
  } catch (error) {
    throw new Error(
      "Cannot connect to Cloudflare. Check your internet connection and Worker URL."
    );
  }

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error("The server returned an invalid response.");
  }

  if (!response.ok) {
    throw new Error(
      data.error || data.message || `Request failed: ${response.status}`
    );
  }

  return data;
}

// ========================================
// 3. LOAD ALL TASKS
// ========================================

async function loadTasks() {
  if (tasksContainer) {
    tasksContainer.replaceChildren();

    const loading = document.createElement("p");
    loading.className = "empty-message";
    loading.textContent = "Getting your tasks ready...";
    tasksContainer.appendChild(loading);
  }

  try {
    const result = await apiRequest(API_URL);

    if (!Array.isArray(result)) {
      throw new Error("The server did not return a task list.");
    }

    tasks = result;

    renderTasks();
    updateStatistics();
    updateTaskCounts();
  } catch (error) {
    console.error("Unable to load tasks:", error);

    if (tasksContainer) {
      tasksContainer.replaceChildren();

      const errorMessage = document.createElement("p");
      errorMessage.className = "error-message";
      errorMessage.textContent = error.message;

      tasksContainer.appendChild(errorMessage);
    }

    showMessage(error.message, "error");
  }
}

// ========================================
// 4. FILTER AND SEARCH TASKS
// ========================================

function getVisibleTasks() {
  const searchTerm = searchInput
    ? searchInput.value.trim().toLowerCase()
    : "";

  let result = tasks.filter((task) => {
    const matchesSearch =
      (task.title || "").toLowerCase().includes(searchTerm) ||
      (task.description || "").toLowerCase().includes(searchTerm);

    const matchesFilter =
      currentFilter === "all" ||
      (currentFilter === "pending" && !task.completed) ||
      (currentFilter === "completed" && task.completed);

    return matchesSearch && matchesFilter;
  });

  const sortValue = sortFilter ? sortFilter.value : "newest";

  if (sortValue === "oldest") {
    result.sort(
      (a, b) =>
        new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
    );
  } else if (sortValue === "title") {
    result.sort((a, b) =>
      (a.title || "").localeCompare(b.title || "")
    );
  } else if (sortValue === "completed") {
    result.sort(
      (a, b) => Number(a.completed) - Number(b.completed)
    );
  } else {
    result.sort(
      (a, b) =>
        new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );
  }

  return result;
}

// ========================================
// 5. DISPLAY TASKS
// ========================================

function renderTasks() {
  if (!tasksContainer) {
    console.error('Could not find the element "tasksContainer".');
    return;
  }

  tasksContainer.replaceChildren();

  const visibleTasks = getVisibleTasks();

  if (visibleTasks.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "empty-message";

    if (tasks.length === 0) {
      emptyMessage.textContent =
        "No tasks yet. Create your first task!";
    } else {
      emptyMessage.textContent =
        "No tasks match your search or selected filter.";
    }

    tasksContainer.appendChild(emptyMessage);
    return;
  }

  visibleTasks.forEach((task) => {
    tasksContainer.appendChild(createTaskCard(task));
  });
}

// ========================================
// 6. CREATE A TASK CARD
// ========================================

function createTaskCard(task) {
  const card = document.createElement("article");

  card.className = task.completed
    ? "task-card completed"
    : "task-card";

  const header = document.createElement("div");
  header.className = "task-header";

  const title = document.createElement("h3");
  title.className = "task-title";
  title.textContent = task.title;

  const status = document.createElement("span");
  status.className = task.completed
    ? "task-status status-completed"
    : "task-status status-pending";

  status.textContent = task.completed ? "Completed" : "Pending";

  header.append(title, status);

  const description = document.createElement("p");
  description.className = "task-description";
  description.textContent =
    task.description || "No description provided.";

  const footer = document.createElement("div");
  footer.className = "task-footer";

  const date = document.createElement("small");
  date.className = "task-date";

  date.textContent = task.createdAt
    ? `Created: ${new Date(task.createdAt).toLocaleDateString()}`
    : "Date unavailable";

  const actions = document.createElement("div");
  actions.className = "task-actions";

  // Complete or mark pending
  const completeButton = document.createElement("button");
  completeButton.type = "button";
  completeButton.className = "btn btn-complete";
  completeButton.textContent = task.completed
    ? "Mark pending"
    : "Complete";

  completeButton.addEventListener("click", () => {
    toggleTask(task);
  });

  // Edit
  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.className = "btn btn-edit";
  editButton.textContent = "Edit";

  editButton.addEventListener("click", () => {
    openEditForm(task);
  });

  // Delete
  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "btn btn-delete";
  deleteButton.textContent = "Delete";

  deleteButton.addEventListener("click", () => {
    deleteTask(task);
  });

  actions.append(completeButton, editButton, deleteButton);
  footer.append(date, actions);

  card.append(header, description, footer);

  return card;
}

// ========================================
// 7. UPDATE STATISTICS
// ========================================

function updateStatistics() {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  const pending = total - completed;

  const percentage =
    total === 0 ? 0 : Math.round((completed / total) * 100);

  const totalElement = document.getElementById("totalTasks");
  const completedElement = document.getElementById("completedTasks");
  const pendingElement = document.getElementById("pendingTasks");
  const percentageElement = document.getElementById("progressPercent");
  const progressBar = document.getElementById("progressBar");

  if (totalElement) totalElement.textContent = total;

  if (completedElement) {
    completedElement.textContent = completed;
  }

  if (pendingElement) {
    pendingElement.textContent = pending;
  }

  if (percentageElement) {
    percentageElement.textContent = `${percentage}%`;
  }

  if (progressBar) {
    progressBar.style.width = `${percentage}%`;
  }
}

// Update task counts displayed elsewhere on the page.
function updateTaskCounts() {
  const sidebarCount = document.getElementById("sidebarTaskCount");
  const visibleCount = document.getElementById("visibleTaskCount");
  const footerCount = document.getElementById("footerTaskCount");

  if (sidebarCount) sidebarCount.textContent = tasks.length;
  if (visibleCount) visibleCount.textContent = getVisibleTasks().length;
  if (footerCount) footerCount.textContent = tasks.length;
}

// ========================================
// 8. CREATE A NEW TASK
// ========================================

async function createTask(title, description) {
  const newTask = await apiRequest(API_URL, {
    method: "POST",
    body: JSON.stringify({
      title,
      description,
    }),
  });

  tasks.push(newTask);

  renderTasks();
  updateStatistics();
  updateTaskCounts();

  showMessage("Task created successfully!");
}

// ========================================
// 9. UPDATE AN EXISTING TASK
// ========================================

async function updateTask(taskId, title, description) {
  const updatedTask = await apiRequest(
    `${API_URL}/${encodeURIComponent(taskId)}`,
    {
      method: "PUT",
      body: JSON.stringify({
        title,
        description,
      }),
    }
  );

  tasks = tasks.map((task) =>
    task.id === taskId ? updatedTask : task
  );

  renderTasks();
  updateStatistics();
  updateTaskCounts();

  showMessage("Task updated successfully!");
}

// ========================================
// 10. COMPLETE OR REOPEN A TASK
// ========================================

async function toggleTask(task) {
  try {
    const updatedTask = await apiRequest(
      `${API_URL}/${encodeURIComponent(task.id)}`,
      {
        method: "PUT",
        body: JSON.stringify({
          completed: !task.completed,
        }),
      }
    );

    tasks = tasks.map((item) =>
      item.id === task.id ? updatedTask : item
    );

    renderTasks();
    updateStatistics();
    updateTaskCounts();

    showMessage(
      updatedTask.completed
        ? "Task completed!"
        : "Task marked as pending!"
    );
  } catch (error) {
    console.error("Unable to update task:", error);
    showMessage(error.message, "error");
  }
}

// ========================================
// 11. DELETE A TASK
// ========================================

async function deleteTask(task) {
  if (!window.confirm(`Delete "${task.title}"?`)) {
    return;
  }

  try {
    await apiRequest(
      `${API_URL}/${encodeURIComponent(task.id)}`,
      {
        method: "DELETE",
      }
    );

    tasks = tasks.filter((item) => item.id !== task.id);

    renderTasks();
    updateStatistics();
    updateTaskCounts();

    showMessage("Task deleted successfully!");
  } catch (error) {
    console.error("Unable to delete task:", error);
    showMessage(error.message, "error");
  }
}

// ========================================
// 12. OPEN THE CREATE TASK FORM
// ========================================

function openCreateForm() {
  editingTaskId = null;

  if (taskForm) {
    taskForm.reset();
  }

  const dialogTitle = document.getElementById("dialogTitle");
  const saveButton = document.getElementById("saveTaskButton");

  if (dialogTitle) {
    dialogTitle.textContent = "Create a task";
  }

  if (saveButton) {
    saveButton.textContent = "Create task";
  }

  if (taskDialog && typeof taskDialog.showModal === "function") {
    if (!taskDialog.open) {
      taskDialog.showModal();
    }
  } else if (taskDialog) {
    taskDialog.hidden = false;
  }

  if (taskTitle) {
    taskTitle.focus();
  }
}

// ========================================
// 13. OPEN THE EDIT TASK FORM
// ========================================

function openEditForm(task) {
  editingTaskId = task.id;

  if (taskTitle) {
    taskTitle.value = task.title || "";
  }

  if (taskDescription) {
    taskDescription.value = task.description || "";
  }

  const dialogTitle = document.getElementById("dialogTitle");
  const saveButton = document.getElementById("saveTaskButton");

  if (dialogTitle) {
    dialogTitle.textContent = "Edit task";
  }

  if (saveButton) {
    saveButton.textContent = "Save changes";
  }

  if (taskDialog && typeof taskDialog.showModal === "function") {
    if (!taskDialog.open) {
      taskDialog.showModal();
    }
  } else if (taskDialog) {
    taskDialog.hidden = false;
  }

  if (taskTitle) {
    taskTitle.focus();
  }
}

// ========================================
// 14. CLOSE THE TASK FORM
// ========================================

function closeTaskDialog() {
  editingTaskId = null;

  if (taskForm) {
    taskForm.reset();
  }

  if (taskDialog && typeof taskDialog.close === "function") {
    if (taskDialog.open) {
      taskDialog.close();
    }
  } else if (taskDialog) {
    taskDialog.hidden = true;
  }
}

// ========================================
// 15. SAVE TASK FORM
// ========================================

if (taskForm) {
  taskForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const title = taskTitle ? taskTitle.value.trim() : "";

    const description = taskDescription
      ? taskDescription.value.trim()
      : "";

    if (!title) {
      showMessage("Please enter a task title.", "error");

      if (taskTitle) taskTitle.focus();

      return;
    }

    const wasEditing = editingTaskId !== null;
    const taskId = editingTaskId;

    const saveButton = document.getElementById("saveTaskButton");

    if (saveButton) {
      saveButton.disabled = true;
    }

    try {
      if (wasEditing) {
        await updateTask(taskId, title, description);
      } else {
        await createTask(title, description);
      }

      closeTaskDialog();
    } catch (error) {
      console.error("Unable to save task:", error);
      showMessage(error.message, "error");
    } finally {
      if (saveButton) {
        saveButton.disabled = false;
        saveButton.textContent = wasEditing
          ? "Save changes"
          : "Create task";
      }
    }
  });
}

// ========================================
// 16. CONNECT THE MAIN BUTTONS
// ========================================

// New task button
const openTaskButton = document.getElementById("openTaskForm");

if (openTaskButton) {
  openTaskButton.addEventListener("click", openCreateForm);
}

// Quick add button
const quickAddButton = document.getElementById("quickAddButton");

if (quickAddButton) {
  quickAddButton.addEventListener("click", openCreateForm);
}
const quickAddButtonBottom =
  document.getElementById("quickAddButtonBottom");

if (quickAddButtonBottom) {
  quickAddButtonBottom.addEventListener("click", openCreateForm);
}

// Close dialog button
const closeButton = document.getElementById("closeTaskDialog");

if (closeButton) {
  closeButton.addEventListener("click", closeTaskDialog);
}

// Cancel dialog button
const cancelButton = document.getElementById("cancelTaskDialog");

if (cancelButton) {
  cancelButton.addEventListener("click", closeTaskDialog);
}

// ========================================
// 17. SEARCH TASKS
// ========================================

if (searchInput) {
  searchInput.addEventListener("input", () => {
    renderTasks();
    updateTaskCounts();
  });
}

// ========================================
// 18. SORT TASKS
// ========================================

if (sortFilter) {
  sortFilter.addEventListener("change", renderTasks);
}

// ========================================
// 19. ALL / PENDING / COMPLETED FILTERS
// ========================================

function setFilter(filter) {
  currentFilter = filter;

  const filterButtons = [
    ["allTasksNav", "all"],
    ["pendingNav", "pending"],
    ["completedNav", "completed"],
  ];

  filterButtons.forEach(([elementId, filterName]) => {
    const element = document.getElementById(elementId);

    if (element) {
      element.classList.toggle("active", filterName === filter);
    }
  });

  renderTasks();
  updateTaskCounts();
}

const allTasksButton = document.getElementById("allTasksNav");
const pendingButton = document.getElementById("pendingNav");
const completedButton = document.getElementById("completedNav");

if (allTasksButton) {
  allTasksButton.addEventListener("click", () => setFilter("all"));
}

if (pendingButton) {
  pendingButton.addEventListener("click", () => setFilter("pending"));
}

if (completedButton) {
  completedButton.addEventListener("click", () => setFilter("completed"));
}

// ========================================
// 20. START THE APPLICATION
// ========================================

loadTasks();