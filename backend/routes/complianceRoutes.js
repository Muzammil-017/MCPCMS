const express = require('express');
const router = express.Router();
const { saveCompliance, getCompliance, autoValidate } = require('../controllers/complianceController');
const { protect, companyStaffOnly } = require('../middleware/authMiddleware');
router.use(protect, companyStaffOnly);
router.post('/', saveCompliance);
router.get('/', getCompliance);
router.get('/validate/:companyId/:month', autoValidate);
module.exports = router;
