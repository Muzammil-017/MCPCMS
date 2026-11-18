const express = require('express');
const router = express.Router();
const { downloadPayslip } = require('../controllers/payslipController');
const { protect, companyStaffOnly } = require('../middleware/authMiddleware');
router.get('/:employeeId/:month', protect, companyStaffOnly, downloadPayslip);
module.exports = router;
