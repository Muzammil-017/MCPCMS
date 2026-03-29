const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const { calculatePayroll } = require('../services/payrollService');

// POST /api/run-payroll
exports.runPayroll = async (req, res) => {
  try {
    const { companyId, payrollMonth } = req.body;
    if (!companyId || !payrollMonth)
      return res.status(400).json({ success: false, message: 'companyId and payrollMonth are required' });

    const employees = await Employee.find({ companyId, isActive: true }).populate('salaryStructureId');
    if (!employees.length) return res.status(404).json({ success: false, message: 'No active employees found' });

    const results = [];
    const skipped = [];

    for (const emp of employees) {
      if (!emp.salaryStructureId) { skipped.push(emp.name); continue; }

      // Get attendance for the month
      const attendanceRecords = await Attendance.find({ employeeId: emp._id, month: payrollMonth });
      const workingDays = 26;
      const presentDays = attendanceRecords.filter(a => ['Present', 'WFH'].includes(a.status)).length +
        attendanceRecords.filter(a => a.status === 'Half-Day').length * 0.5;
      const effectiveDays = attendanceRecords.length > 0 ? presentDays : workingDays;

      const calc = calculatePayroll(emp.salaryStructureId, effectiveDays, workingDays);

      const payroll = await Payroll.findOneAndUpdate(
        { employeeId: emp._id, payrollMonth },
        { ...calc, companyId, payrollMonth, status: 'Processed' },
        { upsert: true, new: true }
      );
      results.push(payroll);
    }

    res.status(201).json({
      success: true,
      message: `Payroll processed for ${results.length} employees. Skipped: ${skipped.length} (no salary structure)`,
      processed: results.length,
      skipped,
      payrolls: results,
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/payroll
exports.getPayroll = async (req, res) => {
  try {
    const filter = {};
    if (req.query.month) filter.payrollMonth = req.query.month;
    if (req.query.companyId) filter.companyId = req.query.companyId;
    if (req.query.status) filter.status = req.query.status;
    const payrolls = await Payroll.find(filter)
      .populate('employeeId', 'name email department position employeeCode')
      .populate('companyId', 'name')
      .sort({ payrollMonth: -1, createdAt: -1 });
    res.json({ success: true, count: payrolls.length, payrolls });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// PUT /api/payroll/:id/status
exports.updatePayrollStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const payroll = await Payroll.findByIdAndUpdate(
      req.params.id,
      { status, ...(status === 'Paid' ? { paidOn: new Date() } : {}) },
      { new: true }
    ).populate('employeeId', 'name');
    if (!payroll) return res.status(404).json({ success: false, message: 'Payroll not found' });
    res.json({ success: true, payroll });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
