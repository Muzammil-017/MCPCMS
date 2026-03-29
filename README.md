# MCPCMS — Multi-Company Payroll & Compliance Management System
### Phase 1 — Full Stack MERN Project

---

## 📁 Folder Structure

```
mcpcms/
├── backend/
│   ├── config/          → MongoDB connection (db.js)
│   ├── controllers/     → Route handlers (auth, company, employee, salary, payroll)
│   ├── middleware/      → JWT auth middleware
│   ├── models/          → Mongoose schemas (Company, User, Employee, SalaryStructure, Payroll)
│   ├── routes/          → Express route definitions
│   ├── services/        → Payroll calculation engine (payrollService.js)
│   ├── utils/           → (reserved for helpers)
│   └── server.js        → Entry point
└── frontend/
    ├── public/
    └── src/
        ├── components/  → Navbar, PrivateRoute
        ├── context/     → AuthContext (global user state)
        ├── pages/       → Login, Dashboard, Employees, Payroll
        └── services/    → api.js (Axios calls)
```

---

## ⚙️ Backend Setup

### 1. Install dependencies
```bash
cd backend
npm install
```

### 2. Create `.env` file (copy from `.env.example`)
```
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.mongodb.net/mcpcms
JWT_SECRET=your_secret_key
```
> Get free MongoDB Atlas cluster at https://cloud.mongodb.com

### 3. Run backend
```bash
npm run dev      # development (nodemon)
npm start        # production
```

---

## ⚛️ Frontend Setup

### 1. Install dependencies
```bash
cd frontend
npm install
```

### 2. Start React app
```bash
npm start
```
> Runs on http://localhost:3000 — proxies API calls to localhost:5000

---

## 🧪 Testing with Postman

### Step 1 — Register Admin user
```
POST http://localhost:5000/api/auth/register
Body: { "name":"Admin", "email":"admin@test.com", "password":"123456", "role":"Admin" }
```

### Step 2 — Login to get JWT token
```
POST http://localhost:5000/api/auth/login
Body: { "email":"admin@test.com", "password":"123456" }
```
> Copy the token from the response. Add it to all further requests:
> Header: `Authorization: Bearer <token>`

### Step 3 — Create Company
```
POST http://localhost:5000/api/company
Body: { "name":"TechCorp", "email":"info@techcorp.com", "industry":"IT" }
```

### Step 4 — Add Employee
```
POST http://localhost:5000/api/employee
Body: { "name":"Ravi Kumar", "email":"ravi@techcorp.com", "department":"Engineering", "position":"Developer", "companyId":"<companyId>" }
```

### Step 5 — Assign Salary Structure
```
POST http://localhost:5000/api/salary-structure
Body: { "employeeId":"<empId>", "basicSalary":30000, "hra":5000, "allowances":3000, "deductions":500 }
```

### Step 6 — Run Payroll
```
POST http://localhost:5000/api/run-payroll
Body: { "companyId":"<companyId>", "payrollMonth":"2024-06" }
```

### Step 7 — View Payroll
```
GET http://localhost:5000/api/payroll
GET http://localhost:5000/api/payroll?month=2024-06
```

---

## 💰 Payroll Calculation Formula

| Component     | Formula                          |
|---------------|----------------------------------|
| Gross Salary  | Basic + HRA + Allowances         |
| PF Deduction  | 12% of Gross                     |
| ESI Deduction | 0.75% of Gross                   |
| Net Salary    | Gross − PF − ESI − Other Deductions |

---

## 🔐 API Endpoints Summary

| Method | Route                  | Description              | Auth |
|--------|------------------------|--------------------------|------|
| POST   | /api/auth/register     | Register user            | No   |
| POST   | /api/auth/login        | Login                    | No   |
| POST   | /api/company           | Create company           | Yes  |
| GET    | /api/company           | Get all companies        | Yes  |
| POST   | /api/employee          | Add employee             | Yes  |
| GET    | /api/employees         | Get all employees        | Yes  |
| PUT    | /api/employee/:id      | Update employee          | Yes  |
| DELETE | /api/employee/:id      | Delete employee          | Yes  |
| POST   | /api/salary-structure  | Assign salary structure  | Yes  |
| POST   | /api/run-payroll       | Run payroll for company  | Yes  |
| GET    | /api/payroll           | View payroll records     | Yes  |

---

## 🚀 Deployment

| Layer    | Platform        |
|----------|-----------------|
| Frontend | Vercel          |
| Backend  | Render          |
| Database | MongoDB Atlas   |

> On Render, set environment variables: MONGO_URI, JWT_SECRET, PORT
> On Vercel, update `proxy` in package.json to backend Render URL

---

## 📌 Phase 2 (Future)
- Attendance Management
- Compliance Validation Engine
- Payslip PDF Generation (pdfkit)
- Payroll Reports & Analytics Dashboard
- Multi-tenant improvements
