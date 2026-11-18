const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
  employeeId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  companyId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  payrollMonth:  { type: String, required: true },
  basicSalary:   { type: Number, default: 0 },
  hra:           { type: Number, default: 0 },
  allowances:    { type: Number, default: 0 },
  grossSalary:   { type: Number, required: true },
  pfDeduction:   { type: Number, required: true },
  esiDeduction:  { type: Number, required: true },
  tdsDeduction:  { type: Number, default: 0 },
  otherDeductions: { type: Number, default: 0 },
  netSalary:     { type: Number, required: true },
  workingDays:   { type: Number, default: 26 },
  presentDays:   { type: Number, default: 26 },   // paid days = workingDays - lopDays
  lopDays:       { type: Number, default: 0 },
  status:        { type: String, enum: ['Processed', 'Paid', 'Hold'], default: 'Processed' },
  paidOn:        { type: Date },
  // Details as they were when the payslip was issued, so later edits don't change it
  employeeSnapshot: {
    employeeId:   { type: mongoose.Schema.Types.ObjectId },
    name:         { type: String },
    employeeCode: { type: String },
    email:        { type: String },
    department:   { type: String },
    position:     { type: String },
  },
  companySnapshot: {
    name:         { type: String },
  },
  payslipFile:   { type: String, default: '' },
}, { timestamps: true });

payrollSchema.index({ employeeId: 1, payrollMonth: 1 }, { unique: true });

module.exports = mongoose.model('Payroll', payrollSchema);
