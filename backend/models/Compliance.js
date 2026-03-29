const mongoose = require('mongoose');

const complianceSchema = new mongoose.Schema({
  companyId:             { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  month:                 { type: String, required: true },
  pfFiled:               { type: Boolean, default: false },
  esiFiled:              { type: Boolean, default: false },
  tdsDeducted:           { type: Boolean, default: false },
  professionalTaxFiled:  { type: Boolean, default: false },
  minimumWageCompliance: { type: Boolean, default: false },
  labourWelfareFund:     { type: Boolean, default: false },
  remarks:               { type: String, default: '' },
  status:                { type: String, enum: ['Compliant', 'Non-Compliant', 'Partial'], default: 'Non-Compliant' },
  checkedBy:             { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

complianceSchema.index({ companyId: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Compliance', complianceSchema);
