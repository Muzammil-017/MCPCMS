const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  companyId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Company', index: true },
  date:       { type: String, required: true },
  status:     { type: String, enum: ['Present', 'Absent', 'Half-Day', 'Leave', 'Holiday', 'WFH'], default: 'Present' },
  checkIn:    { type: String, default: '' },
  checkOut:   { type: String, default: '' },
  remarks:    { type: String, default: '' },
  month:      { type: String },
}, { timestamps: true });

attendanceSchema.pre('save', function(next) {
  if (this.date) this.month = this.date.substring(0, 7);
  next();
});

attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ companyId: 1, month: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
