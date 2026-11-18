const mongoose = require('mongoose');

const employeeRequestSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  companyId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  type:       { type: String, enum: ['Attendance Correction', 'Shift Change', 'Work From Home', 'Resignation'], required: true },
  requestDate: { type: String, required: true },
  details:    { type: String, required: true },
  status:     { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  adminRemarks: { type: String, default: '' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('EmployeeRequest', employeeRequestSchema);
