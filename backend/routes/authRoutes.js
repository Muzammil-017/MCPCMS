const express = require('express');
const router = express.Router();
const {
  register, login, getMe, getUsers, updateUser,
  changePassword, forgotPassword, resetPassword, updateProfile,
  getStaff, createStaff, updateStaff, resetStaffPassword, deleteStaff,
} = require('../controllers/authController');
const { protect, companyStaffOnly, superAdminOnly, companyAdminOnly } = require('../middleware/authMiddleware');
const User = require('../models/User');

const isSuperAdminRole = (role) =>
  String(role || '').trim().toLowerCase().replace(/[\s_-]/g, '') === 'superadmin';

const bootstrapOrSuperAdminOnly = async (req, res, next) => {
  try {
    const superAdminExists = await User.exists({ role: 'SuperAdmin' });

    if (!superAdminExists) {
      if (!isSuperAdminRole(req.body?.role)) {
        return res.status(400).json({ success: false, message: 'First user must be a SuperAdmin' });
      }
      req.isSuperAdminBootstrap = true;
      return next();
    }

    return protect(req, res, () => superAdminOnly(req, res, next));
  } catch (err) {
    return next(err);
  }
};

router.post('/register', bootstrapOrSuperAdminOnly, register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/users', protect, companyStaffOnly, getUsers);
router.put('/users/:id', protect, companyAdminOnly, updateUser);

// Passwords
router.put('/change-password', protect, changePassword);
router.put('/profile', protect, updateProfile);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// HR users of the company, managed by its Admin
router.get('/staff', protect, companyAdminOnly, getStaff);
router.post('/staff', protect, companyAdminOnly, createStaff);
router.put('/staff/:id', protect, companyAdminOnly, updateStaff);
router.put('/staff/:id/password', protect, companyAdminOnly, resetStaffPassword);
router.delete('/staff/:id', protect, companyAdminOnly, deleteStaff);

module.exports = router;
