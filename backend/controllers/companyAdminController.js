const Company = require('../models/Company');
const User = require('../models/User');
const Employee = require('../models/Employee');
const { sendError } = require('../services/errorService');
const { passwordError } = require('./authController');

// SuperAdmin manages only the Admin accounts of each company (never HR, employees or company data).

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const publicAdmin = user => ({ _id: user._id, name: user.name, email: user.email, role: user.role, isActive: user.isActive, createdAt: user.createdAt });

const emailInUse = async (email, exceptUserId) =>
  Boolean(await User.exists({ email, _id: { $ne: exceptUserId } }) || await Employee.exists({ email }));

const findAdmin = (req) => User.findOne({ _id: req.params.userId, companyId: req.params.id, role: 'Admin' });

// GET /api/company/:id/admins
exports.getAdmins = async (req, res) => {
  try {
    if (!(await Company.exists({ _id: req.params.id }))) return res.status(404).json({ success: false, message: 'Company not found' });
    const admins = await User.find({ companyId: req.params.id, role: 'Admin' }).sort({ createdAt: 1 });
    res.json({ success: true, admins: admins.map(publicAdmin) });
  } catch (err) { sendError(res, err); }
};

// POST /api/company/:id/admins  { name, email, password }
exports.createAdmin = async (req, res) => {
  try {
    if (!(await Company.exists({ _id: req.params.id }))) return res.status(404).json({ success: false, message: 'Company not found' });
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!name) return res.status(400).json({ success: false, message: 'Admin name is required' });
    if (!emailPattern.test(email)) return res.status(400).json({ success: false, message: 'Valid admin email is required' });
    const error = passwordError(req.body.password);
    if (error) return res.status(400).json({ success: false, message: error });
    if (await emailInUse(email)) return res.status(400).json({ success: false, message: 'This email is already in use' });

    const admin = await User.create({ name, email, password: req.body.password, role: 'Admin', companyId: req.params.id });
    res.status(201).json({ success: true, admin: publicAdmin(admin) });
  } catch (err) { sendError(res, err); }
};

// PUT /api/company/:id/admins/:userId  { name?, email?, isActive? }
exports.updateAdmin = async (req, res) => {
  try {
    const admin = await findAdmin(req);
    if (!admin) return res.status(404).json({ success: false, message: 'Company admin not found' });

    if (req.body.name !== undefined) {
      const name = String(req.body.name).trim();
      if (!name) return res.status(400).json({ success: false, message: 'Name cannot be empty' });
      admin.name = name;
    }
    if (req.body.email !== undefined) {
      const email = String(req.body.email).trim().toLowerCase();
      if (!emailPattern.test(email)) return res.status(400).json({ success: false, message: 'Valid email is required' });
      if (email !== admin.email && await emailInUse(email, admin._id))
        return res.status(400).json({ success: false, message: 'This email is already in use' });
      admin.email = email;
    }
    if (req.body.isActive !== undefined) {
      const isActive = Boolean(req.body.isActive);
      // Never lock a company out: keep at least one active admin
      if (!isActive && admin.isActive) {
        const otherActive = await User.countDocuments({ companyId: req.params.id, role: 'Admin', isActive: true, _id: { $ne: admin._id } });
        if (!otherActive) return res.status(400).json({ success: false, message: 'A company must keep at least one active admin. Add another admin first.' });
      }
      admin.isActive = isActive;
    }

    await admin.save();
    res.json({ success: true, admin: publicAdmin(admin) });
  } catch (err) { sendError(res, err); }
};

// PUT /api/company/:id/admins/:userId/password  { password }
exports.resetAdminPassword = async (req, res) => {
  try {
    const error = passwordError(req.body.password);
    if (error) return res.status(400).json({ success: false, message: error });
    const admin = await findAdmin(req);
    if (!admin) return res.status(404).json({ success: false, message: 'Company admin not found' });
    admin.password = req.body.password;
    await admin.save();
    res.json({ success: true, message: `Password updated for ${admin.name}` });
  } catch (err) { sendError(res, err); }
};
