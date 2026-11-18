const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  companyId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  title:      { type: String, required: true },
  message:    { type: String, required: true },
  type:       { type: String, enum: ['Info', 'Payroll', 'Attendance', 'Compliance'], default: 'Info' },
  isRead:     { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
