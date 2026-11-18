const express = require('express');
const router = express.Router();
const { runPayroll, getPayroll, updatePayrollStatus } = require('../controllers/payrollController');
const { protect, companyStaffOnly } = require('../middleware/authMiddleware');
router.use(protect, companyStaffOnly);
router.post('/run-payroll', runPayroll);
router.get('/payroll', getPayroll);
router.put('/payroll/:id/status', updatePayrollStatus);
module.exports = router;
