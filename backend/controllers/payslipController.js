const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const SalaryStructure = require('../models/SalaryStructure');
const { sendPayslip } = require('../services/payslipStoreService');
const { tenantFilter } = require('../middleware/authMiddleware');
const { sendError } = require('../services/errorService');

exports.downloadPayslip = async (req, res) => {
  try {
    const { employeeId, month } = req.params;
    const [employee, payroll] = await Promise.all([
      Employee.findOne(tenantFilter(req, { _id: employeeId })).populate('companyId'),
      Payroll.findOne(tenantFilter(req, { employeeId, payrollMonth: month })),
    ]);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    if (!payroll) return res.status(404).json({ success: false, message: `No payroll found for ${month}` });
    await sendPayslip(payroll, res);
  } catch (err) { sendError(res, err); }
};
