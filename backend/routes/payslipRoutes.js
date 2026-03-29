const express = require('express');
const router = express.Router();
const { downloadPayslip } = require('../controllers/payslipController');
const { protect } = require('../middleware/authMiddleware');
router.get('/:employeeId/:month', protect, downloadPayslip);
module.exports = router;
