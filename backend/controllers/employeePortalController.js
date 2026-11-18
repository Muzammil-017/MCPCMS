const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Payroll = require('../models/Payroll');
const Leave = require('../models/Leave');
const Notification = require('../models/Notification');
const { sendPayslip } = require('../services/payslipStoreService');
const { sendError } = require('../services/errorService');

const getCurrentEmployee = async (user) => {
  return Employee.findOne({
    isActive: true,
    $or: [
      { userId: user._id },
      { email: user.email }
    ]
  }).populate('companyId', 'name');
};

exports.getProfile = async (req, res) => {
  try {
    const employee = await getCurrentEmployee(req.user);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee profile not found' });
    res.json({ success: true, employee });
  } catch (err) { sendError(res, err); }
};

exports.updateProfile = async (req, res) => {
  try {
    const allowed = ['phone', 'bankAccount', 'ifscCode', 'panNumber'];
    const updates = {};
    allowed.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const employee = await Employee.findOneAndUpdate(
      { isActive: true, $or: [{ userId: req.user._id }, { email: req.user.email }] },
      updates,
      { new: true, runValidators: true }
    ).populate('companyId', 'name');

    if (!employee) return res.status(404).json({ success: false, message: 'Employee profile not found' });
    res.json({ success: true, employee });
  } catch (err) { sendError(res, err); }
};

exports.getAttendance = async (req, res) => {
  try {
    const employee = await getCurrentEmployee(req.user);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

    const filter = { employeeId: employee._id };
    if (req.query.month) filter.month = req.query.month;
    const attendance = await Attendance.find(filter).sort({ date: -1 }).limit(60);
    res.json({ success: true, attendance });
  } catch (err) { sendError(res, err); }
};

exports.getPayslips = async (req, res) => {
  try {
    const employee = await getCurrentEmployee(req.user);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    const payslips = await Payroll.find({ employeeId: employee._id }).sort({ payrollMonth: -1 });
    res.json({ success: true, payslips });
  } catch (err) { sendError(res, err); }
};

exports.downloadPayslip = async (req, res) => {
  try {
    const employee = await getCurrentEmployee(req.user);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    const payroll = await Payroll.findOne({ employeeId: employee._id, payrollMonth: req.params.month });
    if (!payroll) return res.status(404).json({ success: false, message: `No payroll found for ${req.params.month}` });
    await sendPayslip(payroll, res);
  } catch (err) { sendError(res, err); }
};

exports.applyLeave = async (req, res) => {
  try {
    const employee = await getCurrentEmployee(req.user);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

    const { fromDate, toDate, type, reason } = req.body;
    if (!fromDate || !toDate || !reason)
      return res.status(400).json({ success: false, message: 'fromDate, toDate and reason are required' });

    const today = new Date().toISOString().substring(0, 10);
    if (fromDate < today || toDate < today)
      return res.status(400).json({ success: false, message: 'Leave dates cannot be in the past' });
    if (fromDate > toDate)
      return res.status(400).json({ success: false, message: 'From date cannot be after to date' });

    const leave = await Leave.create({
      employeeId: employee._id,
      companyId: employee.companyId._id || employee.companyId,
      fromDate,
      toDate,
      type,
      reason
    });
    res.status(201).json({ success: true, leave });
  } catch (err) { sendError(res, err); }
};

exports.getLeaves = async (req, res) => {
  try {
    const employee = await getCurrentEmployee(req.user);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    const leaves = await Leave.find({ employeeId: employee._id }).sort({ createdAt: -1 });
    res.json({ success: true, leaves });
  } catch (err) { sendError(res, err); }
};

exports.getNotifications = async (req, res) => {
  try {
    const employee = await getCurrentEmployee(req.user);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    const notifications = await Notification.find({
      $or: [
        { employeeId: employee._id },
        { employeeId: null, companyId: employee.companyId._id || employee.companyId }
      ]
    }).sort({ createdAt: -1 }).limit(30);
    res.json({ success: true, notifications });
  } catch (err) { sendError(res, err); }
};
