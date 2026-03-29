const SalaryStructure = require('../models/SalaryStructure');
const Employee = require('../models/Employee');

exports.createSalaryStructure = async (req, res) => {
  try {
    const { employeeId } = req.body;
    const salary = await SalaryStructure.findOneAndUpdate(
      { employeeId },
      { ...req.body },
      { upsert: true, new: true, runValidators: true }
    );
    await Employee.findByIdAndUpdate(employeeId, { salaryStructureId: salary._id });
    res.status(201).json({ success: true, salary });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getSalaryStructures = async (req, res) => {
  try {
    const filter = req.query.employeeId ? { employeeId: req.query.employeeId } : {};
    const salaries = await SalaryStructure.find(filter).populate('employeeId', 'name department companyId');
    res.json({ success: true, salaries });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getSalaryStructure = async (req, res) => {
  try {
    const salary = await SalaryStructure.findOne({ employeeId: req.params.employeeId }).populate('employeeId', 'name');
    if (!salary) return res.status(404).json({ success: false, message: 'Salary structure not found' });
    res.json({ success: true, salary });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
