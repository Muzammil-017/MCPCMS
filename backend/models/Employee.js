const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  userId:            { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  employeeCode:      { type: String, unique: true },
  name:              { type: String, required: true },
  email:             { type: String, required: true, unique: true, lowercase: true },
  phone:             { type: String, default: '' },
  department:        { type: String, required: true },
  position:          { type: String, required: true },
  dateOfJoining:     { type: Date, default: Date.now },
  dateOfBirth:       { type: Date },
  gender:            { type: String, enum: ['Male', 'Female', 'Other'], default: 'Male' },
  bankAccount:       { type: String, default: '' },
  ifscCode:          { type: String, default: '' },
  panNumber:         { type: String, default: '' },
  pfNumber:          { type: String, default: '' },
  esiNumber:         { type: String, default: '' },
  companyId:         { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  salaryStructureId: { type: mongoose.Schema.Types.ObjectId, ref: 'SalaryStructure' },
  isActive:          { type: Boolean, default: true },
  isDemo:            { type: Boolean, default: false },   // part of the shared demo company login
}, { timestamps: true });

employeeSchema.pre('save', async function(next) {
  if (!this.employeeCode) {
    const Counter = require('./Counter');
    // First use: start after the highest existing code so codes created before the counter are never repeated
    if (!(await Counter.exists({ _id: 'employeeCode' }))) {
      const codes = await mongoose.model('Employee').find({ employeeCode: /^EMP\d+$/ }).select('employeeCode').lean();
      const highest = codes.reduce((max, e) => Math.max(max, parseInt(e.employeeCode.slice(3), 10)), 0);
      await Counter.updateOne({ _id: 'employeeCode' }, { $max: { seq: highest } }, { upsert: true });
    }
    const counter = await Counter.findOneAndUpdate({ _id: 'employeeCode' }, { $inc: { seq: 1 } }, { new: true });
    this.employeeCode = `EMP${String(counter.seq).padStart(4, '0')}`;
  }
  next();
});

employeeSchema.index({ companyId: 1, email: 1 });
employeeSchema.index({ companyId: 1, department: 1 });

module.exports = mongoose.model('Employee', employeeSchema);
