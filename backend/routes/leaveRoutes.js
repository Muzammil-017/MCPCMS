const express = require('express');
const router = express.Router();
const { getLeaves, updateLeaveStatus } = require('../controllers/leaveController');
const { protect, companyStaffOnly } = require('../middleware/authMiddleware');

router.use(protect, companyStaffOnly);

router.get('/', getLeaves);
router.put('/:id/status', updateLeaveStatus);

module.exports = router;
