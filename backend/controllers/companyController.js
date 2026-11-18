const Company = require('../models/Company');
const Employee = require('../models/Employee');
const User = require('../models/User');
const { assertCompanyAccess } = require('../middleware/authMiddleware');
const { sendError } = require('../services/errorService');

const clean = value => String(value || '').trim();
const cleanEmail = value => clean(value).toLowerCase();
const cleanTaxId = value => clean(value).toUpperCase().replace(/[\s-]/g, '');
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const buildCompanyPayload = (body = {}) => ({
  name: clean(body.name),
  email: cleanEmail(body.email),
  phone: clean(body.phone),
  industry: clean(body.industry),
  address: clean(body.address),
  gstNumber: cleanTaxId(body.gstNumber),
  panNumber: cleanTaxId(body.panNumber),
});

const validateCompanyPayload = (payload) => {
  if (!payload.name) return 'Company name is required';
  if (!payload.email) return 'Company email is required';
  if (!emailPattern.test(payload.email)) return 'Valid company email is required';
  if (!payload.industry) return 'Industry is required';
  if (payload.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(payload.panNumber)) return 'PAN number is invalid';
  if (payload.gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(payload.gstNumber)) return 'GST number is invalid. Example: 29ABCDE1234F1Z5';
  return null;
};

const buildAdminPayload = (body = {}) => ({
  name: clean(body.adminName),
  email: cleanEmail(body.adminEmail),
  password: String(body.adminPassword || ''),
});

const validateAdminPayload = (payload) => {
  if (!payload.name) return 'Admin name is required';
  if (!payload.email) return 'Admin email is required';
  if (!emailPattern.test(payload.email)) return 'Valid admin email is required';
  if (!payload.password || payload.password.length < 6) return 'Admin password must be at least 6 characters';
  return null;
};

exports.createCompany = async (req, res) => {
  try {
    const payload = buildCompanyPayload(req.body);
    const adminPayload = buildAdminPayload(req.body);
    const validationError = validateCompanyPayload(payload);
    if (validationError) return res.status(400).json({ success: false, message: validationError });
    const adminValidationError = validateAdminPayload(adminPayload);
    if (adminValidationError) return res.status(400).json({ success: false, message: adminValidationError });

    const exists = await Company.findOne({ email: payload.email });
    if (exists) return res.status(400).json({ success: false, message: 'Company email already exists' });
    const userExists = await User.findOne({ email: adminPayload.email });
    if (userExists) return res.status(400).json({ success: false, message: 'Admin email already exists' });

    const company = await Company.create(payload);
    const admin = await User.create({
      name: adminPayload.name,
      email: adminPayload.email,
      password: adminPayload.password,
      role: 'Admin',
      companyId: company._id,
    });

    res.status(201).json({ success: true, company, admin: admin.toJSON() });
  } catch (err) { sendError(res, err); }
};

exports.getCompanies = async (req, res) => {
  try {
    const filter = req.isSuperAdmin ? {} : { _id: req.tenantId };
    const companies = await Company.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: companies.length, companies });
  } catch (err) { sendError(res, err); }
};

exports.getCompany = async (req, res) => {
  try {
    if (!assertCompanyAccess(req, req.params.id)) return res.status(403).json({ success: false, message: 'Access denied for this company' });
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    res.json({ success: true, company });
  } catch (err) { sendError(res, err); }
};

exports.updateCompany = async (req, res) => {
  try {
    if (!assertCompanyAccess(req, req.params.id)) return res.status(403).json({ success: false, message: 'Access denied for this company' });
    const updates = req.isSuperAdmin ? buildCompanyPayload(req.body) : {
      phone: req.body.phone,
      address: req.body.address,
      gstNumber: req.body.gstNumber,
      panNumber: req.body.panNumber,
    };
    if (req.isSuperAdmin) {
      const validationError = validateCompanyPayload(updates);
      if (validationError) return res.status(400).json({ success: false, message: validationError });
      const exists = await Company.findOne({ email: updates.email, _id: { $ne: req.params.id } });
      if (exists) return res.status(400).json({ success: false, message: 'Company email already exists' });
    }
    const company = await Company.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    res.json({ success: true, company });
  } catch (err) { sendError(res, err); }
};

exports.deleteCompany = async (req, res) => {
  try {
    const linkedEmployees = await Employee.countDocuments({ companyId: req.params.id });
    if (linkedEmployees) {
      return res.status(400).json({ success: false, message: 'Cannot delete a company with assigned employees' });
    }
    const company = await Company.findByIdAndDelete(req.params.id);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    await User.deleteMany({ companyId: req.params.id });
    res.json({ success: true, message: 'Company deleted' });
  } catch (err) { sendError(res, err); }
};
