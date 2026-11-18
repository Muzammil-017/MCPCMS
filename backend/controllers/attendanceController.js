const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const { tenantFilter, assertCompanyAccess } = require('../middleware/authMiddleware');
const { sendError } = require('../services/errorService');

const today = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().substring(0, 10);
};
const isFutureDate = date => date > today();

exports.markAttendance = async (req, res) => {
  try {
    const { employeeId, date, status, checkIn, checkOut, remarks } = req.body;
    if (!employeeId || !date || !status)
      return res.status(400).json({ success: false, message: 'employeeId, date and status are required' });
    if (isFutureDate(date))
      return res.status(400).json({ success: false, message: 'Future attendance cannot be marked' });

    const employee = await Employee.findOne(tenantFilter(req, { _id: employeeId }));
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found in your company' });

    const existing = await Attendance.findOne({ employeeId, date });
    if (existing)
      return res.status(409).json({ success: false, message: 'Attendance is already marked and cannot be changed' });

    const record = await Attendance.create({
      employeeId,
      companyId: employee.companyId,
      date,
      status,
      checkIn,
      checkOut,
      remarks,
      month: date.substring(0, 7)
    });
    res.status(201).json({ success: true, record });
  } catch (err) { sendError(res, err); }
};

exports.markBulkAttendance = async (req, res) => {
  try {
    const { records = [] } = req.body;
    if (!records.length)
      return res.status(400).json({ success: false, message: 'No attendance records provided' });
    if (records.some(r => r.date && isFutureDate(r.date)))
      return res.status(400).json({ success: false, message: 'Future attendance cannot be marked' });

    const employeeIds = records.filter(r => r.employeeId).map(r => r.employeeId);
    const employees = await Employee.find(tenantFilter(req, { _id: { $in: employeeIds } })).select('_id companyId');
    const employeeCompanyMap = new Map(employees.map(e => [String(e._id), e.companyId]));

    const allowedRecords = records.filter(r => employeeCompanyMap.has(String(r.employeeId)));
    if (!allowedRecords.length)
      return res.status(403).json({ success: false, message: 'No records belong to your company' });

    const existing = await Attendance.find({
      $or: allowedRecords.map(r => ({ employeeId: r.employeeId, date: r.date }))
    }).select('employeeId date');

    const existingKeys = new Set(existing.map(r => `${r.employeeId}:${r.date}`));
    const newRecords = allowedRecords
      .filter(r => r.employeeId && r.date && r.status)
      .filter(r => !existingKeys.has(`${r.employeeId}:${r.date}`))
      .map(r => ({ ...r, companyId: employeeCompanyMap.get(String(r.employeeId)), month: r.date.substring(0, 7) }));

    if (newRecords.length) await Attendance.insertMany(newRecords, { ordered: false });

    res.status(201).json({
      success: true,
      message: `${newRecords.length} records saved, ${records.length - newRecords.length} skipped or already locked`,
      saved: newRecords.length,
      skipped: records.length - newRecords.length
    });
  } catch (err) { sendError(res, err); }
};

exports.getAttendance = async (req, res) => {
  try {
    const { employeeId, month, companyId, date } = req.query;
    const filter = {};
    if (employeeId) filter.employeeId = employeeId;
    if (month) filter.month = month;
    if (date) filter.date = date;
    const scopedCompanyId = req.isSuperAdmin ? companyId : req.tenantId;
    if (scopedCompanyId) {
      if (!assertCompanyAccess(req, scopedCompanyId)) return res.status(403).json({ success: false, message: 'Access denied for this company' });
      const emps = await Employee.find({ companyId: scopedCompanyId }).select('_id');
      const empIds = emps.map(e => String(e._id));
      if (employeeId && !empIds.includes(String(employeeId))) return res.status(403).json({ success: false, message: 'Access denied for this employee' });
      filter.employeeId = employeeId || { $in: emps.map(e => e._id) };
    }
    const records = await Attendance.find(filter)
      .populate('employeeId', 'name department employeeCode')
      .sort({ date: -1 });
    res.json({ success: true, count: records.length, records });
  } catch (err) { sendError(res, err); }
};

exports.getAttendanceSummary = async (req, res) => {
  try {
    const { employeeId, month, companyId } = req.query;
    const filter = {};
    if (employeeId) filter.employeeId = employeeId;
    if (month) filter.month = month;
    const scopedCompanyId = req.isSuperAdmin ? companyId : req.tenantId;
    if (scopedCompanyId) {
      if (!assertCompanyAccess(req, scopedCompanyId)) return res.status(403).json({ success: false, message: 'Access denied for this company' });
      const emps = await Employee.find({ companyId: scopedCompanyId }).select('_id');
      const empIds = emps.map(e => String(e._id));
      if (employeeId && !empIds.includes(String(employeeId))) return res.status(403).json({ success: false, message: 'Access denied for this employee' });
      filter.employeeId = employeeId || { $in: emps.map(e => e._id) };
    }
    const records = await Attendance.find(filter);
    const summary = {
      total: records.length,
      Present: records.filter(r => r.status === 'Present').length,
      Absent: records.filter(r => r.status === 'Absent').length,
      'Half-Day': records.filter(r => r.status === 'Half-Day').length,
      Leave: records.filter(r => r.status === 'Leave').length,
      Holiday: records.filter(r => r.status === 'Holiday').length,
      WFH: records.filter(r => r.status === 'WFH').length,
    };
    res.json({ success: true, summary });
  } catch (err) { sendError(res, err); }
};

exports.deleteAttendance = async (req, res) => {
  try {
    res.status(403).json({ success: false, message: 'Attendance records are locked and cannot be deleted' });
  } catch (err) { sendError(res, err); }
};
