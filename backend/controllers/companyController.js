const Company = require('../models/Company');

exports.createCompany = async (req, res) => {
  try {
    const exists = await Company.findOne({ email: req.body.email });
    if (exists) return res.status(400).json({ success: false, message: 'Company email already exists' });
    const company = await Company.create(req.body);
    res.status(201).json({ success: true, company });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getCompanies = async (req, res) => {
  try {
    const filter = {};
    // If user has a companyId, only show their company
    if (req.user?.companyId) filter._id = req.user.companyId;
    const companies = await Company.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: companies.length, companies });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    res.json({ success: true, company });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.updateCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    res.json({ success: true, company });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.deleteCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndDelete(req.params.id);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    res.json({ success: true, message: 'Company deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};