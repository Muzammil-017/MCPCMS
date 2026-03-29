# 🏥 MCPCMS — Multi-Campus Payroll & Compliance Management System

> **Final Year CSE Project** | Full-Stack Web Application | v2.0.0

![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=flat-square&logo=node.js)
![React](https://img.shields.io/badge/React-18-blue?style=flat-square&logo=react)
![MongoDB](https://img.shields.io/badge/MongoDB-6+-green?style=flat-square&logo=mongodb)
![Express](https://img.shields.io/badge/Express-4-black?style=flat-square&logo=express)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

---

## 📋 Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Screenshots](#screenshots)
- [Author](#author)

---

## 📖 About

MCPCMS is a full-stack web application designed to manage payroll, compliance, and HR operations across multiple campuses. Built as a Final Year Computer Science Engineering project, it provides an intuitive dashboard for administrators to oversee departments, salaries, attendance, and compliance status in real time.

---

## ✨ Features

- 🔐 **JWT-based Authentication** — Secure login system with role-based access control
- 📊 **Analytics Dashboard** — Real-time overview of payroll trends, department salaries, and compliance status
- 🏢 **Multi-Campus Support** — Compare and manage data across different campuses
- 👥 **Department Management** — Track employees across departments
- 💰 **Payroll Management** — Monitor salary trends and payroll processing
- ✅ **Compliance Tracking** — Monitor and report compliance status
- 📅 **Attendance Summary** — View attendance data across the organization
- 📱 **Responsive UI** — Works across desktop and mobile screens

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, React Router, Axios |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB, Mongoose |
| **Authentication** | JWT (JSON Web Tokens) |
| **Styling** | CSS3 / Tailwind |
| **Dev Tools** | VS Code, Postman, Git |

---

## 📁 Project Structure

```
mcpcms/
├── backend/
│   ├── config/           # Database & app configuration
│   ├── controllers/      # Route handler logic
│   ├── middleware/        # Auth & error middleware
│   ├── models/           # Mongoose data models
│   ├── routes/           # API route definitions
│   ├── services/         # Business logic layer
│   ├── .env.example      # Sample environment variables
│   ├── package.json
│   └── server.js         # App entry point
│
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/   # Reusable UI components
│       ├── context/      # React context (global state)
│       ├── pages/        # Page-level components
│       ├── services/     # API service calls (api.js)
│       ├── App.js
│       └── index.js
│
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) v18+
- [MongoDB](https://www.mongodb.com/) (local or Atlas)
- [Git](https://git-scm.com/)

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/mcpcms.git
cd mcpcms
```

### 2. Setup the Backend

```bash
cd backend
npm install
```

Create a `.env` file (copy from `.env.example`):

```bash
copy .env.example .env      # Windows
cp .env.example .env        # Mac/Linux
```

Fill in your environment variables (see [Environment Variables](#environment-variables) below).

Start the backend server:

```bash
npm start
# Server runs on http://localhost:5000
```

### 3. Setup the Frontend

Open a new terminal:

```bash
cd frontend
npm install
npm start
# App runs on http://localhost:3000
```

### 4. Create Admin Account

Since there's no registration UI, use Postman or curl:

```bash
POST http://localhost:5000/api/auth/register

{
  "name": "Admin",
  "email": "admin@company.com",
  "password": "yourpassword",
  "role": "admin"
}
```

---

## 🔐 Environment Variables

Create a `.env` file inside the `backend/` folder with the following:

```env
MONGO_URI=mongodb://localhost:27017/mcpcms
JWT_SECRET=your_jwt_secret_here
PORT=5000
NODE_ENV=development
```

> ⚠️ **Never commit your `.env` file to GitHub.** It is listed in `.gitignore` for security.

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and receive JWT token |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/overview` | Dashboard overview stats |
| GET | `/api/analytics/payroll-trends` | Payroll trend data |
| GET | `/api/analytics/department-salary` | Salary by department |
| GET | `/api/analytics/company-comparison` | Multi-campus comparison |
| GET | `/api/analytics/compliance-status` | Compliance overview |
| GET | `/api/analytics/attendance-summary` | Attendance data |

