# DevPulse

A robust backend API for issue tracking and management built with Express.js and TypeScript.

## 📋 Project Overview

DevPulse is a RESTful API service designed to manage issues, featuring user authentication, role-based access control, and comprehensive issue tracking capabilities. The application supports multiple user roles (contributor and maintainer) with different permission levels.

## 🌐 Live URL

- **Production**: `https://dev-pulse-gamma-three.vercel.app/` 

## ✨ Features

- **User Authentication**
  - User signup and login with JWT-based authentication
  - Password encryption using bcrypt
  - Role-based access control (Contributor, Maintainer)

- **Issue Management**
  - Create, read, update, and delete issues
  - Issue types: bug, feature_request
  - Issue status tracking: open, in_progress, resolved
  - Minimum description validation (20+ characters)
  - Role-based permissions for modifications

- **Security**
  - JWT token authentication
  - Cookie-based session management
  - CORS enabled for cross-origin requests
  - Role-based authorization middleware

- **Error Handling**
  - Global error handling middleware
  - Structured error responses

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js v5.2.1
- **Database**: PostgreSQL
- **Authentication**: JWT (jsonwebtoken), bcrypt
- **Utilities**: 
  - CORS for cross-origin requests
  - Cookie Parser for session management
  - Dotenv for environment configuration
- **Build Tools**: 
  - TSUP for bundling
  - TSX for development watching
  - TypeScript 6.0.3

## 🚀 Setup Steps

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <https://github.com/jimitaaab/Level-2-Assignment-2>
   cd DevPulse
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory with the following variables:
   ```env
   CONNECTIONSTRING=postgresql://username:password@localhost:5432/devpulse
   PORT=3000
   JWT_SECRET=your_jwt_secret_key_here
   ACCESSTOKEN_KEY=your_access_token_key_here
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

5. **Start the server**
   - **Development mode** (with auto-reload):
     ```bash
     npm run dev
     ```
   - **Production mode**:
     ```bash
     npm start
     ```

The server will start on the port specified in your `.env` file (default: 3000).

## 📡 API Endpoint List

### Base URL
```
http://localhost:3000/api
```

### Authentication Routes
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| POST | `/auth/signup` | Register a new user | ❌ No |
| POST | `/auth/logIn` | Login user and get JWT token | ❌ No |

### Issues Routes
| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|----------------|--------|
| POST | `/issues` | Create a new issue | ✅ Yes | Contributor, Maintainer |
| GET | `/issues` | Get all issues | ❌ No | - |
| GET | `/issues/:id` | Get a specific issue by ID | ❌ No | - |
| PATCH | `/issues/:id` | Update an issue | ✅ Yes | Contributor, Maintainer |
| DELETE | `/issues/:id` | Delete an issue | ✅ Yes | Maintainer only |

### Request/Response Examples

**Signup**
```bash
POST /api/auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Login**
```bash
POST /api/auth/logIn
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Create Issue**
```bash
POST /api/issues
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "title": "Login page broken",
  "description": "The login page is not responding correctly to user input on mobile devices.",
  "type": "bug"
}
```

**Update Issue**
```bash
PATCH /api/issues/:id
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "status": "in_progress",
  "title": "Updated title"
}
```

## 📊 Database Schema Summary

### Users Table
```sql
CREATE TABLE users(
  id SERIAL PRIMARY KEY,
  name VARCHAR(20),
  email VARCHAR(30) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role VARCHAR(12) DEFAULT 'contributor',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

**Fields:**
- `id`: Unique identifier (auto-increment)
- `name`: User's full name
- `email`: Unique email address
- `password`: Encrypted password
- `role`: User role (contributor | maintainer)
- `created_at`: Account creation timestamp
- `updated_at`: Last update timestamp

### Issues Table
```sql
CREATE TABLE issues(
  id SERIAL PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  description TEXT NOT NULL CHECK(LENGTH(description) >= 20),
  type VARCHAR(30) NOT NULL CHECK(type IN ('bug', 'feature_request')),
  status VARCHAR(30) DEFAULT 'open' CHECK(status IN ('open', 'in_progress', 'resolved')),
  reporter_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

**Fields:**
- `id`: Unique identifier (auto-increment)
- `title`: Issue title (max 150 characters)
- `description`: Issue description (minimum 20 characters)
- `type`: Issue type - bug or feature_request
- `status`: Current status - open, in_progress, or resolved
- `reporter_id`: ID of the user who reported the issue
- `created_at`: Issue creation timestamp
- `updated_at`: Last update timestamp

**Constraints:**
- Description must be at least 20 characters long
- Type must be either 'bug' or 'feature_request'
- Status must be one of: 'open', 'in_progress', 'resolved'

## 🔐 User Roles

- **Contributor**: Can create and update their own issues
- **Maintainer**: Can create, update, and delete any issue

## 📝 License

ISC

## 👤 Author

Next Mission 2

---

**For more information or support, please contact the development team.**
