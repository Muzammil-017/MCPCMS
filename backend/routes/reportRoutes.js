const express = require('express');
const router = express.Router();
const { exportPayrollExcel, exportAttendanceExcel } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
router.get('/payroll-excel', protect, exportPayrollExcel);
router.get('/attendance-excel', protect, exportAttendanceExcel);
module.exports = router;
