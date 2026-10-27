# Create a Cloudflare KV namespace to store student tasks
resource "cloudflare_workers_kv_namespace" "tasks" {
  account_id = var.cloudflare_account_id
  title      = "student-task-manager-tasks"
}

# Create the Cloudflare Worker for the Student Task Manager
resource "cloudflare_workers_script" "student_task_manager" {
  account_id  = var.cloudflare_account_id
  script_name = "student-task-manager"

  # Load the Worker JavaScript file
  content = trimspace(file("${path.module}/../application/worker.js"))

  # Tell Cloudflare to execute the file as an ES module
  main_module = "worker.js"

  # Connect the Worker to the KV namespace
  bindings = [
    {
      name         = "TASKS_KV"
      type         = "kv_namespace"
      namespace_id = cloudflare_workers_kv_namespace.tasks.id
    }
  ]
}