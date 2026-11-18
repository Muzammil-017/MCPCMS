const express = require('express');
const router = express.Router();
const { getReimbursements, getReimbursementBill, updateReimbursementStatus } = require('../controllers/reimbursementController');
const { protect, companyStaffOnly } = require('../middleware/authMiddleware');

router.use(protect, companyStaffOnly);

router.get('/', getReimbursements);
router.get('/:id/bill', getReimbursementBill);
router.put('/:id/status', updateReimbursementStatus);

module.exports = router;
