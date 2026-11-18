const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Employee = require('../models/Employee');
const { sendError } = require('../services/errorService');

const generateToken = (user) => jwt.sign({ id: user._id, role: 'Employee', tv: user.tokenVersion || 0 }, process.env.JWT_SECRET, { expiresIn: '7d' });

exports.login = async (req, res) => {
  try {
    const identifier = String(req.body.identifier || '').trim();
    const { password } = req.body;
    if (!identifier || !password)
      return res.status(400).json({ success: false, message: 'Employee ID or email and password are required' });

    const employee = await Employee.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { employeeCode: identifier.toUpperCase() }
      ],
      isActive: true
    }).populate('companyId', 'name').populate('userId');

    if (!employee)
      return res.status(401).json({ success: false, message: 'Invalid employee credentials' });

    const user = employee.userId?._id
      ? await User.findById(employee.userId._id).select('+password')
      : await User.findOne({ email: employee.email, role: 'Employee' }).select('+password');

    if (!user || user.role !== 'Employee' || !user.isActive || !(await user.matchPassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid employee credentials' });

    if (!employee.userId) {
      employee.userId = user._id;
      await employee.save();
    }

    res.json({
      success: true,
      token: generateToken(user),
      user: {
        _id: user._id,
        employeeId: employee._id,
        employeeCode: employee.employeeCode,
        name: employee.name,
        email: employee.email,
        role: 'Employee',
        companyId: employee.companyId?._id || employee.companyId,
        companyName: employee.companyId?.name,
      }
    });
  } catch (err) {
    sendError(res, err);
  }
};
