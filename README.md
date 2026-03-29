# Task Management REST API

A production-ready Task Management API built with **Node.js**, **Express**, and **SQLite**.  
All bonus features included: JWT Authentication, Pagination, Input Validation, and Docker support.

---

## Features

| Feature | Status |
|---|---|
| Create / Read / Update / Delete Tasks | ✅ |
| JWT Authentication | ✅ (Bonus) |
| Pagination & Filtering | ✅ (Bonus) |
| Input Validation | ✅ (Bonus) |
| Docker & Docker Compose | ✅ (Bonus) |
| Rate Limiting | ✅ |
| Proper Error Handling | ✅ |

---

## Tech Stack

- **Runtime** — Node.js 20
- **Framework** — Express 4
- **Database** — SQLite (via `better-sqlite3`)
- **Auth** — JSON Web Tokens (`jsonwebtoken`) + `bcryptjs`
- **Validation** — `express-validator`
- **Container** — Docker + Docker Compose

---

## Project Structure

```
task-api/
├── src/
│   ├── app.js                   # Entry point
│   ├── config/
│   │   └── database.js          # SQLite connection & schema
│   ├── controllers/
│   │   ├── authController.js    # Register / Login / Me
│   │   └── taskController.js    # CRUD for tasks
│   ├── middleware/
│   │   ├── auth.js              # JWT verification
│   │   ├── validation.js        # express-validator rules
│   │   └── errorHandler.js      # Global error handler
│   └── routes/
│       ├── auth.js
│       └── tasks.js
├── data/                        # SQLite DB file (auto-created)
├── .env.example
├── Dockerfile
├── docker-compose.yml
└── package.json
```

---

## Setup — Local (without Docker)

### Prerequisites
- Node.js 18+
- npm

### Steps

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd task-api

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env and set a strong JWT_SECRET

# 4. Start the server
npm start          # production
# or
npm run dev        # development (auto-reload with nodemon)
```

The server starts at **http://localhost:3000**.

---

## Setup — Docker

### Prerequisites
- Docker
- Docker Compose

### Steps

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd task-api

# 2. (Optional) Set a custom JWT secret
export JWT_SECRET=your_very_long_secret_key

# 3. Build and run
docker-compose up --build -d

# 4. View logs
docker-compose logs -f

# 5. Stop
docker-compose down
```

The API is available at **http://localhost:3000**.  
The SQLite database is persisted in a named Docker volume (`task_data`).

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `development` | Environment mode |
| `JWT_SECRET` | *(required)* | Secret key for signing JWTs |
| `JWT_EXPIRES_IN` | `7d` | JWT token expiry |
| `DB_PATH` | `./data/tasks.db` | Path to SQLite database file |

---

## API Reference

### Base URL
```
http://localhost:3000/api
```

---

### Authentication

All `/api/tasks` endpoints require a Bearer token:
```
Authorization: Bearer <your_token>
```

---

### Auth Endpoints

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "alice",
  "password": "securepass"
}
```
**Response 201:**
```json
{
  "success": true,
  "message": "User registered successfully.",
  "data": {
    "token": "eyJhbGci...",
    "user": { "id": "uuid", "username": "alice" }
  }
}
```

---

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "alice",
  "password": "securepass"
}
```
**Response 200:**
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "token": "eyJhbGci...",
    "user": { "id": "uuid", "username": "alice" }
  }
}
```

---

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

---

### Task Endpoints

#### Get All Tasks
```http
GET /api/tasks?page=1&limit=10&status=pending
Authorization: Bearer <token>
```

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `page` | integer | `1` | Page number |
| `limit` | integer | `10` | Results per page (max 100) |
| `status` | string | — | Filter: `pending`, `in-progress`, `completed` |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "uuid",
        "title": "Buy groceries",
        "description": "Milk, eggs, bread",
        "status": "pending",
        "created_at": "2025-03-01T10:00:00",
        "updated_at": "2025-03-01T10:00:00"
      }
    ],
    "pagination": {
      "total": 42,
      "page": 1,
      "limit": 10,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

#### Get Single Task
```http
GET /api/tasks/:id
Authorization: Bearer <token>
```

---

#### Create Task
```http
POST /api/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "status": "pending"
}
```

**Fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | string | ✅ | Task title (max 200 chars) |
| `description` | string | ❌ | Details (max 2000 chars) |
| `status` | string | ❌ | `pending` (default), `in-progress`, `completed` |

**Response 201:**
```json
{
  "success": true,
  "message": "Task created successfully.",
  "data": { "task": { ... } }
}
```

---

#### Update Task
```http
PATCH /api/tasks/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "completed"
}
```
All fields are optional — only send what you want to change.

---

#### Delete Task
```http
DELETE /api/tasks/:id
Authorization: Bearer <token>
```
**Response 200:**
```json
{
  "success": true,
  "message": "Task deleted successfully."
}
```

---

## Error Responses

All errors follow this shape:

```json
{
  "success": false,
  "message": "Human-readable error message.",
  "errors": [
    { "field": "title", "message": "Title is required." }
  ]
}
```

| Status Code | Meaning |
|---|---|
| `400` | Bad request / no fields provided |
| `401` | Missing or invalid JWT |
| `404` | Resource not found |
| `409` | Conflict (duplicate username) |
| `422` | Validation failed |
| `429` | Rate limit exceeded |
| `500` | Internal server error |

---

## Rate Limiting

- General endpoints: **100 requests / 15 minutes**
- Auth endpoints: **20 requests / 15 minutes**

---

## License

MIT
