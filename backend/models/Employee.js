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
}, { timestamps: true });

employeeSchema.pre('save', async function(next) {
  if (!this.employeeCode) {
    const count = await mongoose.model('Employee').countDocuments();
    this.employeeCode = `EMP${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Employee', employeeSchema);