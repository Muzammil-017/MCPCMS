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
  presentDays:   { type: Number, default: 26 },
  status:        { type: String, enum: ['Processed', 'Paid', 'Hold'], default: 'Processed' },
  paidOn:        { type: Date },
}, { timestamps: true });

payrollSchema.index({ employeeId: 1, payrollMonth: 1 }, { unique: true });

module.exports = mongoose.model('Payroll', payrollSchema);
