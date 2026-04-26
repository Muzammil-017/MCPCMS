const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Payroll = require('../models/Payroll');

// GET /api/employee-portal/profile
router.get('/profile', protect, async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.user._id })
      .populate('companyId', 'name');
    if (!employee) return res.status(404).json({ success: false, message: 'Employee profile not found' });
    res.json({ success: true, employee });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/employee-portal/attendance
router.get('/attendance', protect, async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.user._id });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    const attendance = await Attendance.find({ employeeId: employee._id }).sort({ date: -1 }).limit(30);
    res.json({ success: true, attendance });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/employee-portal/payslips
router.get('/payslips', protect, async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.user._id });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    const payslips = await Payroll.find({ employeeId: employee._id }).sort({ createdAt: -1 });
    res.json({ success: true, payslips });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;