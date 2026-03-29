const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');

exports.markAttendance = async (req, res) => {
  try {
    const record = await Attendance.findOneAndUpdate(
      { employeeId: req.body.employeeId, date: req.body.date },
      { ...req.body, month: req.body.date?.substring(0, 7) },
      { upsert: true, new: true }
    );
    res.status(201).json({ success: true, record });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.markBulkAttendance = async (req, res) => {
  try {
    const { records } = req.body;
    const ops = records.map(r => ({
      updateOne: {
        filter: { employeeId: r.employeeId, date: r.date },
        update: { $set: { ...r, month: r.date?.substring(0, 7) } },
        upsert: true,
      }
    }));
    await Attendance.bulkWrite(ops);
    res.status(201).json({ success: true, message: `${records.length} records saved` });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getAttendance = async (req, res) => {
  try {
    const { employeeId, month, companyId, date } = req.query;
    const filter = {};
    if (employeeId) filter.employeeId = employeeId;
    if (month) filter.month = month;
    if (date) filter.date = date;
    if (companyId) {
      const emps = await Employee.find({ companyId }).select('_id');
      filter.employeeId = { $in: emps.map(e => e._id) };
    }
    const records = await Attendance.find(filter)
      .populate('employeeId', 'name department employeeCode')
      .sort({ date: -1 });
    res.json({ success: true, count: records.length, records });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getAttendanceSummary = async (req, res) => {
  try {
    const { employeeId, month, companyId } = req.query;
    const filter = {};
    if (employeeId) filter.employeeId = employeeId;
    if (month) filter.month = month;
    if (companyId) {
      const emps = await Employee.find({ companyId }).select('_id');
      filter.employeeId = { $in: emps.map(e => e._id) };
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
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.deleteAttendance = async (req, res) => {
  try {
    await Attendance.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Record deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
