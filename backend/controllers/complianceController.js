const Compliance = require('../models/Compliance');
const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');

const getStatus = (data) => {
  const fields = ['pfFiled', 'esiFiled', 'tdsDeducted', 'professionalTaxFiled', 'minimumWageCompliance', 'labourWelfareFund'];
  const passed = fields.filter(f => data[f]).length;
  if (passed === fields.length) return 'Compliant';
  if (passed === 0) return 'Non-Compliant';
  return 'Partial';
};

exports.saveCompliance = async (req, res) => {
  try {
    const { companyId, month, ...rest } = req.body;
    const status = getStatus(rest);
    const record = await Compliance.findOneAndUpdate(
      { companyId, month },
      { companyId, month, ...rest, status, checkedBy: req.user._id },
      { upsert: true, new: true }
    ).populate('companyId', 'name').populate('checkedBy', 'name');
    res.status(201).json({ success: true, record });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getCompliance = async (req, res) => {
  try {
    const filter = {};
    if (req.query.companyId) filter.companyId = req.query.companyId;
    if (req.query.month) filter.month = req.query.month;
    if (req.query.status) filter.status = req.query.status;
    const records = await Compliance.find(filter)
      .populate('companyId', 'name').populate('checkedBy', 'name').sort({ month: -1 });
    res.json({ success: true, count: records.length, records });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.autoValidate = async (req, res) => {
  try {
    const { companyId, month } = req.params;
    const employees = await Employee.find({ companyId, isActive: true });
    const empIds = employees.map(e => e._id);
    const payrolls = await Payroll.find({ employeeId: { $in: empIds }, payrollMonth: month });

    const issues = [];
    if (!payrolls.length) issues.push('No payroll processed for this month');

    const totalPF = payrolls.reduce((s, p) => s + p.pfDeduction, 0);
    const totalESI = payrolls.reduce((s, p) => s + p.esiDeduction, 0);
    const totalTDS = payrolls.reduce((s, p) => s + p.tdsDeduction, 0);

    if (payrolls.length && totalPF === 0) issues.push('PF deductions are zero');
    const belowMinWage = payrolls.filter(p => p.netSalary < 10000);
    if (belowMinWage.length) issues.push(`${belowMinWage.length} employee(s) below minimum wage (₹10,000)`);
    const noESI = employees.filter(e => e.salaryStructureId).length - payrolls.filter(p => p.grossSalary <= 21000).length;

    res.json({
      success: true, companyId, month,
      totalEmployees: employees.length,
      payrollProcessed: payrolls.length,
      totalPF, totalESI, totalTDS,
      belowMinWage: belowMinWage.length,
      issues,
      passed: issues.length === 0,
      suggestion: issues.length === 0 ? '✅ All compliance checks passed' : `⚠️ ${issues.length} issue(s) found`,
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
