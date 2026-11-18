const mongoose = require('mongoose');

const reimbursementSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  companyId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  category:   { type: String, enum: ['Travel', 'Food', 'Internet', 'Equipment'], required: true },
  amount:     { type: Number, required: true, min: 1 },
  expenseDate: { type: String, required: true },
  description: { type: String, required: true },
  billFile:   { type: String, default: '' },
  billOriginalName: { type: String, default: '' },
  status:     { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  adminRemarks: { type: String, default: '' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Reimbursement', reimbursementSchema);
