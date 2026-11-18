const express = require('express');
const router = express.Router();
const { exportPayrollExcel, exportAttendanceExcel } = require('../controllers/reportController');
const { protect, companyStaffOnly } = require('../middleware/authMiddleware');
router.get('/payroll-excel', protect, companyStaffOnly, exportPayrollExcel);
router.get('/attendance-excel', protect, companyStaffOnly, exportAttendanceExcel);
module.exports = router;
