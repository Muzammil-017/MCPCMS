const express = require('express');
const router = express.Router();
const { createSalaryStructure, getSalaryStructures, getSalaryStructure } = require('../controllers/salaryController');
const { protect } = require('../middleware/authMiddleware');
router.post('/', protect, createSalaryStructure);
router.get('/', protect, getSalaryStructures);
router.get('/:employeeId', protect, getSalaryStructure);
module.exports = router;
