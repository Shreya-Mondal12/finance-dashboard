# Finance Dashboard Backend

A RESTful backend API for a finance dashboard system with role-based access control, financial records management, and aggregated analytics. Built with **Node.js**, **Express**, and **MongoDB**.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Roles & Permissions](#roles--permissions)
- [API Reference](#api-reference)
  - [Auth](#auth)
  - [Users](#users)
  - [Transactions](#transactions)
  - [Dashboard](#dashboard)
- [Assumptions & Design Decisions](#assumptions--design-decisions)
- [Error Handling](#error-handling)

---

## Tech Stack

| Layer        | Choice              |
|--------------|---------------------|
| Runtime      | Node.js             |
| Framework    | Express.js          |
| Database     | MongoDB + Mongoose  |
| Auth         | JWT (jsonwebtoken)  |
| Validation   | express-validator   |
| Password     | bcryptjs            |
| Rate Limit   | express-rate-limit  |
| Testing      | Jest + Supertest    |

---
## Features

### Core Features
- JWT Authentication
- Role-based access control (Admin, Analyst, Viewer)
- Transactions CRUD with soft delete
- Pagination and sorting
- Filtering (type, category, date range)

### Advanced Features
- Full-text search on transactions (notes + category)
- Dashboard analytics using MongoDB aggregation:
  - Summary (income, expense, net)
  - Category breakdown
  - Monthly trends
  - Recent activity
- Numerical precision handling (rounded financial outputs)

### Security & Performance
- Rate limiting for API protection
- Input validation using express-validator
- MongoDB indexing for faster queries

### Testing
- Unit and integration tests using Jest & Supertest
- Authenticated route testing with JWT
- Database lifecycle handling in tests

---

## Project Structure

```
finance-dashboard/
├── src/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js      # Register, login, profile
│   │   ├── userController.js      # Admin user management
│   │   ├── transactionController.js # CRUD for transactions
│   │   └── dashboardController.js # Aggregated analytics
│   ├── middleware/
│   │   ├── auth.js                # JWT protect + authorize (RBAC)
│   │   └── validate.js            # Input validation rules
|   |   └── rateLimiter.js
|
├── tests/                       # NEW
│   ├── auth.test.js
│   ├── transaction.test.js
│   └── dashboard.test.js
|
│   ├── models/
│   │   ├── User.js                # User schema
│   │   └── Transaction.js         # Transaction schema
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── transactionRoutes.js
│   │   └── dashboardRoutes.js
│   ├── utils/
│   │   ├── jwt.js                 # Token helpers
│   │   ├── response.js            # Standard API response helpers
│   │   └── seed.js                # Demo data seeder
│   ├── app.js                     # Express app setup
│   └── server.js                  # Entry point
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## Setup & Installation

### Prerequisites
- Node.js v18+
- MongoDB running locally (or a MongoDB Atlas URI)

### Steps

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd finance-dashboard

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

# 4. (Optional) Seed the database with demo data
npm run seed

# 5. Start the server
npm run dev       # development with nodemon
npm start         # production
```

The server will start at `http://localhost:5000`

---

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/finance_dashboard
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

---

## Roles & Permissions

| Action                          | Viewer | Analyst | Admin |
|---------------------------------|:------:|:-------:|:-----:|
| Register / Login                | ✅     | ✅      | ✅    |
| View own profile                | ✅     | ✅      | ✅    |
| View transactions               | ✅     | ✅      | ✅    |
| View dashboard summary          | ✅     | ✅      | ✅    |
| View recent activity            | ✅     | ✅      | ✅    |
| View category breakdown         | ❌     | ✅      | ✅    |
| View monthly trends             | ❌     | ✅      | ✅    |
| Create / Update / Delete records| ❌     | ❌      | ✅    |
| Manage users (CRUD)             | ❌     | ❌      | ✅    |

---

## API Reference

All protected routes require an `Authorization: Bearer <token>` header.

All responses follow this structure:
```json
{
  "success": true | false,
  "message": "Human-readable message",
  "data": { ... }
}
```

---

### Auth

#### `POST /api/auth/register`
Register a new user.

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret123",
  "role": "viewer"
}
```

**Response `201`:**
```json
{
  "success": true,
  "message": "Account created successfully.",
  "data": {
    "token": "<jwt>",
    "user": { "id": "...", "name": "John Doe", "role": "viewer" }
  }
}
```

---

#### `POST /api/auth/login`
Authenticate and receive a JWT token.

**Body:**
```json
{
  "email": "admin@finance.dev",
  "password": "admin123"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Login successful.",
  "data": { "token": "<jwt>", "user": { ... } }
}
```

---

#### `GET /api/auth/me` 
Get the currently authenticated user's profile.

---

### Users

> All user routes require `Admin` role.

#### `GET /api/users`
List all users. Supports optional query filters:
- `role` — `viewer` | `analyst` | `admin`
- `status` — `active` | `inactive`
- `page`, `limit` — pagination

#### `GET /api/users/:id`
Get a single user by ID.

#### `PATCH /api/users/:id`
Update a user's name, role, or status.

**Body (all fields optional):**
```json
{
  "name": "New Name",
  "role": "analyst",
  "status": "inactive"
}
```

#### `DELETE /api/users/:id`
Permanently delete a user. An admin cannot delete their own account.

---

### Transactions

#### `GET /api/transactions`  `(viewer, analyst, admin)`
List transactions with filters and pagination.

**Query params:**
| Param       | Type   | Description                          |
|-------------|--------|--------------------------------------|
| `type`      | string | `income` or `expense`                |
| `search`    | string | Full-text search on notes & category |
| `category`  | string | e.g. `salary`, `food`, `rent`        |
| `startDate` | ISO date | Filter from this date              |
| `endDate`   | ISO date | Filter up to this date             |
| `page`      | number | Default `1`                          |
| `limit`     | number | Default `10`, max `100`              |
| `sort`      | string | Default `-date` (newest first)       |

**Example:** `GET /api/transactions?type=expense&category=food&page=1&limit=5`
**Example:** `GET /api/transactions?search=food`

---

#### `GET /api/transactions/:id`  `(viewer, analyst, admin)`
Get a single transaction by ID.

---

#### `POST /api/transactions`  `(admin only)`
Create a new transaction.

**Body:**
```json
{
  "amount": 3500.00,
  "type": "income",
  "category": "salary",
  "date": "2024-06-01",
  "notes": "June salary"
}
```

**Valid categories:** `salary`, `freelance`, `investment`, `rent`, `food`, `utilities`, `transport`, `healthcare`, `entertainment`, `shopping`, `education`, `other`

---

#### `PUT /api/transactions/:id`  `(admin only)`
Update an existing transaction (all fields required).

---

#### `DELETE /api/transactions/:id`  `(admin only)`
Soft-deletes a transaction (sets `isDeleted: true`). The record is retained in the database.

---

### Dashboard

#### `GET /api/dashboard/summary`  `(viewer, analyst, admin)`
Returns high-level financial totals.

**Response:**
```json
{
  "data": {
    "totalIncome": 25000,
    "totalExpenses": 12000,
    "netBalance": 13000,
    "transactionCounts": {
      "income": 10,
      "expense": 15,
      "total": 25
    }
  }
}
```

---

#### `GET /api/dashboard/recent?limit=5`  `(viewer, analyst, admin)`
Returns the most recent transactions (max 20).

---

#### `GET /api/dashboard/category-breakdown?type=expense`  `(analyst, admin)`
Returns totals grouped by category and type.

**Response:**
```json
{
  "data": [
    { "category": "rent", "type": "expense", "total": 5000, "count": 3 },
    { "category": "food", "type": "expense", "total": 1800, "count": 12 }
  ]
}
```

---

#### `GET /api/dashboard/monthly-trends?year=2024` 🔒 `(analyst, admin)`
Returns month-by-month income vs expense breakdown for a given year.

**Response:**
```json
{
  "data": {
    "year": 2024,
    "trends": [
      { "month": "Jan", "income": 5000, "expense": 2000, "net": 3000 },
      { "month": "Feb", "income": 4500, "expense": 1800, "net": 2700 }
    ]
  }
}
```

---

## Assumptions & Design Decisions

1. **Soft Deletes for Transactions** — Transactions are never hard-deleted. They are flagged with `isDeleted: true` to preserve financial history. Users are hard-deleted since they are system entities.

2. **Role Assignment at Registration** — Any role can be passed during registration. In a production system, this would be locked down so only admins can assign elevated roles. It is kept open here for ease of testing.

3. **Single Admin Protection** — An admin cannot deactivate or delete their own account, preventing accidental lockout.

4. **Generic Auth Errors** — Login returns the same error for both "wrong email" and "wrong password" to avoid user enumeration attacks.

5. **Analyst Access** — Analysts can read all transactions and access deeper analytics (category breakdown, monthly trends) but cannot create or modify records.

6. **Pagination defaults** — All list endpoints default to `page=1, limit=10`. Max limit is capped at 100 to prevent large unbounded queries.

7. **MongoDB Indexes** — Indexes are added on `date`, `type`, `category`, and `isDeleted` on the Transaction model to support fast dashboard aggregation queries.

8. **Search Optimization** — Full-text search is implemented using MongoDB text indexes on `notes` and `category`.

9. **Precision Handling** — Financial values are rounded to 2 decimal places to avoid floating-point inaccuracies.

---

## Error Handling

| Status | Meaning                                  |
|--------|------------------------------------------|
| 200    | Success                                  |
| 201    | Resource created                         |
| 400    | Bad request (e.g. self-deletion)         |
| 401    | Unauthenticated (missing/invalid token)  |
| 403    | Unauthorized (wrong role or inactive)    |
| 404    | Resource not found                       |
| 409    | Conflict (e.g. duplicate email)          |
| 422    | Validation failed                        |
| 500    | Internal server error                    |

---

## Demo Credentials (after running `npm run seed`)

| Role    | Email                    | Password    |
|---------|--------------------------|-------------|
| Admin   | admin@finance.dev        | admin123    |
| Analyst | analyst@finance.dev      | analyst123  |
| Viewer  | viewer@finance.dev       | viewer123   |

---

## Rate Limiting

To prevent abuse, rate limiting is applied:

- General APIs: 100 requests per 15 minutes
- Auth routes: 5 login attempts per 15 minutes

Implemented using `express-rate-limit`.

---

## Testing

Run tests using:

```bash
npm test
```
---

## Highlights

- Designed scalable REST APIs with clean architecture
- Implemented role-based access control using middleware
- Built analytical dashboard using MongoDB aggregation pipelines
- Ensured API security with rate limiting and validation
- Achieved reliable backend with automated testing
