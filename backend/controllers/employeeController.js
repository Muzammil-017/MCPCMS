const Employee = require('../models/Employee');
const SalaryStructure = require('../models/SalaryStructure');
const User = require('../models/User');
const Company = require('../models/Company');
const { resolveCompanyId, tenantFilter, assertCompanyAccess } = require('../middleware/authMiddleware');
const { sendError } = require('../services/errorService');
const { passwordError } = require('./authController');
const { rejectDemo } = require('../services/demoGuard');

const employeeFields = [
  'name',
  'email',
  'phone',
  'department',
  'position',
  'dateOfJoining',
  'dateOfBirth',
  'gender',
  'bankAccount',
  'ifscCode',
  'panNumber',
  'pfNumber',
  'esiNumber',
];

const salaryFields = [
  'basicSalary',
  'hra',
  'allowances',
  'medicalAllowance',
  'travelAllowance',
  'deductions',
  'effectiveFrom',
];

const cleanString = value => String(value || '').trim();
const cleanEmail = value => cleanString(value).toLowerCase();
const hasSalaryData = row => salaryFields.some(field => row[field] !== undefined && row[field] !== '');
const toNumber = value => value === undefined || value === '' ? 0 : Number(value);

const buildEmployeePayload = (row, companyId) => {
  const payload = { companyId };
  employeeFields.forEach(field => {
    if (row[field] !== undefined && row[field] !== '') payload[field] = row[field];
  });
  payload.name = cleanString(payload.name);
  payload.email = cleanEmail(payload.email);
  payload.department = cleanString(payload.department);
  payload.position = cleanString(payload.position);
  payload.gender = payload.gender || 'Male';
  return payload;
};

const buildSalaryPayload = (row, employeeId, companyId) => ({
  employeeId,
  companyId,
  basicSalary: toNumber(row.basicSalary),
  hra: toNumber(row.hra),
  allowances: toNumber(row.allowances),
  medicalAllowance: toNumber(row.medicalAllowance),
  travelAllowance: toNumber(row.travelAllowance),
  deductions: toNumber(row.deductions),
  ...(row.effectiveFrom ? { effectiveFrom: row.effectiveFrom } : {}),
});

const validateSalaryPayload = row => {
  if (!hasSalaryData(row)) return;
  if (!row.basicSalary) throw new Error('basicSalary is required when salary fields are provided');
  salaryFields
    .filter(field => field !== 'effectiveFrom')
    .forEach(field => {
      if (row[field] !== undefined && row[field] !== '' && Number.isNaN(Number(row[field]))) {
        throw new Error(`${field} must be a valid number`);
      }
      if (row[field] !== undefined && row[field] !== '' && Number(row[field]) < 0) {
        throw new Error(`${field} cannot be negative`);
      }
    });
};

const getValidCompany = async (companyId) => {
  if (!companyId) return null;
  return Company.findOne({ _id: companyId, isActive: true }).select('_id');
};

exports.createEmployee = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req);
    if (!companyId) return res.status(400).json({ success: false, message: 'companyId is required' });
    if (!assertCompanyAccess(req, companyId)) return res.status(403).json({ success: false, message: 'Access denied for this company' });
    const company = await getValidCompany(companyId);
    if (!company) return res.status(400).json({ success: false, message: 'Valid companyId is required' });

    const missing = ['name', 'email', 'department', 'position'].filter(field => !String(req.body[field] || '').trim());
    if (missing.length)
      return res.status(400).json({ success: false, message: `Missing required field(s): ${missing.join(', ')}` });

    const email = String(req.body.email).trim().toLowerCase();
    const pwError = passwordError(req.body.password);
    if (pwError) return res.status(400).json({ success: false, message: `Login ${pwError.toLowerCase()}` });
    if (await Employee.findOne({ email }))
      return res.status(400).json({ success: false, message: 'Employee email already exists' });

    // Only reuse a leftover employee login from the same company; never link to staff or other companies' accounts
    const existingUser = await User.findOne({ email });
    if (existingUser && (existingUser.role !== 'Employee' || String(existingUser.companyId) !== String(company._id)))
      return res.status(400).json({ success: false, message: 'This email is already used by another account' });

    const { userId: _ignoredUserId, password: _password, isDemo: _isDemo, ...body } = req.body;
    if (existingUser) {
      existingUser.password = req.body.password;
      await existingUser.save();
    }
    const user = existingUser || await User.create({
      name: req.body.name,
      email,
      password: req.body.password,
      role: 'Employee',
      companyId: company._id
    });

    let employee;
    try {
      employee = await Employee.create({ ...body, email, companyId: company._id, userId: user._id });
    } catch (err) {
      if (!existingUser) await User.deleteOne({ _id: user._id });
      throw err;
    }
    res.status(201).json({ success: true, employee });
  } catch (err) { sendError(res, err); }
};

exports.bulkCreateEmployees = async (req, res) => {
  try {
    const rows = Array.isArray(req.body.employees) ? req.body.employees : [];
    if (!rows.length) return res.status(400).json({ success: false, message: 'employees array is required' });
    if (rows.length > 500) return res.status(400).json({ success: false, message: 'Bulk import is limited to 500 employees at a time' });

    const results = [];
    const seenEmails = new Set();

    for (let index = 0; index < rows.length; index += 1) {
      const rowNumber = index + 1;
      const row = rows[index] || {};

      try {
        const companyId = req.isSuperAdmin ? row.companyId : req.tenantId;
        if (!companyId) throw new Error('companyId is required');
        if (!assertCompanyAccess(req, companyId)) throw new Error('Access denied for this company');
        const company = await getValidCompany(companyId);
        if (!company) throw new Error('Valid companyId is required');

        const employeePayload = buildEmployeePayload(row, company._id);
        const missing = ['name', 'email', 'department', 'position'].filter(field => !employeePayload[field]);
        if (missing.length) throw new Error(`Missing required field(s): ${missing.join(', ')}`);

        if (seenEmails.has(employeePayload.email)) throw new Error('Duplicate email in import file');
        seenEmails.add(employeePayload.email);

        const existingEmployee = await Employee.findOne({ email: employeePayload.email });
        if (existingEmployee) throw new Error('Employee email already exists');

        const existingUser = await User.findOne({ email: employeePayload.email });
        if (existingUser && (existingUser.role !== 'Employee' || String(existingUser.companyId) !== String(company._id)))
          throw new Error('This email is already used by another account');
        validateSalaryPayload(row);
        if (passwordError(row.password)) throw new Error(`Login ${passwordError(row.password).toLowerCase()}`);

        let user = existingUser;
        if (!user) {
          user = await User.create({
            name: employeePayload.name,
            email: employeePayload.email,
            password: row.password,
            role: 'Employee',
            companyId: company._id,
          });
        }

        const employee = await Employee.create({ ...employeePayload, userId: user._id });

        let salary = null;
        if (hasSalaryData(row)) {
          salary = await SalaryStructure.create(buildSalaryPayload(row, employee._id, company._id));
          employee.salaryStructureId = salary._id;
          await employee.save();
        }

        results.push({
          row: rowNumber,
          success: true,
          employeeId: employee._id,
          name: employee.name,
          email: employee.email,
          salaryCreated: Boolean(salary),
        });
      } catch (err) {
        results.push({
          row: rowNumber,
          success: false,
          email: row.email,
          message: err.message,
        });
      }
    }

    const created = results.filter(result => result.success).length;
    const failed = results.length - created;
    res.status(created ? 201 : 400).json({ success: failed === 0, created, failed, results });
  } catch (err) {
    sendError(res, err);
  }
};

exports.getEmployees = async (req, res) => {
  try {
    const filter = tenantFilter(req);
    if (req.isSuperAdmin && req.query.companyId) filter.companyId = req.query.companyId;
    if (req.query.department) filter.department = req.query.department;
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
    const employees = await Employee.find(filter)
      .populate('companyId', 'name industry')
      .populate('salaryStructureId')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: employees.length, employees });
  } catch (err) { sendError(res, err); }
};

exports.getEmployee = async (req, res) => {
  try {
    const employee = await Employee.findOne(tenantFilter(req, { _id: req.params.id }))
      .populate('companyId', 'name')
      .populate('salaryStructureId');
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, employee });
  } catch (err) { sendError(res, err); }
};

exports.updateEmployee = async (req, res) => {
  try {
    // Linked login, code and salary link are managed by the system, not editable here
    const { userId, employeeCode, salaryStructureId, password, ...updates } = req.body;
    if (!req.isSuperAdmin) updates.companyId = req.tenantId;

    const current = await Employee.findOne(tenantFilter(req, { _id: req.params.id }));
    if (!current) return res.status(404).json({ success: false, message: 'Employee not found' });
    if (current.isDemo && ((updates.email !== undefined && String(updates.email).trim().toLowerCase() !== current.email) || updates.isActive === false || updates.isActive === 'false'))
      return rejectDemo(res);
    delete updates.isDemo;

    // The login account uses the same email, so an email change must be free across all accounts
    if (updates.email !== undefined) {
      updates.email = String(updates.email).trim().toLowerCase();
      if (updates.email !== current.email) {
        if (await Employee.exists({ email: updates.email, _id: { $ne: current._id } }) ||
            await User.exists({ email: updates.email, _id: { $ne: current.userId } }))
          return res.status(400).json({ success: false, message: 'This email is already in use' });
      }
    }

    const employee = await Employee.findOneAndUpdate({ _id: current._id }, updates, { new: true, runValidators: true })
      .populate('companyId', 'name').populate('salaryStructureId');
    if (current.userId && (updates.email || updates.name)) {
      const loginUpdates = {};
      if (updates.email) loginUpdates.email = employee.email;
      if (updates.name) loginUpdates.name = employee.name;
      await User.updateOne({ _id: current.userId, role: 'Employee' }, loginUpdates);
    }
    res.json({ success: true, employee });
  } catch (err) { sendError(res, err); }
};

exports.deleteEmployee = async (req, res) => {
  try {
    const target = await Employee.findOne(tenantFilter(req, { _id: req.params.id }));
    if (!target) return res.status(404).json({ success: false, message: 'Employee not found' });
    if (target.isDemo) return rejectDemo(res);
    const employee = await Employee.findOneAndDelete({ _id: target._id });
    await SalaryStructure.deleteOne(tenantFilter(req, { employeeId: req.params.id }));
    // Remove the employee's login too, so a deleted employee leaves no active account behind
    if (employee.userId) await User.deleteOne({ _id: employee.userId, role: 'Employee' });
    res.json({ success: true, message: 'Employee deleted' });
  } catch (err) { sendError(res, err); }
};

exports.getDepartments = async (req, res) => {
  try {
    const depts = await Employee.distinct('department', tenantFilter(req));
    res.json({ success: true, departments: depts });
  } catch (err) { sendError(res, err); }
};

// PUT /api/employee/:id/password  { password }  -> admin/HR sets a new login password for an employee
exports.resetEmployeePassword = async (req, res) => {
  try {
    const error = passwordError(req.body.password);
    if (error) return res.status(400).json({ success: false, message: error });
    const employee = await Employee.findOne(tenantFilter(req, { _id: req.params.id }));
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    if (employee.isDemo) return rejectDemo(res);

    let user = employee.userId ? await User.findById(employee.userId) : null;
    if (!user || user.role !== 'Employee') {
      user = await User.create({ name: employee.name, email: employee.email, password: req.body.password, role: 'Employee', companyId: employee.companyId });
      employee.userId = user._id;
      await employee.save();
    } else {
      user.password = req.body.password;
      await user.save();
    }
    res.json({ success: true, message: `Login password updated for ${employee.name}` });
  } catch (err) { sendError(res, err); }
};
