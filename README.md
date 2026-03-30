# 🎓 TrueMinds TalentFlow LMS - Backend

Welcome to the backend of the **TrueMinds TalentFlow LMS**, a robust and scalable learning management system built with the modern web stack. This repository provides a solid foundation for building a production-ready educational platform.

---

## 🛠 Tech Stack

The project leverages industry-standard technologies to ensure high performance, security, and developer productivity:

| Category | Technology |
| :--- | :--- |
| **Framework** | [NestJS](https://nestjs.com/) (v11+) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Database** | [MySQL](https://www.mysql.com/) (v8.0) |
| **ORM** | [TypeORM](https://typeorm.io/) |
| **Auth** | [JWT](https://jwt.io/) & [Passport](https://www.passportjs.org/) |
| **Security** | Bcrypt (Password Hashing), RBAC (Role-Based Access Control) |
| **API Docs** | [Swagger / OpenAPI 3.0](https://swagger.io/) |
| **Infrastucture** | [Docker](https://www.docker.com/) |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18 or higher (v22 recommended)
- **Database**: MySQL 8.0 or Docker Compose
- **Package Manager**: npm

### Step 1: Environment Setup

Copy the example environment file and configure your local settings:

```bash
cp .env.example .env
```

### Step 2: Launch Infrastructure (Docker)

To spin up the MySQL database quickly:

```bash
docker compose up -d
```

### Step 3: Run the Application

```bash
# Install dependencies
npm install

# Start in development mode (watch mode)
npm run start:dev

# Build for production
npm run build
npm run start:prod
```

---

## 📖 API Documentation

The backend is fully documented and testable out of the box.

### 1. Swagger UI
Interactive documentation is available at:
👉 **[http://localhost:3000/api/v1/docs](http://localhost:3000/api/v1/docs)**

### 2. Postman Collection
For dedicated API testing, import the collection found in:
📁 `docs/postman/TalentFlow_LMS.postman_collection.json`

> [!TIP]
> The Postman collection automatically handles JWT storage! Just run the **Login** request, and all subsequent authenticated calls will use the captured token.

---

## 📂 Folder Structure

The project follows a modular architecture for high maintainability:

```text
src/
├── app.module.ts          # Root module
├── main.ts                # Entry point & Swagger configuration
├── auth/                  # Authentication, JWT, and Guards
│   ├── decorators/        # Custom decorators (e.g., @Roles, @CurrentUser)
│   ├── dto/               # Auth-related DTOs
│   ├── guards/            # JWT and Role-based guards
│   └── ...
├── common/                # Shared utilities, filters, and pipes
│   └── enums/             # Global enums (e.g., UserRole)
└── users/                 # Core User management module
    ├── entities/          # TypeORM Entity definitions
    ├── dto/               # User-related DTOs
    └── ...
```

---

## 🔐 Security Highlights

- **Bcrypt Hashing**: All passwords are salted and hashed using Bcrypt before being stored.
- **JWT Authentication**: Stateless authentication using secure JSON Web Tokens.
- **RBAC**: Fine-grained access control using `@Roles(UserRole.ADMIN)`.
- **Validation**: Strict input validation using `class-validator` and global `ValidationPipe`.

---

## 🏗 Moving Forward: How to Use This Boilerplate

This repository is a **living template**. Here is how to expand it:

### 1. Creating New Modules
Use the Nest CLI to scaffold new features in seconds:
```bash
npx nest g resource courses
```

### 2. Adding Entities
Ensure your entities utilize the decorators from `typeorm`. Once created, register them in their respective module using `TypeOrmModule.forFeature([NewEntity])`.

### 3. Protecting Routes
Simply add the `@UseGuards(JwtAuthGuard, RolesGuard)` decorator to any controller or method that requires authorization.

---

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e

# Generate coverage report
npm run test:cov
```

---

## 📄 License

This project is [UNLICENSED](LICENSE).