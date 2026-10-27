\# Automated Deployment of a Serverless Student Task Management Application



\## Project Overview



This project implements a serverless Student Task Management Application using Cloudflare Workers, Cloudflare Workers KV, and Terraform Infrastructure as Code (IaC).



The application allows users to create, view, edit, complete, and delete tasks through a web interface.



\## Technologies Used



\- HTML

\- CSS

\- JavaScript

\- Cloudflare Workers

\- Cloudflare Workers KV

\- Terraform

\- Git

\- GitHub

\- GitHub Actions



\## Features



\- Create new tasks.

\- View all tasks.

\- Edit existing tasks.

\- Mark tasks as completed.

\- Delete tasks.

\- Search and filter tasks.

\- Store tasks in Cloudflare Workers KV.

\- Provision infrastructure using Terraform.



\## Project Structure



student-task-manager-iac/



\- application/

&#x20; - worker.js

&#x20; - public/

&#x20;   - index.html

&#x20;   - style.css

&#x20;   - script.js

\- terraform/

&#x20; - providers.tf

&#x20; - main.tf

&#x20; - variables.tf

&#x20; - outputs.tf

&#x20; - terraform.tfvars.example

\- .github/

&#x20; - workflows/

&#x20;   - deploy.yml

\- screenshots/

\- .gitignore

\- README.md



\## Infrastructure as Code



Terraform manages the Cloudflare Worker, KV namespace, and their binding.



Common Terraform commands:



\- terraform init

\- terraform fmt

\- terraform validate

\- terraform plan

\- terraform apply

\- terraform state list

\- terraform destroy



Run Terraform commands from the terraform directory.



\## Application API



The Cloudflare Worker provides REST API endpoints to create, retrieve, update, and delete tasks.



\## Continuous Integration and Deployment



GitHub Actions will be configured to automate the deployment workflow.



\## Security



\- Never commit API tokens or passwords to GitHub.

\- Do not commit Terraform state files.

\- Store deployment credentials securely using GitHub Actions secrets.



\## Project Objective



The objective is to demonstrate serverless application development and automated cloud infrastructure provisioning using Terraform.

