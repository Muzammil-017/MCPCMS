require('dotenv').config();
// Express app (routes + middleware). Started by server.js locally and by api/index.js on Vercel.
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { sendError } = require('./services/errorService');
const contactRoutes = require('./routes/contactRoutes');

const app = express();

// ✅ Middleware FIRST
// CORS_ORIGIN: comma-separated list of allowed frontend URLs; unset allows all (local dev)
const corsOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()) : '*';
app.use(cors({ origin: corsOrigins, credentials: corsOrigins !== '*' }));
app.use(express.json());
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Routes AFTER middleware
app.use('/api/contact', contactRoutes);
app.use('/api/auth',           require('./routes/authRoutes'));
app.use('/api/employee-auth',  require('./routes/employeeAuthRoutes'));
app.use('/api/employee-portal', require('./routes/employeePortalRoutes'));
app.use('/api/company',        require('./routes/companyRoutes'));
app.use('/api/employee',       require('./routes/employeeRoutes'));
app.use('/api/employees',      require('./routes/employeeRoutes'));
app.use('/api/salary-structure', require('./routes/salaryRoutes'));
app.use('/api/attendance',     require('./routes/attendanceRoutes'));
app.use('/api/leaves',         require('./routes/leaveRoutes'));
app.use('/api/requests',       require('./routes/requestRoutes'));
app.use('/api/reimbursements', require('./routes/reimbursementRoutes'));
app.use('/api/compliance',     require('./routes/complianceRoutes'));
app.use('/api/analytics',      require('./routes/analyticsRoutes'));
app.use('/api/payslip',        require('./routes/payslipRoutes'));
app.use('/api/reports',        require('./routes/reportRoutes'));
app.use('/api',                require('./routes/payrollRoutes'));

// Health
app.get('/', (req, res) => res.json({ status: 'ok', message: 'MCPCMS API v2.0 ✅', timestamp: new Date() }));

// 404
app.use((req, res) => res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` }));

// Global error handler
app.use((err, req, res, next) => {
  // Rejected uploads (wrong type / too large) and malformed JSON are client errors
  if (err.message === 'Only PDF and image bills are allowed' || err.type === 'entity.parse.failed') err.status = 400;
  if (err.code === 'LIMIT_FILE_SIZE') err.message = 'File too large (max 5 MB)';
  sendError(res, err);
});

module.exports = app;
