const express = require('express');
const router = express.Router();
const { runPayroll, getPayroll, updatePayrollStatus } = require('../controllers/payrollController');
const { protect } = require('../middleware/authMiddleware');
router.post('/run-payroll', protect, runPayroll);
router.get('/payroll', protect, getPayroll);
router.put('/payroll/:id/status', protect, updatePayrollStatus);
module.exports = router;
