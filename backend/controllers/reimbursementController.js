const Employee = require('../models/Employee');
const Reimbursement = require('../models/Reimbursement');
const { tenantFilter } = require('../middleware/authMiddleware');
const { saveFile, getFile, deleteFile, isGridFsRef } = require('../services/fileStorageService');
const { sendError } = require('../services/errorService');
const { notify } = require('../services/notificationService');

const getCurrentEmployee = async (user) => Employee.findOne({
  isActive: true,
  $or: [{ userId: user._id }, { email: user.email }]
});

exports.createReimbursement = async (req, res) => {
  try {
    const employee = await getCurrentEmployee(req.user);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee profile not found' });

    const { category, amount, expenseDate, description } = req.body;
    if (!category || !amount || !expenseDate || !description)
      return res.status(400).json({ success: false, message: 'category, amount, expenseDate and description are required' });
    if (Number(amount) <= 0)
      return res.status(400).json({ success: false, message: 'Amount must be greater than zero' });
    if (!req.file)
      return res.status(400).json({ success: false, message: 'Bill file is required' });

    const billRef = await saveFile({
      file: req.file,
      metadata: { companyId: employee.companyId, employeeId: employee._id }
    });

    let reimbursement;
    try {
      reimbursement = await Reimbursement.create({
        employeeId: employee._id,
        companyId: employee.companyId,
        category,
        amount: Number(amount),
        expenseDate,
        description,
        billFile: billRef,
        billOriginalName: req.file.originalname
      });
    } catch (err) {
      await deleteFile(billRef, { bucket: 'bills' });
      throw err;
    }

    res.status(201).json({ success: true, reimbursement });
  } catch (err) {
    sendError(res, err);
  }
};

exports.getReimbursementBill = async (req, res) => {
  try {
    const filter = tenantFilter(req, { _id: req.params.id });
    const reimbursement = await Reimbursement.findOne(filter);
    if (!reimbursement) return res.status(404).json({ success: false, message: 'Reimbursement not found' });
    if (!reimbursement.billFile) return res.status(404).json({ success: false, message: 'Bill file not found' });

    if (reimbursement.billFile.startsWith('/uploads/')) {
      return res.redirect(reimbursement.billFile);
    }

    // Bills uploaded before the move to MongoDB are still read from Supabase
    const bill = isGridFsRef(reimbursement.billFile)
      ? await getFile(reimbursement.billFile)
      : await require('../services/supabaseStorageService').downloadReimbursementBill(reimbursement.billFile);
    const fileName = String(reimbursement.billOriginalName || 'bill').replace(/"/g, '');
    res.setHeader('Content-Type', bill.contentType);
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    res.send(bill.buffer);
  } catch (err) {
    sendError(res, err);
  }
};

exports.getMyReimbursements = async (req, res) => {
  try {
    const employee = await getCurrentEmployee(req.user);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee profile not found' });
    const reimbursements = await Reimbursement.find({ employeeId: employee._id }).sort({ createdAt: -1 });
    res.json({ success: true, reimbursements });
  } catch (err) {
    sendError(res, err);
  }
};

exports.getReimbursements = async (req, res) => {
  try {
    const filter = tenantFilter(req);
    if (req.query.status) filter.status = req.query.status;
    if (req.query.category) filter.category = req.query.category;
    if (req.isSuperAdmin && req.query.companyId) filter.companyId = req.query.companyId;

    const reimbursements = await Reimbursement.find(filter)
      .populate('employeeId', 'name email employeeCode department position')
      .populate('companyId', 'name')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: reimbursements.length, reimbursements });
  } catch (err) {
    sendError(res, err);
  }
};

exports.updateReimbursementStatus = async (req, res) => {
  try {
    const { status, adminRemarks = '' } = req.body;
    if (!['Pending', 'Approved', 'Rejected'].includes(status))
      return res.status(400).json({ success: false, message: 'Invalid reimbursement status' });

    const filter = tenantFilter(req, { _id: req.params.id });

    const reimbursement = await Reimbursement.findOneAndUpdate(
      filter,
      { status, adminRemarks, reviewedBy: req.user._id, reviewedAt: new Date() },
      { new: true, runValidators: true }
    )
      .populate('employeeId', 'name email employeeCode department position')
      .populate('companyId', 'name')
      .populate('reviewedBy', 'name');

    if (!reimbursement) return res.status(404).json({ success: false, message: 'Reimbursement not found' });
    if (status !== 'Pending') await notify(reimbursement.employeeId, reimbursement.companyId, `Reimbursement ${status.toLowerCase()}`, `Your ${reimbursement.category} claim of INR ${reimbursement.amount} was ${status.toLowerCase()}.` + (adminRemarks ? ` Remarks: ${adminRemarks}` : ''), 'Payroll');
    res.json({ success: true, reimbursement });
  } catch (err) {
    sendError(res, err);
  }
};
