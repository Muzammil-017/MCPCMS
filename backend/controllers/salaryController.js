const SalaryStructure = require('../models/SalaryStructure');
const Employee = require('../models/Employee');
const { tenantFilter } = require('../middleware/authMiddleware');
const { sendError } = require('../services/errorService');

exports.createSalaryStructure = async (req, res) => {
  try {
    const { employeeId } = req.body;
    const employee = await Employee.findOne(tenantFilter(req, { _id: employeeId }));
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found in your company' });
    const salary = await SalaryStructure.findOneAndUpdate(
      { employeeId },
      { ...req.body, companyId: employee.companyId },
      { upsert: true, new: true, runValidators: true }
    );
    await Employee.findByIdAndUpdate(employeeId, { salaryStructureId: salary._id });
    res.status(201).json({ success: true, salary });
  } catch (err) { sendError(res, err); }
};

exports.getSalaryStructures = async (req, res) => {
  try {
    const filter = tenantFilter(req, req.query.employeeId ? { employeeId: req.query.employeeId } : {});
    const salaries = await SalaryStructure.find(filter).populate('employeeId', 'name department companyId');
    res.json({ success: true, salaries });
  } catch (err) { sendError(res, err); }
};

exports.getSalaryStructure = async (req, res) => {
  try {
    const employee = await Employee.findOne(tenantFilter(req, { _id: req.params.employeeId }));
    if (!employee) return res.status(404).json({ success: false, message: 'Salary structure not found' });
    const salary = await SalaryStructure.findOne({ employeeId: req.params.employeeId }).populate('employeeId', 'name');
    if (!salary) return res.status(404).json({ success: false, message: 'Salary structure not found' });
    res.json({ success: true, salary });
  } catch (err) { sendError(res, err); }
};
