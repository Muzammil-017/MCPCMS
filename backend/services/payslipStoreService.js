const Employee = require('../models/Employee');
const Company = require('../models/Company');
const { buildPayslipPDF } = require('./payslipService');
const { saveFile, getFile, deleteFile } = require('./fileStorageService');

// Issued payslips are frozen: employee/company details are copied onto the payroll record
// when payroll runs, and the PDF is kept in MongoDB (GridFS bucket "payslips").
const BUCKET = 'payslips';

const takeSnapshot = (employee, company) => ({
  employeeSnapshot: {
    employeeId: employee._id,
    name: employee.name,
    employeeCode: employee.employeeCode,
    email: employee.email,
    department: employee.department,
    position: employee.position,
  },
  companySnapshot: { name: company?.name },
});

// employeeId may be populated by the caller
const employeeIdOf = (payroll) => payroll.employeeId?._id || payroll.employeeId;

const fileNameFor = (payroll) =>
  `Payslip_${payroll.employeeSnapshot?.employeeCode || employeeIdOf(payroll)}_${payroll.payrollMonth}.pdf`;

// Payrolls created before snapshots existed get one from the current records the first time they are needed
const ensureSnapshot = async (payroll) => {
  if (payroll.employeeSnapshot?.name) return;
  const employee = await Employee.findById(employeeIdOf(payroll));
  if (!employee) throw new Error('Employee not found for this payroll');
  const company = await Company.findById(payroll.companyId);
  Object.assign(payroll, takeSnapshot(employee, company));
};

// Builds the PDF from the payroll's frozen details, stores it, and replaces any older copy
const issuePayslip = async (payroll) => {
  await ensureSnapshot(payroll);
  const employee = { _id: employeeIdOf(payroll), ...payroll.toObject().employeeSnapshot };
  const pdf = await buildPayslipPDF({ employee, payroll, company: payroll.companySnapshot });

  const previousFile = payroll.payslipFile;
  payroll.payslipFile = await saveFile({
    bucket: BUCKET,
    file: { buffer: pdf, originalname: fileNameFor(payroll), mimetype: 'application/pdf' },
    metadata: { payrollId: payroll._id, companyId: payroll.companyId, employeeId: employeeIdOf(payroll) }
  });
  await payroll.save();
  if (previousFile) await deleteFile(previousFile, { bucket: BUCKET });
  return pdf;
};

// Returns the stored payslip, issuing it first if it was never stored
const getPayslip = async (payroll) => {
  let buffer = null;
  if (payroll.payslipFile) {
    buffer = await getFile(payroll.payslipFile, { bucket: BUCKET }).then(f => f.buffer).catch(() => null);
  }
  if (!buffer) buffer = await issuePayslip(payroll);
  return { buffer, fileName: fileNameFor(payroll) };
};

const sendPayslip = async (payroll, res) => {
  const { buffer, fileName } = await getPayslip(payroll);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
  res.send(buffer);
};

module.exports = { takeSnapshot, issuePayslip, getPayslip, sendPayslip };
