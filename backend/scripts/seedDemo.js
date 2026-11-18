/**
 * Creates (or resets) the public demo company "Demo Corp" with realistic data:
 * employees, salary structures, attendance, leave, requests, claims, payroll history with payslips,
 * compliance records and notifications.
 *
 *   cd backend
 *   npm run seed:demo
 *
 * Uses MONGO_URI from backend/.env (or the environment). Only the demo company's data is touched.
 * The three demo logins are flagged isDemo, so visitors cannot change their password/email or delete them.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Company = require('../models/Company');
const User = require('../models/User');
const Employee = require('../models/Employee');
const SalaryStructure = require('../models/SalaryStructure');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const EmployeeRequest = require('../models/EmployeeRequest');
const Reimbursement = require('../models/Reimbursement');
const Payroll = require('../models/Payroll');
const Compliance = require('../models/Compliance');
const Notification = require('../models/Notification');
const { calculatePayroll, calculateLopDays } = require('../services/payrollService');
const { takeSnapshot, issuePayslip } = require('../services/payslipStoreService');
const { saveFile, deleteFile } = require('../services/fileStorageService');

const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'Demo@1234';
const DEMO = {
  company: {
    name: 'Demo Corp', email: 'contact@democorp.example', phone: '9876500000', industry: 'IT',
    address: 'Hitech City, Hyderabad', gstNumber: '36AABCD1234E1Z5', panNumber: 'AABCD1234E',
  },
  admin: { name: 'Demo Admin', email: 'admin@democorp.example' },
  hr: { name: 'Demo HR', email: 'hr@democorp.example' },
};

// The first employee is the shared demo employee login
const EMPLOYEES = [
  { name: 'Aarav Sharma', email: 'employee@democorp.example', department: 'Engineering', position: 'Software Engineer', gender: 'Male', salary: [42000, 16800, 4000, 1250, 1600] },
  { name: 'Diya Patel', email: 'diya.patel@democorp.example', department: 'Engineering', position: 'Senior Software Engineer', gender: 'Female', salary: [65000, 26000, 6000, 1250, 1600] },
  { name: 'Rohan Verma', email: 'rohan.verma@democorp.example', department: 'Engineering', position: 'QA Engineer', gender: 'Male', salary: [32000, 12800, 3000, 1250, 1600] },
  { name: 'Ananya Iyer', email: 'ananya.iyer@democorp.example', department: 'Sales', position: 'Sales Manager', gender: 'Female', salary: [48000, 19200, 5000, 1250, 1600] },
  { name: 'Kabir Singh', email: 'kabir.singh@democorp.example', department: 'Sales', position: 'Sales Executive', gender: 'Male', salary: [14000, 4200, 1000, 0, 800] },
  { name: 'Meera Nair', email: 'meera.nair@democorp.example', department: 'Finance', position: 'Accountant', gender: 'Female', salary: [36000, 14400, 3000, 1250, 1600] },
  { name: 'Vikram Reddy', email: 'vikram.reddy@democorp.example', department: 'Operations', position: 'Operations Lead', gender: 'Male', salary: [40000, 16000, 3500, 1250, 1600] },
  { name: 'Sneha Gupta', email: 'sneha.gupta@democorp.example', department: 'Human Resources', position: 'HR Executive', gender: 'Female', salary: [16000, 4800, 1200, 0, 800] },
];

const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const ym = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
const monthStart = (offset) => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth() + offset, 1); };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

// Deterministic "random" so every reset gives the same demo
const statusFor = (empIndex, day) => {
  const v = (empIndex * 31 + day * 17) % 41;
  if (v === 0) return 'Absent';
  if (v === 1 || v === 2) return 'Half-Day';
  if (v < 8) return 'WFH';
  return 'Present';
};

const removeExistingDemo = async () => {
  const company = await Company.findOne({ email: DEMO.company.email });
  const demoEmails = [DEMO.admin.email, DEMO.hr.email, ...EMPLOYEES.map(e => e.email)];
  if (company) {
    const cid = company._id;
    const [payrolls, claims] = await Promise.all([
      Payroll.find({ companyId: cid }).select('payslipFile'),
      Reimbursement.find({ companyId: cid }).select('billFile'),
    ]);
    await Promise.all([
      ...payrolls.map(p => p.payslipFile && deleteFile(p.payslipFile, { bucket: 'payslips' })),
      ...claims.map(c => c.billFile && deleteFile(c.billFile, { bucket: 'bills' })),
    ]);
    await Promise.all([
      Employee.deleteMany({ companyId: cid }), SalaryStructure.deleteMany({ companyId: cid }),
      Attendance.deleteMany({ companyId: cid }), Leave.deleteMany({ companyId: cid }),
      EmployeeRequest.deleteMany({ companyId: cid }), Reimbursement.deleteMany({ companyId: cid }),
      Payroll.deleteMany({ companyId: cid }), Compliance.deleteMany({ companyId: cid }),
      Notification.deleteMany({ companyId: cid }), User.deleteMany({ companyId: cid }),
    ]);
    await company.deleteOne();
  }
  await Promise.all([User.deleteMany({ email: { $in: demoEmails } }), Employee.deleteMany({ email: { $in: demoEmails } })]);
};

const run = async () => {
  await connectDB();
  console.log('Resetting demo company...');
  await removeExistingDemo();

  const company = await Company.create(DEMO.company);
  const cid = company._id;
  const admin = await User.create({ ...DEMO.admin, password: DEMO_PASSWORD, role: 'Admin', companyId: cid, isDemo: true });
  await User.create({ ...DEMO.hr, password: DEMO_PASSWORD, role: 'HR', companyId: cid, isDemo: true });

  // Employees + salary structures
  const employees = [];
  for (const [i, e] of EMPLOYEES.entries()) {
    const isLogin = i === 0;
    const user = isLogin
      ? await User.create({ name: e.name, email: e.email, password: DEMO_PASSWORD, role: 'Employee', companyId: cid, isDemo: true })
      : null;
    const employee = await Employee.create({
      name: e.name, email: e.email, department: e.department, position: e.position, gender: e.gender,
      phone: `98765${pad(i + 10)}${pad(i * 7 % 100)}0`.slice(0, 10), companyId: cid, userId: user?._id, isDemo: isLogin,
      dateOfJoining: new Date(2024, i % 12, 1 + i), bankAccount: `5010${String(1000000 + i * 7919)}`, ifscCode: 'HDFC0001234',
    });
    const [basicSalary, hra, allowances, medicalAllowance, travelAllowance] = e.salary;
    const salary = await SalaryStructure.create({ employeeId: employee._id, companyId: cid, basicSalary, hra, allowances, medicalAllowance, travelAllowance });
    employee.salaryStructureId = salary._id;
    await employee.save();
    employees.push(employee);
  }
  const loginEmp = employees[0];

  // Attendance: last 3 months + current month up to yesterday, Monday-Saturday
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const attendance = [];
  for (let d = monthStart(-3); d < today; d = addDays(d, 1)) {
    if (d.getDay() === 0) continue;
    employees.forEach((emp, i) => {
      const status = statusFor(i, d.getDate() + d.getMonth() * 31);
      attendance.push({
        employeeId: emp._id, companyId: cid, date: ymd(d), month: ym(d), status,
        checkIn: ['Present', 'Half-Day'].includes(status) ? '09:30' : '', checkOut: status === 'Present' ? '18:15' : status === 'Half-Day' ? '13:30' : '',
      });
    });
  }
  await Attendance.insertMany(attendance);

  // Leave
  const prev = monthStart(-1);
  await Leave.insertMany([
    { employeeId: loginEmp._id, companyId: cid, fromDate: ymd(addDays(prev, 9)), toDate: ymd(addDays(prev, 10)), type: 'Casual', reason: 'Family function', status: 'Approved' },
    { employeeId: loginEmp._id, companyId: cid, fromDate: ymd(addDays(today, 7)), toDate: ymd(addDays(today, 8)), type: 'Sick', reason: 'Medical appointment', status: 'Pending' },
    { employeeId: employees[4]._id, companyId: cid, fromDate: ymd(addDays(prev, 14)), toDate: ymd(addDays(prev, 15)), type: 'Unpaid', reason: 'Personal travel', status: 'Approved' },
    { employeeId: employees[3]._id, companyId: cid, fromDate: ymd(addDays(today, 3)), toDate: ymd(addDays(today, 5)), type: 'Earned', reason: 'Vacation', status: 'Pending' },
  ]);

  // Employee requests
  await EmployeeRequest.insertMany([
    { employeeId: loginEmp._id, companyId: cid, type: 'Work From Home', requestDate: ymd(addDays(today, 2)), details: 'Internet installation at home', status: 'Pending' },
    { employeeId: employees[2]._id, companyId: cid, type: 'Shift Change', requestDate: ymd(addDays(today, 4)), details: 'Move to the morning shift for two weeks', status: 'Approved', adminRemarks: 'Approved for two weeks' },
  ]);

  // Reimbursement claims with a small PDF bill stored in MongoDB
  const billPdf = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 144]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n');
  const bill = name => saveFile({ bucket: 'bills', file: { buffer: billPdf, originalname: name, mimetype: 'application/pdf' }, metadata: { companyId: cid } });
  await Reimbursement.create([
    { employeeId: loginEmp._id, companyId: cid, category: 'Travel', amount: 640, expenseDate: ymd(addDays(today, -3)), description: 'Cab to client office', billFile: await bill('cab-receipt.pdf'), billOriginalName: 'cab-receipt.pdf', status: 'Pending' },
    { employeeId: employees[1]._id, companyId: cid, category: 'Internet', amount: 999, expenseDate: ymd(addDays(prev, 4)), description: 'Monthly broadband', billFile: await bill('broadband-bill.pdf'), billOriginalName: 'broadband-bill.pdf', status: 'Approved', reviewedBy: admin._id, reviewedAt: new Date() },
  ]);

  // Payroll for the last 3 months (older two Paid, last one Processed), payslips stored in MongoDB
  const workingDays = 26;
  for (const offset of [-3, -2, -1]) {
    const month = ym(monthStart(offset));
    for (const emp of employees) {
      const salary = await SalaryStructure.findById(emp.salaryStructureId);
      const records = attendance.filter(a => a.month === month && String(a.employeeId) === String(emp._id));
      const unpaid = await Leave.find({ employeeId: emp._id, type: 'Unpaid', status: 'Approved' });
      const lopDays = Math.min(calculateLopDays(records, unpaid, month), workingDays);
      const paid = offset < -1;
      const payroll = await Payroll.create({
        ...calculatePayroll(salary, workingDays - lopDays, workingDays), lopDays,
        employeeId: emp._id, companyId: cid, payrollMonth: month,
        status: paid ? 'Paid' : 'Processed', paidOn: paid ? monthStart(offset + 1) : undefined,
        ...takeSnapshot(emp, company),
      });
      await issuePayslip(payroll);
    }
  }

  // Compliance
  const statusOf = r => {
    const n = ['pfFiled', 'esiFiled', 'tdsDeducted', 'professionalTaxFiled', 'minimumWageCompliance', 'labourWelfareFund'].filter(k => r[k]).length;
    return n === 6 ? 'Compliant' : n === 0 ? 'Non-Compliant' : 'Partial';
  };
  const complianceRecords = [
    { month: ym(monthStart(-3)), pfFiled: true, esiFiled: true, tdsDeducted: true, professionalTaxFiled: true, minimumWageCompliance: true, labourWelfareFund: true, remarks: 'All filings completed' },
    { month: ym(monthStart(-2)), pfFiled: true, esiFiled: true, tdsDeducted: true, professionalTaxFiled: true, minimumWageCompliance: true, labourWelfareFund: true, remarks: 'All filings completed' },
    { month: ym(monthStart(-1)), pfFiled: true, esiFiled: true, tdsDeducted: true, professionalTaxFiled: false, minimumWageCompliance: true, labourWelfareFund: false, remarks: 'Professional tax and LWF due this week' },
  ];
  await Compliance.insertMany(complianceRecords.map(r => ({ ...r, companyId: cid, status: statusOf(r), checkedBy: admin._id })));

  // Notifications for the demo employee
  await Notification.insertMany([
    { employeeId: loginEmp._id, companyId: cid, title: 'Payslip available', message: `Your payslip for ${ym(prev)} is ready to download.`, type: 'Payroll' },
    { employeeId: loginEmp._id, companyId: cid, title: 'Leave approved', message: 'Your Casual leave was approved.', type: 'Attendance' },
    { employeeId: null, companyId: cid, title: 'Welcome to Demo Corp', message: 'This is a demo company. Feel free to explore every feature.', type: 'Info' },
  ]);

  console.log('Demo company ready:');
  console.log(`  Company admin : ${DEMO.admin.email} / ${DEMO_PASSWORD}`);
  console.log(`  HR            : ${DEMO.hr.email} / ${DEMO_PASSWORD}`);
  console.log(`  Employee      : ${EMPLOYEES[0].email} (or ${loginEmp.employeeCode}) / ${DEMO_PASSWORD}`);
};

run()
  .then(() => mongoose.disconnect())
  .catch(async error => {
    console.error(`Demo seed failed: ${error.message}`);
    await mongoose.disconnect();
    process.exit(1);
  });
