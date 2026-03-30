# LMS Backend Boilerplate Template

This repository contains a backend boilerplate for the LMS project built with [NestJS](https://nestjs.com/), TypeORM, and MySQL. It includes a foundational architecture with JWT-based authentication so the team can quickly hit the ground running.

## 🚀 Getting Started

This template is designed to give you a head start. You can run the underlying infrastructure (MySQL) via Docker, or you can run everything entirely locally using your own MySQL server.

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Docker](https://www.docker.com/) and Docker Compose (if using Docker for infrastructure)
- MySQL (if running locally without Docker)

---

### Step 1: Environment Configuration

First, you'll need to set up your environment variables. 
Copy the example `.env` file to create your own local `.env` file:

```bash
cp .env.example .env
```

Ensure the credentials in `.env` match how you're running the infrastructure. The default values in `.env.example` perfectly correspond to the credentials exposed by the `docker-compose.yml` file.

### Step 2: Running the Infrastructure

You can run the required infrastructure (MySQL) in two ways:

#### Option A: Using Docker (Recommended)

To spin up the MySQL database quickly using Docker Compose, run the following command in the root folder:

```bash
docker compose up -d
```
This will start a MySQL container (`lms_mysql`) exposed on port `3306` with the default database `lms_db` and credentials matching the `.env.example`.

#### Option B: Running Locally (No Docker)

If you prefer not to use Docker, ensure you have a MySQL server installed and running on your local machine.
1. Create a MySQL database named `lms_db`.
2. Update the `.env` file with your local MySQL server's username and password.

---

### Step 3: Running the Application

Once your database is up and running, follow these steps to start the NestJS backend:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the application:**
   ```bash
   # development mode
   npm run start
   
   # watch mode (restarts on file changes)
   npm run start:dev
   
   # production mode
   npm run start:prod
   ```

Your backend should now be running locally. TypeORM is configured to connect to your database and handle models.

---

## 🗺️ MILESTONE 3 - User Flow Overview (BE)

Understanding how the planned feature set maps to the backend architecture will help the team grasp the project quickly. Here is the core flow and the corresponding modules you will interact with or need to build:

### Step 1 – User Registration / Login
- **Flow**: User signs up or logs into the platform.
- **Relevant Modules**: `AuthModule` (handles login/signup logic, JWT issuance) and `UsersModule` (manages the `User` entity and database records).

### Step 2 – Dashboard Access
- **Flow**: User lands on their personal dashboard displaying courses and progress.
- **Implementation**: *Team to architect the optimal module structure (e.g., dedicated dashboard module or aggregation endpoint).*

### Step 3 – Browse Courses
- **Flow**: User explores available courses or learning programs.
- **Implementation**: *Needs querying, filtering, and listing capabilities.*

### Step 4 – Enroll in Course
- **Flow**: User selects a course and begins learning.
- **Implementation**: *Requires managing the relationship between Users and Courses and tracking enrollment state.*

### Step 5 – Access Lessons
- **Flow**: User watches videos, reads materials, or completes modules.
- **Implementation**: *Requires handling retrieval for individual learning materials tied to a course.*

### Step 6 – Submit Assignments
- **Flow**: User completes assignments and submits them for evaluation.
- **Implementation**: *Requires managing tasks, file uploads, evaluation, and user answers.*

### Step 7 – Track Progress
- **Flow**: User monitors their course completion status.
- **Implementation**: *Requires tracking completed lessons/assignments against total course requirements.*

### Step 8 – Collaborate with Peers
- **Flow**: Users participate in discussions or group projects.
- **Implementation**: *Requires handling forum posts, replies, and group interactivity.*

---

## 🏗 Moving Forward: How to Use This Boilerplate

This repository is just a **boilerplate template**. It has the foundational capabilities (like User entities and auth flows) mapped out, but relies on the team to expand it to cover all the functional requirements. 

Here is how you can move on from here:

### 1. Understanding the Architecture
The codebase follows a standard modular NestJS architecture:
- `app.module.ts`: The root module that integrates TypeORM and configuration.
- `src/auth/`: Contains JWT strategies, login/registration controllers, and guards.
- `src/users/`: Contains the base User entity logic.

### 2. Creating New Modules
Use the NestJS CLI to quickly scaffold new resources. For example, to create a new `payments` module:
```bash
npx nest g resource payments
```
Choose `REST API` when prompted. This will automatically generate your Controller, Service, Module, and Data Transfer Objects (DTOs), and register them.

### 3. Adding New Entities
When you create a new entity, ensure it extends TypeORM's `@Entity()`.
Once created, register it within its module using `TypeOrmModule.forFeature([YourEntity])` and ensure it's picked up by TypeORM's connection in `app.module.ts`.

### 4. Guarding Endpoints
You can protect your API endpoints by utilizing the pre-configured guards (if available in the auth module):
```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'instructor')
@Get('restricted-data')
getRestrictedData() {
  return "Only admins and instructors can see this!";
}
```

### 5. Testing
Update test files (`*.spec.ts`) whenever adding new features to ensure overall suite health. Run tests via:
```bash
npm run test
```