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
      {
        companyId,
        month,
        ...rest,
        status,
        checkedBy: req.user._id
      },
      { upsert: true, new: true }
    )
      .populate('companyId', 'name')
      .populate('checkedBy', 'name');

    res.status(201).json({ success: true, record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getCompliance = async (req, res) => {
  try {
    const filter = {};

    if (req.query.companyId) filter.companyId = req.query.companyId;
    if (req.query.month) filter.month = req.query.month;
    if (req.query.status) filter.status = req.query.status;

    const records = await Compliance.find(filter)
      .populate('companyId', 'name')
      .populate('checkedBy', 'name')
      .sort({ month: -1 });

    res.json({ success: true, count: records.length, records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.autoValidate = async (req, res) => {
  try {
    const { companyId, month } = req.params;

    // ✅ Get active employees of selected company ONLY
    const employees = await Employee.find({ companyId, isActive: true });
    const empIds = employees.map(e => e._id);

    // ✅ Get payrolls only for those employees + month
    const payrolls = await Payroll.find({
      employeeId: { $in: empIds },
      payrollMonth: month
    });

    const issues = [];

    // ❗ No payroll case
    if (!payrolls.length) {
      issues.push('No payroll processed for this month');
    }

    // ✅ Totals
    const totalPF  = payrolls.reduce((s, p) => s + (p.pfDeduction  || 0), 0);
    const totalESI = payrolls.reduce((s, p) => s + (p.esiDeduction || 0), 0);
    const totalTDS = payrolls.reduce((s, p) => s + (p.tdsDeduction || 0), 0);

    // ✅ FIX #1 — PF check: only flag if PF-eligible employees exist
    // Employees with basicSalary <= 15000 are PF-eligible
    const pfEligiblePayrolls = payrolls.filter(p => (p.basicSalary || 0) <= 15000);
    if (pfEligiblePayrolls.length > 0 && totalPF === 0) {
      issues.push(`PF deductions are zero for ${pfEligiblePayrolls.length} eligible employee(s)`);
    }

    // ✅ FIX #2 — ESI check: flag employees with grossSalary <= 21000 but esiDeduction = 0
    const esiIssues = payrolls.filter(
      p => (p.grossSalary || 0) <= 21000 && (p.esiDeduction || 0) === 0
    );
    if (esiIssues.length > 0) {
      issues.push(`${esiIssues.length} employee(s) eligible for ESI but no deduction found`);
    }

    // ✅ FIX #3 — TDS check: only flag if any employee's salary exceeds taxable limit (₹2.5L/year = ~₹20,833/month)
    const tdsEligiblePayrolls = payrolls.filter(p => (p.grossSalary || 0) > 20833);
    if (tdsEligiblePayrolls.length > 0 && totalTDS === 0) {
      issues.push(`TDS deductions are zero for ${tdsEligiblePayrolls.length} taxable employee(s)`);
    }

    // ✅ Minimum wage check
    const MIN_WAGE = 10000;
    const belowMinWage = employees.filter(emp => {
      const payroll = payrolls.find(
        p => p.employeeId.toString() === emp._id.toString()
      );
      // If payroll exists → check netSalary; if missing → flag as issue
      if (payroll) return payroll.netSalary < MIN_WAGE;
      return true;
    });

    if (belowMinWage.length) {
      issues.push(`${belowMinWage.length} employee(s) below minimum wage (₹${MIN_WAGE.toLocaleString('en-IN')})`);
    }

    res.json({
      success: true,
      companyId,
      month,
      totalEmployees: employees.length,
      payrollProcessed: payrolls.length,
      totalPF,
      totalESI,
      totalTDS,
      belowMinWage: belowMinWage.length,
      // ✅ Expose individual flags so frontend can auto-sync checkboxes accurately
      flags: {
        pfOk:      pfEligiblePayrolls.length === 0 || totalPF > 0,
        esiOk:     esiIssues.length === 0,
        tdsOk:     tdsEligiblePayrolls.length === 0 || totalTDS > 0,
        minWageOk: belowMinWage.length === 0,
      },
      issues,
      passed: issues.length === 0,
      suggestion:
        issues.length === 0
          ? '✅ All compliance checks passed'
          : `⚠️ ${issues.length} issue(s) found`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};