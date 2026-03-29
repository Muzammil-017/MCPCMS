const express = require('express');
const router = express.Router();
const { saveCompliance, getCompliance, autoValidate } = require('../controllers/complianceController');
const { protect } = require('../middleware/authMiddleware');
router.post('/', protect, saveCompliance);
router.get('/', protect, getCompliance);
router.get('/validate/:companyId/:month', protect, autoValidate);
module.exports = router;
