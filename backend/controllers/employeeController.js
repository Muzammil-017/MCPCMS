const Employee = require('../models/Employee');
const SalaryStructure = require('../models/SalaryStructure');

exports.createEmployee = async (req, res) => {
  try {
    if (await Employee.findOne({ email: req.body.email }))
      return res.status(400).json({ success: false, message: 'Employee email already exists' });
    const employee = await Employee.create(req.body);
    res.status(201).json({ success: true, employee });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getEmployees = async (req, res) => {
  try {
    const filter = {};
    if (req.query.companyId) filter.companyId = req.query.companyId;
    if (req.query.department) filter.department = req.query.department;
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
    const employees = await Employee.find(filter)
      .populate('companyId', 'name industry')
      .populate('salaryStructureId')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: employees.length, employees });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('companyId', 'name')
      .populate('salaryStructureId');
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, employee });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.updateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('companyId', 'name').populate('salaryStructureId');
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, employee });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    await SalaryStructure.deleteOne({ employeeId: req.params.id });
    res.json({ success: true, message: 'Employee deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getDepartments = async (req, res) => {
  try {
    const depts = await Employee.distinct('department');
    res.json({ success: true, departments: depts });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
