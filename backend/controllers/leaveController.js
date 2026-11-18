const Leave = require('../models/Leave');
const { tenantFilter } = require('../middleware/authMiddleware');
const { sendError } = require('../services/errorService');
const { notify } = require('../services/notificationService');

exports.getLeaves = async (req, res) => {
  try {
    const filter = tenantFilter(req);
    if (req.query.status) filter.status = req.query.status;
    if (req.isSuperAdmin && req.query.companyId) filter.companyId = req.query.companyId;

    const leaves = await Leave.find(filter)
      .populate('employeeId', 'name email employeeCode department position')
      .populate('companyId', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: leaves.length, leaves });
  } catch (err) {
    sendError(res, err);
  }
};

exports.updateLeaveStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Approved', 'Rejected', 'Pending'].includes(status))
      return res.status(400).json({ success: false, message: 'Invalid leave status' });

    const filter = tenantFilter(req, { _id: req.params.id });

    const leave = await Leave.findOneAndUpdate(
      filter,
      { status },
      { new: true, runValidators: true }
    )
      .populate('employeeId', 'name email employeeCode department position')
      .populate('companyId', 'name');

    if (!leave) return res.status(404).json({ success: false, message: 'Leave request not found' });
    if (status !== 'Pending') await notify(leave.employeeId, leave.companyId, `Leave ${status.toLowerCase()}`, `Your ${leave.type} leave from ${leave.fromDate} to ${leave.toDate} was ${status.toLowerCase()}.`, 'Attendance');
    res.json({ success: true, leave });
  } catch (err) {
    sendError(res, err);
  }
};
