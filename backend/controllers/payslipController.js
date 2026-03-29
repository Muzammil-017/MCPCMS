const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const SalaryStructure = require('../models/SalaryStructure');
const { generatePayslipPDF } = require('../services/payslipService');

exports.downloadPayslip = async (req, res) => {
  try {
    const { employeeId, month } = req.params;
    const [employee, payroll] = await Promise.all([
      Employee.findById(employeeId).populate('companyId'),
      Payroll.findOne({ employeeId, payrollMonth: month }),
    ]);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    if (!payroll) return res.status(404).json({ success: false, message: `No payroll found for ${month}` });
    generatePayslipPDF({ employee, payroll, company: employee.companyId }, res);
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
