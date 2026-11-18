const Employee = require('../models/Employee');
const EmployeeRequest = require('../models/EmployeeRequest');
const { tenantFilter } = require('../middleware/authMiddleware');
const { sendError } = require('../services/errorService');
const { notify } = require('../services/notificationService');

// Tries every possible link between a User and an Employee document
const getCurrentEmployee = async (user) => {
  if (!user) return null;

  // Debug: uncomment the line below temporarily if requests still fail
  // console.log('getCurrentEmployee user:', JSON.stringify(user));

  return Employee.findOne({
    isActive: true,
    $or: [
      { userId: user._id },
      { email: user.email },
      ...(user.employeeId ? [{ _id: user.employeeId }] : []),
    ],
  });
};

exports.createEmployeeRequest = async (req, res) => {
  try {
    const employee = await getCurrentEmployee(req.user);

    if (!employee) {
      console.log('Employee not found for user:', req.user?._id, req.user?.email);
      return res.status(404).json({ success: false, message: 'Employee profile not found' });
    }

    const { type, requestDate, details } = req.body;

    if (!type || !requestDate || !details)
      return res.status(400).json({ success: false, message: 'type, requestDate and details are required' });

    const today = new Date().toISOString().substring(0, 10);
    if (['Shift Change', 'Work From Home', 'Resignation'].includes(type) && requestDate < today)
      return res.status(400).json({ success: false, message: 'Request date cannot be in the past' });

    const request = await EmployeeRequest.create({
      employeeId: employee._id,
      companyId: employee.companyId,
      type,
      requestDate,
      details,
    });

    res.status(201).json({ success: true, request });
  } catch (err) {
    sendError(res, err);
  }
};

exports.getMyRequests = async (req, res) => {
  try {
    const employee = await getCurrentEmployee(req.user);

    if (!employee) {
      console.log('Employee not found for user:', req.user?._id, req.user?.email);
      return res.status(404).json({ success: false, message: 'Employee profile not found' });
    }

    const requests = await EmployeeRequest.find({ employeeId: employee._id }).sort({ createdAt: -1 });
    res.json({ success: true, requests });
  } catch (err) {
    sendError(res, err);
  }
};

exports.getRequests = async (req, res) => {
  try {
    const filter = tenantFilter(req);
    if (req.query.status) filter.status = req.query.status;
    if (req.query.type) filter.type = req.query.type;
    if (req.isSuperAdmin && req.query.companyId) filter.companyId = req.query.companyId;

    const requests = await EmployeeRequest.find(filter)
      .populate('employeeId', 'name email employeeCode department position')
      .populate('companyId', 'name')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: requests.length, requests });
  } catch (err) {
    sendError(res, err);
  }
};

exports.updateRequestStatus = async (req, res) => {
  try {
    const { status, adminRemarks = '' } = req.body;

    if (!['Pending', 'Approved', 'Rejected'].includes(status))
      return res.status(400).json({ success: false, message: 'Invalid request status' });

    const filter = tenantFilter(req, { _id: req.params.id });

    const request = await EmployeeRequest.findOneAndUpdate(
      filter,
      { status, adminRemarks, reviewedBy: req.user._id, reviewedAt: new Date() },
      { new: true, runValidators: true }
    )
      .populate('employeeId', 'name email employeeCode department position')
      .populate('companyId', 'name')
      .populate('reviewedBy', 'name');

    if (!request)
      return res.status(404).json({ success: false, message: 'Request not found' });

    if (status !== 'Pending') await notify(request.employeeId, request.companyId, `Request ${status.toLowerCase()}`, `Your ${request.type} request was ${status.toLowerCase()}.` + (adminRemarks ? ` Remarks: ${adminRemarks}` : ''), 'Info');
    res.json({ success: true, request });
  } catch (err) {
    sendError(res, err);
  }
};
