const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  email:     { type: String, required: true, unique: true, lowercase: true },
  password:  { type: String, required: true },
  role:      { type: String, enum: ['SuperAdmin', 'Admin', 'HR', 'Employee'], default: 'HR' },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  isActive:  { type: Boolean, default: true },
  isDemo:    { type: Boolean, default: false },   // shared demo login: password/email/account can't be changed
  passwordChangedAt:    { type: Date },
  tokenVersion:         { type: Number, default: 0 },   // bumped on password change: older login tokens stop working
  resetPasswordToken:   { type: String, select: false },
  resetPasswordExpires: { type: Date, select: false },
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  if (!this.isNew) {
    this.passwordChangedAt = new Date();
    this.tokenVersion = (this.tokenVersion || 0) + 1;
  }
  next();
});

userSchema.methods.matchPassword = async function(entered) {
  return await bcrypt.compare(entered, this.password);
};

// True if the token was issued before the latest password change
userSchema.methods.isTokenOutdated = function(decoded) {
  return (decoded.tv || 0) !== (this.tokenVersion || 0);
};

userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  delete obj.tokenVersion;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
