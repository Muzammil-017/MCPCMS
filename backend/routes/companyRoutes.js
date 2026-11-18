const express = require('express');
const router = express.Router();
const { createCompany, getCompanies, getCompany, updateCompany, deleteCompany } = require('../controllers/companyController');
const { protect, staffOnly, superAdminOnly, adminOnly } = require('../middleware/authMiddleware');
router.use(protect, staffOnly);
router.post('/', superAdminOnly, createCompany);
router.get('/', getCompanies);
router.get('/:id', getCompany);
router.put('/:id', adminOnly, updateCompany);
router.delete('/:id', superAdminOnly, deleteCompany);

// Company admin accounts, managed by the SuperAdmin
const { getAdmins, createAdmin, updateAdmin, resetAdminPassword } = require('../controllers/companyAdminController');
router.get('/:id/admins', superAdminOnly, getAdmins);
router.post('/:id/admins', superAdminOnly, createAdmin);
router.put('/:id/admins/:userId', superAdminOnly, updateAdmin);
router.put('/:id/admins/:userId/password', superAdminOnly, resetAdminPassword);
module.exports = router;
