const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendMail, isConfigured, escapeHtml } = require('../services/mailService');
const { rejectDemo } = require('../services/demoGuard');
const { tenantFilter, assertCompanyAccess, isSuperAdminUser } = require('../middleware/authMiddleware');
const { sendError } = require('../services/errorService');

const generateToken = (user) => jwt.sign(
  { id: user._id, role: user.role, companyId: user.companyId || null, tv: user.tokenVersion || 0 },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

const sendToken = (user, statusCode, res) => {
  const token = generateToken(user);
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      isSuperAdmin: isSuperAdminUser(user)
    }
  });
};

const normalizeRole = (role) => {
  if (!role) return 'HR';

  const compactRole = String(role).trim().toLowerCase().replace(/[\s_-]/g, '');
  const roleMap = {
    superadmin: 'SuperAdmin',
    admin: 'Admin',
    hr: 'HR',
    employee: 'Employee',
  };

  return roleMap[compactRole] || role;
};

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, companyId } = req.body;
    const role = normalizeRole(req.body.role);

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }
    const pwError = passwordError(password);
    if (pwError) return res.status(400).json({ success: false, message: pwError });

    if (!['SuperAdmin', 'Admin', 'HR', 'Employee'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    // The SuperAdmin creates company admins only; HR and employees are created inside the company
    if (!['SuperAdmin', 'Admin'].includes(role))
      return res.status(403).json({ success: false, message: 'Super admin can only create company admins. HR users and employees are added by the company.' });

    const existingUser = await User.findOne({ email }).select('+password');
    if (existingUser) {
      // Only an existing SuperAdmin account can be re-synced here; other accounts are never converted
      if ((req.isSuperAdminBootstrap || req.isSuperAdmin) && role === 'SuperAdmin' && existingUser.role === 'SuperAdmin') {
        existingUser.name = name;
        existingUser.password = password;
        existingUser.role = 'SuperAdmin';
        existingUser.companyId = undefined;
        existingUser.isActive = true;
        await existingUser.save();
        return sendToken(existingUser, 200, res);
      }
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    if (role !== 'SuperAdmin' && !companyId) return res.status(400).json({ success: false, message: 'companyId is required' });
    if (role !== 'SuperAdmin' && !(await require('../models/Company').exists({ _id: companyId })))
      return res.status(400).json({ success: false, message: 'Company not found' });
    const user = await User.create({ name, email, password, role: role || 'HR', companyId: role === 'SuperAdmin' ? undefined : companyId });
    sendToken(user, 201, res);
  } catch (err) { sendError(res, err); }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    if (!user.isActive)
      return res.status(403).json({ success: false, message: 'Your account has been deactivated. Contact your administrator.' });
    sendToken(user, 200, res);
  } catch (err) { sendError(res, err); }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('companyId', 'name');
    res.json({ success: true, user });
  } catch (err) { sendError(res, err); }
};

// GET /api/auth/users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find(tenantFilter(req)).populate('companyId', 'name').sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (err) { sendError(res, err); }
};
// PUT /api/auth/users/:id
exports.updateUser = async (req, res) => {
  try {
    const existing = await User.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'User not found' });
    if (!assertCompanyAccess(req, existing.companyId)) return res.status(403).json({ success: false, message: 'Access denied for this company' });

    // Only plain profile fields can be edited here; passwords have their own endpoints
    const editable = req.isSuperAdmin ? ['name', 'email', 'isActive', 'role', 'companyId'] : ['name', 'email', 'isActive'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => editable.includes(key)));
    if (!req.isSuperAdmin && ['Admin', 'SuperAdmin'].includes(existing.role) && String(existing._id) !== String(req.user._id))
      return res.status(403).json({ success: false, message: 'You cannot edit another admin' });
    if (String(existing._id) === String(req.user._id)) delete updates.isActive;
    if (existing.isDemo && (updates.email !== undefined || updates.isActive !== undefined || updates.role !== undefined)) return rejectDemo(res);

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).populate('companyId', 'name');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) { sendError(res, err); }
};

// ── Passwords ────────────────────────────────────────────────

const MIN_PASSWORD_LENGTH = 6;
const passwordError = (password) => {
  if (!password || String(password).length < MIN_PASSWORD_LENGTH) return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  if (String(password).length > 128) return 'Password is too long';
  return null;
};
exports.passwordError = passwordError;

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// PUT /api/auth/change-password  (any logged-in user, including employees)
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword) return res.status(400).json({ success: false, message: 'Current password is required' });
    const error = passwordError(newPassword);
    if (error) return res.status(400).json({ success: false, message: error });

    const user = await User.findById(req.user._id).select('+password');
    if (user.isDemo) return rejectDemo(res);
    if (!(await user.matchPassword(currentPassword)))
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    if (await user.matchPassword(newPassword))
      return res.status(400).json({ success: false, message: 'New password must be different from the current one' });

    user.password = newPassword;
    await user.save();
    // Old tokens stop working; return a fresh one so this session stays logged in
    res.json({ success: true, message: 'Password changed successfully', token: generateToken(user) });
  } catch (err) { sendError(res, err); }
};

// POST /api/auth/forgot-password  { email }
exports.forgotPassword = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
    if (!isConfigured())
      return res.status(503).json({ success: false, message: 'Password reset by email is not available. Please contact your administrator.' });

    // Same answer whether or not the account exists, so emails can't be probed
    const genericReply = { success: true, message: 'If an account exists for this email, a password reset link has been sent.' };
    const user = await User.findOne({ email, isActive: true });
    if (!user || user.isDemo) return res.json(genericReply);

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = hashToken(token);
    user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();

    const appUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
    const link = `${appUrl}/reset-password/${token}`;
    try {
      await sendMail({
        to: user.email,
        subject: 'Reset your MCPCMS password',
        text: `Hi ${user.name},\n\nUse this link to reset your password (valid for 30 minutes):\n${link}\n\nIf you did not ask for this, you can ignore this email.`,
        html: `<p>Hi ${escapeHtml(user.name)},</p><p>Use this link to reset your password (valid for 30 minutes):</p>`
          + `<p><a href="${link}">Reset password</a></p><p>If you did not ask for this, you can ignore this email.</p>`
      });
    } catch (mailErr) {
      console.error(`Password reset email not sent: ${mailErr.message}`);
      return res.status(502).json({ success: false, message: 'Could not send the reset email. Please try again later.' });
    }
    res.json(genericReply);
  } catch (err) { sendError(res, err); }
};

// POST /api/auth/reset-password/:token  { password }
exports.resetPassword = async (req, res) => {
  try {
    const error = passwordError(req.body.password);
    if (error) return res.status(400).json({ success: false, message: error });

    const user = await User.findOne({
      resetPasswordToken: hashToken(String(req.params.token || '')),
      resetPasswordExpires: { $gt: new Date() },
    }).select('+resetPasswordToken +resetPasswordExpires');
    if (!user) return res.status(400).json({ success: false, message: 'This reset link is invalid or has expired' });

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.json({ success: true, message: 'Password has been reset. You can now log in.', role: user.role });
  } catch (err) { sendError(res, err); }
};

// ── HR users, managed by the company admin ───────────────────

// GET /api/auth/staff
exports.getStaff = async (req, res) => {
  try {
    const staff = await User.find({ companyId: req.tenantId, role: { $in: ['Admin', 'HR'] } }).sort({ role: 1, createdAt: -1 });
    res.json({ success: true, staff });
  } catch (err) { sendError(res, err); }
};

// POST /api/auth/staff  { name, email, password }  -> creates an HR user in the admin's company
exports.createStaff = async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!name || !email) return res.status(400).json({ success: false, message: 'Name and email are required' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ success: false, message: 'Valid email is required' });
    const error = passwordError(req.body.password);
    if (error) return res.status(400).json({ success: false, message: error });
    if (await User.exists({ email })) return res.status(400).json({ success: false, message: 'Email already registered' });

    const user = await User.create({ name, email, password: req.body.password, role: 'HR', companyId: req.tenantId });
    res.status(201).json({ success: true, user });
  } catch (err) { sendError(res, err); }
};

const findCompanyHr = (req) => User.findOne({ _id: req.params.id, companyId: req.tenantId, role: 'HR' });

// PUT /api/auth/staff/:id  { name?, isActive? }
exports.updateStaff = async (req, res) => {
  try {
    const user = await findCompanyHr(req);
    if (!user) return res.status(404).json({ success: false, message: 'HR user not found' });
    if (user.isDemo && req.body.isActive !== undefined) return rejectDemo(res);
    if (req.body.name !== undefined) user.name = String(req.body.name).trim() || user.name;
    if (req.body.isActive !== undefined) user.isActive = Boolean(req.body.isActive);
    await user.save();
    res.json({ success: true, user });
  } catch (err) { sendError(res, err); }
};

// PUT /api/auth/staff/:id/password  { password }  -> admin sets a new password for an HR user
exports.resetStaffPassword = async (req, res) => {
  try {
    const error = passwordError(req.body.password);
    if (error) return res.status(400).json({ success: false, message: error });
    const user = await findCompanyHr(req);
    if (!user) return res.status(404).json({ success: false, message: 'HR user not found' });
    if (user.isDemo) return rejectDemo(res);
    user.password = req.body.password;
    await user.save();
    res.json({ success: true, message: `Password updated for ${user.name}` });
  } catch (err) { sendError(res, err); }
};

// DELETE /api/auth/staff/:id
exports.deleteStaff = async (req, res) => {
  try {
    const user = await findCompanyHr(req);
    if (!user) return res.status(404).json({ success: false, message: 'HR user not found' });
    if (user.isDemo) return rejectDemo(res);
    await user.deleteOne();
    res.json({ success: true, message: 'HR user removed' });
  } catch (err) { sendError(res, err); }
};

// ── Own profile (every role) ─────────────────────────────────

// PUT /api/auth/profile  { name?, email?, currentPassword? }  -> currentPassword is required to change the email
exports.updateProfile = async (req, res) => {
  try {
    const Employee = require('../models/Employee');
    const user = await User.findById(req.user._id).select('+password');
    if (user.isDemo) return rejectDemo(res);
    const updates = {};

    if (req.body.name !== undefined) {
      const name = String(req.body.name).trim();
      if (!name) return res.status(400).json({ success: false, message: 'Name cannot be empty' });
      // An employee's name is part of their HR record and payslips, so HR changes it
      if (user.role === 'Employee' && name !== user.name)
        return res.status(403).json({ success: false, message: 'Ask HR to change your name' });
      updates.name = name;
    }

    if (req.body.email !== undefined) {
      const email = String(req.body.email).trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ success: false, message: 'Valid email is required' });
      if (email !== user.email) {
        if (!req.body.currentPassword || !(await user.matchPassword(req.body.currentPassword)))
          return res.status(400).json({ success: false, message: 'Enter your current password to change your email' });
        if (await User.exists({ email, _id: { $ne: user._id } }) || await Employee.exists({ email, userId: { $ne: user._id } }))
          return res.status(400).json({ success: false, message: 'This email is already in use' });
        updates.email = email;
      }
    }

    const previousEmail = user.email;
    Object.assign(user, updates);
    await user.save();
    // Employees log in with the email on their employee record, so keep both in sync
    if (user.role === 'Employee' && updates.email) {
      await Employee.updateOne({ $or: [{ userId: user._id }, { email: previousEmail }] }, { email: user.email, userId: user._id });
    }

    res.json({
      success: true,
      message: 'Profile updated',
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, companyId: user.companyId, isSuperAdmin: isSuperAdminUser(user) },
    });
  } catch (err) { sendError(res, err); }
};
