const express = require('express');
const router = express.Router();
const { createSalaryStructure, getSalaryStructures, getSalaryStructure } = require('../controllers/salaryController');
const { protect, companyStaffOnly } = require('../middleware/authMiddleware');
router.use(protect, companyStaffOnly);
router.post('/', createSalaryStructure);
router.get('/', getSalaryStructures);
router.get('/:employeeId', getSalaryStructure);
module.exports = router;
