const jwt = require('jsonwebtoken');
const User = require('../models/User');

const SUPER_ADMIN_ROLES = ['SuperAdmin'];
const STAFF_ROLES = ['SuperAdmin', 'Admin', 'HR'];

const isSuperAdminUser = (user) =>
  Boolean(user && (SUPER_ADMIN_ROLES.includes(user.role) || (user.role === 'Admin' && !user.companyId)));

const protect = async (req, res, next) => {
  let token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Not authorized, no token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user || !req.user.isActive) return res.status(401).json({ message: 'User inactive or not found' });
    if (req.user.isTokenOutdated(decoded))
      return res.status(401).json({ message: 'Password was changed. Please log in again.' });
    req.isSuperAdmin = isSuperAdminUser(req.user);
    req.tenantId = req.isSuperAdmin ? null : req.user.companyId;
    if (!req.isSuperAdmin && !req.tenantId) {
      return res.status(403).json({ message: 'User is not assigned to a company' });
    }
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token invalid or expired' });
  }
};

const requireRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) return res.status(403).json({ message: 'Access denied' });
  next();
};

const adminOnly = (req, res, next) => {
  if (!['SuperAdmin', 'Admin'].includes(req.user?.role)) return res.status(403).json({ message: 'Admin access only' });
  next();
};

// The company's own Admin (not SuperAdmin, not HR)
const companyAdminOnly = (req, res, next) => {
  if (req.user?.role !== 'Admin' || req.isSuperAdmin) return res.status(403).json({ message: 'Company admin access only' });
  next();
};

const superAdminOnly = (req, res, next) => {
  if (!req.isSuperAdmin) return res.status(403).json({ message: 'Super admin access only' });
  next();
};

const employeeOnly = (req, res, next) => {
  if (req.user?.role !== 'Employee')
    return res.status(403).json({ message: 'Access denied' });
  next();
};

const staffOnly = (req, res, next) => {
  if (!STAFF_ROLES.includes(req.user?.role))
    return res.status(403).json({ message: 'Staff access only' });
  next();
};

const companyStaffOnly = (req, res, next) => {
  if (!STAFF_ROLES.includes(req.user?.role))
    return res.status(403).json({ message: 'Staff access only' });
  if (req.isSuperAdmin)
    return res.status(403).json({ message: 'Super admin can manage companies only' });
  next();
};

const tenantFilter = (req, base = {}) => {
  if (req.isSuperAdmin) return { ...base };
  return { ...base, companyId: req.tenantId };
};

const requestedCompanyId = (req, source = req.body) =>
  source?.companyId || req.query?.companyId || req.params?.companyId;

const resolveCompanyId = (req, source = req.body) => {
  if (req.isSuperAdmin) return requestedCompanyId(req, source);
  return req.tenantId;
};

const assertCompanyAccess = (req, companyId) => {
  if (req.isSuperAdmin) return true;
  return companyId && String(companyId) === String(req.tenantId);
};

module.exports = {
  protect,
  requireRoles,
  adminOnly,
  companyAdminOnly,
  superAdminOnly,
  employeeOnly,
  staffOnly,
  companyStaffOnly,
  tenantFilter,
  resolveCompanyId,
  assertCompanyAccess,
  isSuperAdminUser,
};
