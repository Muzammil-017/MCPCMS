require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const contactRoutes = require('./routes/contactRoutes');

const app = express();

// Connect DB
connectDB();


app.use('/api/contact', contactRoutes);

// Middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

// ── Routes ──
app.use('/api/auth',           require('./routes/authRoutes'));
app.use('/api/company',        require('./routes/companyRoutes'));
app.use('/api/employee',       require('./routes/employeeRoutes'));
app.use('/api/employees',      require('./routes/employeeRoutes'));
app.use('/api/salary-structure', require('./routes/salaryRoutes'));
app.use('/api/attendance',     require('./routes/attendanceRoutes'));
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
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 MCPCMS Server running on port ${PORT}`));
