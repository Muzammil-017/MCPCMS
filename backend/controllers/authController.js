const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const sendToken = (user, statusCode, res) => {
  const token = generateToken(user._id);
  res.status(statusCode).json({
    success: true,
    token,
    user: { _id: user._id, name: user.name, email: user.email, role: user.role, companyId: user.companyId }
  });
};

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, companyId } = req.body;
    if (await User.findOne({ email })) return res.status(400).json({ success: false, message: 'Email already registered' });
    const user = await User.create({ name, email, password, role: role || 'HR', companyId });
    sendToken(user, 201, res);
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    sendToken(user, 200, res);
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('companyId', 'name');
    res.json({ success: true, user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/auth/users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().populate('companyId', 'name').sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
