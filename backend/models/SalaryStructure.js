const mongoose = require('mongoose');

const salaryStructureSchema = new mongoose.Schema({
  employeeId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true, unique: true },
  basicSalary:  { type: Number, required: true, min: 0 },
  hra:          { type: Number, default: 0, min: 0 },
  allowances:   { type: Number, default: 0, min: 0 },
  medicalAllowance: { type: Number, default: 0 },
  travelAllowance:  { type: Number, default: 0 },
  deductions:   { type: Number, default: 0, min: 0 },
  effectiveFrom: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('SalaryStructure', salaryStructureSchema);
