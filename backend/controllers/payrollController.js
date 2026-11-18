const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Company = require('../models/Company');
const Leave = require('../models/Leave');
const { calculatePayroll, calculateLopDays } = require('../services/payrollService');
const { takeSnapshot, issuePayslip } = require('../services/payslipStoreService');

// A payslip that fails to store now is issued again on its first download
const tryIssuePayslip = (payroll) => issuePayslip(payroll)
  .catch(err => console.error(`Payslip not stored for payroll ${payroll._id}: ${err.message}`));
const { resolveCompanyId, tenantFilter, assertCompanyAccess } = require('../middleware/authMiddleware');
const { sendError } = require('../services/errorService');
const { notify } = require('../services/notificationService');

// POST /api/run-payroll
exports.runPayroll = async (req, res) => {
  try {
    const { payrollMonth } = req.body;
    const companyId = resolveCompanyId(req);
    if (!companyId || !payrollMonth)
      return res.status(400).json({ success: false, message: 'companyId and payrollMonth are required' });
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(payrollMonth))
      return res.status(400).json({ success: false, message: 'payrollMonth must be in YYYY-MM format' });
    if (!assertCompanyAccess(req, companyId)) return res.status(403).json({ success: false, message: 'Access denied for this company' });

    const employees = await Employee.find({ companyId, isActive: true }).populate('salaryStructureId');
    if (!employees.length) return res.status(404).json({ success: false, message: 'No active employees found' });

    const company = await Company.findById(companyId);
    const results = [];
    const skipped = [];
    const alreadyPaid = [];

    for (const emp of employees) {
      if (!emp.salaryStructureId) { skipped.push(emp.name); continue; }
      // Paid salaries are final: re-running payroll must not recalculate or reset them
      if (await Payroll.exists({ employeeId: emp._id, payrollMonth, status: 'Paid' })) { alreadyPaid.push(emp.name); continue; }

      // Loss of pay: full month is paid unless absences are recorded (unmarked days are paid)
      const workingDays = 26;
      const [attendanceRecords, unpaidLeaves] = await Promise.all([
        Attendance.find({ employeeId: emp._id, month: payrollMonth }),
        Leave.find({
          employeeId: emp._id, type: 'Unpaid', status: 'Approved',
          fromDate: { $lte: `${payrollMonth}-31` }, toDate: { $gte: `${payrollMonth}-01` },
        }),
      ]);
      const lopDays = Math.min(calculateLopDays(attendanceRecords, unpaidLeaves, payrollMonth), workingDays);
      const paidDays = workingDays - lopDays;

      const calc = { ...calculatePayroll(emp.salaryStructureId, paidDays, workingDays), lopDays };

      const isNew = !(await Payroll.exists({ employeeId: emp._id, payrollMonth }));
      const payroll = await Payroll.findOneAndUpdate(
        { employeeId: emp._id, payrollMonth },
        { ...calc, companyId, payrollMonth, status: 'Processed', ...takeSnapshot(emp, company) },
        { upsert: true, new: true }
      );
      await tryIssuePayslip(payroll);
      if (isNew) await notify(emp._id, companyId, 'Payslip available', `Your payslip for ${payrollMonth} is ready to download.`, 'Payroll');
      results.push(payroll);
    }

    res.status(201).json({
      success: true,
      message: `Payroll processed for ${results.length} employees. Skipped: ${skipped.length} (no salary structure)`
        + (alreadyPaid.length ? `, ${alreadyPaid.length} already paid (unchanged)` : ''),
      processed: results.length,
      skipped,
      alreadyPaid,
      payrolls: results,
    });
  } catch (err) { sendError(res, err); }
};

// GET /api/payroll
exports.getPayroll = async (req, res) => {
  try {
    const filter = tenantFilter(req);
    if (req.query.month) filter.payrollMonth = req.query.month;
    if (req.isSuperAdmin && req.query.companyId) filter.companyId = req.query.companyId;
    if (req.query.status) filter.status = req.query.status;
    const payrolls = await Payroll.find(filter)
      .populate('employeeId', 'name email department position employeeCode')
      .populate('companyId', 'name')
      .sort({ payrollMonth: -1, createdAt: -1 });
    res.json({ success: true, count: payrolls.length, payrolls });
  } catch (err) { sendError(res, err); }
};

// PUT /api/payroll/:id/status
exports.updatePayrollStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Processed', 'Paid', 'Hold'].includes(status))
      return res.status(400).json({ success: false, message: 'Invalid payroll status' });
    const payroll = await Payroll.findOneAndUpdate(
      tenantFilter(req, { _id: req.params.id }),
      { status, ...(status === 'Paid' ? { paidOn: new Date() } : {}) },
      { new: true, runValidators: true }
    ).populate('employeeId', 'name');
    if (!payroll) return res.status(404).json({ success: false, message: 'Payroll not found' });
    // Re-issue so the stored payslip shows the new status (details stay as issued)
    await tryIssuePayslip(payroll);
    if (status === 'Paid') await notify(payroll.employeeId, payroll.companyId, 'Salary paid', `Your salary for ${payroll.payrollMonth} has been paid.`, 'Payroll');
    res.json({ success: true, payroll });
  } catch (err) { sendError(res, err); }
};
