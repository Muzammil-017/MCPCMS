const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  email:       { type: String, required: true, unique: true, lowercase: true },
  phone:       { type: String, default: '' },
  industry:    { type: String, required: true },
  address:     { type: String, default: '' },
  gstNumber:   { type: String, default: '' },
  panNumber:   { type: String, default: '' },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Company', companySchema);
