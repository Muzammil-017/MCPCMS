const express = require('express');
const router = express.Router();
const { protect, employeeOnly } = require('../middleware/authMiddleware');
const { uploadReimbursementBill } = require('../middleware/uploadMiddleware');
const {
  getProfile,
  updateProfile,
  getAttendance,
  getPayslips,
  downloadPayslip,
  applyLeave,
  getLeaves,
  getNotifications,
} = require('../controllers/employeePortalController');
const {
  createEmployeeRequest,
  getMyRequests,
} = require('../controllers/requestController');
const {
  createReimbursement,
  getMyReimbursements,
} = require('../controllers/reimbursementController');

router.use(protect, employeeOnly);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/attendance', getAttendance);
router.get('/payslips', getPayslips);
router.get('/payslips/:month/download', downloadPayslip);
router.post('/leave', applyLeave);
router.get('/leave', getLeaves);
router.get('/notifications', getNotifications);
router.post('/requests', createEmployeeRequest);
router.get('/requests', getMyRequests);
router.post('/reimbursements', uploadReimbursementBill.single('bill'), createReimbursement);
router.get('/reimbursements', getMyReimbursements);

module.exports = router;
