function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const method = request.method;

    if (method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    if (!url.pathname.startsWith("/api/tasks")) {
      return jsonResponse({ message: "Student Task Manager API is running" });
    }

    try {
      // GET /api/tasks - retrieve all tasks
      if (url.pathname === "/api/tasks" && method === "GET") {
        const stored = await env.TASKS_KV.list({ prefix: "task:" });
        const tasks = [];

        for (const key of stored.keys) {
          const task = await env.TASKS_KV.get(key.name, "json");
          if (task) tasks.push(task);
        }

        return jsonResponse(tasks);
      }

      // POST /api/tasks - create a task
      if (url.pathname === "/api/tasks" && method === "POST") {
        const body = await request.json();

        if (!body.title || !body.title.trim()) {
          return jsonResponse({ error: "Task title is required" }, 400);
        }

        const task = {
          id: crypto.randomUUID(),
          title: body.title.trim(),
          description: body.description || "",
          completed: false,
          createdAt: new Date().toISOString(),
        };

        await env.TASKS_KV.put(`task:${task.id}`, JSON.stringify(task));

        return jsonResponse(task, 201);
      }

      // GET /api/tasks/{id} - retrieve one task
      const match = url.pathname.match(/^\/api\/tasks\/([^/]+)$/);

      if (match && method === "GET") {
        const task = await env.TASKS_KV.get(`task:${match[1]}`, "json");

        if (!task) {
          return jsonResponse({ error: "Task not found" }, 404);
        }

        return jsonResponse(task);
      }

      // PUT /api/tasks/{id} - update a task
      if (match && method === "PUT") {
        const key = `task:${match[1]}`;
        const existing = await env.TASKS_KV.get(key, "json");

        if (!existing) {
          return jsonResponse({ error: "Task not found" }, 404);
        }

        const body = await request.json();
        const updated = {
          ...existing,
          title: body.title !== undefined ? body.title.trim() : existing.title,
          description:
            body.description !== undefined
              ? body.description
              : existing.description,
          completed:
            body.completed !== undefined ? Boolean(body.completed) : existing.completed,
        };

        if (!updated.title) {
          return jsonResponse({ error: "Task title is required" }, 400);
        }

        await env.TASKS_KV.put(key, JSON.stringify(updated));

        return jsonResponse(updated);
      }

      // DELETE /api/tasks/{id} - delete a task
      if (match && method === "DELETE") {
        const key = `task:${match[1]}`;
        const existing = await env.TASKS_KV.get(key);

        if (!existing) {
          return jsonResponse({ error: "Task not found" }, 404);
        }

        await env.TASKS_KV.delete(key);

        return jsonResponse({ message: "Task deleted successfully" });
      }

      return jsonResponse({ error: "Method or endpoint not supported" }, 405);
    } catch (error) {
      return jsonResponse({ error: "Internal server error" }, 500);
    }
  },
};