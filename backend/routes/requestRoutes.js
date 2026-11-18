const express = require('express');
const router = express.Router();
const { getRequests, updateRequestStatus } = require('../controllers/requestController');
const { protect, companyStaffOnly } = require('../middleware/authMiddleware');

router.use(protect, companyStaffOnly);

router.get('/', getRequests);
router.put('/:id/status', updateRequestStatus);

module.exports = router;
