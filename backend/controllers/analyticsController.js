const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const Company = require('../models/Company');
const Compliance = require('../models/Compliance');
const Attendance = require('../models/Attendance');
const { sendError } = require('../services/errorService');

const getCompanyFilter = (req) => req.tenantId || null;

exports.getOverview = async (req, res) => {
  try {
    const companyId = getCompanyFilter(req);
    const companyFilter = companyId ? { companyId } : {};
    const activeFilter = companyId ? { companyId, isActive: true } : { isActive: true };

    const [companies, employees, payrolls, compliance] = await Promise.all([
      companyId ? Company.countDocuments({ _id: companyId, isActive: true }) : Company.countDocuments({ isActive: true }),
      Employee.countDocuments(activeFilter),
      Payroll.find(companyFilter),
      Compliance.find(companyFilter),
    ]);

    const totalPayout = payrolls.reduce((s, p) => s + p.netSalary, 0);
    const avgSalary = payrolls.length ? totalPayout / payrolls.length : 0;
    const compliantCount = compliance.filter(c => c.status === 'Compliant').length;
    const thisMonth = new Date().toISOString().substring(0, 7);
    const thisMonthPayrolls = payrolls.filter(p => p.payrollMonth === thisMonth);
    const thisMonthPayout = thisMonthPayrolls.reduce((s, p) => s + p.netSalary, 0);

    res.json({ success: true, data: { companies, employees, totalPayrollRecords: payrolls.length, totalPayout, avgSalary, compliantCount, thisMonthPayout, thisMonthPayrolls: thisMonthPayrolls.length } });
  } catch (err) { sendError(res, err); }
};

exports.getPayrollTrends = async (req, res) => {
  try {
    const companyId = getCompanyFilter(req);
    const filter = companyId ? { companyId } : {};
    const payrolls = await Payroll.find(filter).sort({ payrollMonth: 1 });
    const map = {};
    payrolls.forEach(p => {
      if (!map[p.payrollMonth]) map[p.payrollMonth] = { month: p.payrollMonth, gross: 0, net: 0, pf: 0, esi: 0, tds: 0, count: 0 };
      map[p.payrollMonth].gross += p.grossSalary;
      map[p.payrollMonth].net += p.netSalary;
      map[p.payrollMonth].pf += p.pfDeduction;
      map[p.payrollMonth].esi += p.esiDeduction;
      map[p.payrollMonth].tds += p.tdsDeduction;
      map[p.payrollMonth].count += 1;
    });
    res.json({ success: true, data: Object.values(map) });
  } catch (err) { sendError(res, err); }
};

exports.getDepartmentSalary = async (req, res) => {
  try {
    const companyId = getCompanyFilter(req);
    const filter = companyId ? { companyId, isActive: true } : { isActive: true };
    const employees = await Employee.find(filter).populate('salaryStructureId');
    const map = {};
    employees.forEach(emp => {
      const dept = emp.department || 'Unknown';
      if (!map[dept]) map[dept] = { department: dept, total: 0, count: 0 };
      if (emp.salaryStructureId) {
        const gross = emp.salaryStructureId.basicSalary + emp.salaryStructureId.hra + emp.salaryStructureId.allowances;
        map[dept].total += gross;
        map[dept].count += 1;
      }
    });
    const result = Object.values(map).map(d => ({ ...d, avgSalary: d.count ? Math.round(d.total / d.count) : 0 }));
    res.json({ success: true, data: result });
  } catch (err) { sendError(res, err); }
};

exports.getCompanyComparison = async (req, res) => {
  try {
    const companyId = getCompanyFilter(req);
    const companies = companyId
      ? await Company.find({ _id: companyId, isActive: true })
      : await Company.find({ isActive: true });

    const result = await Promise.all(companies.map(async company => {
      const employees = await Employee.find({ companyId: company._id, isActive: true });
      const empIds = employees.map(e => e._id);
      const payrolls = await Payroll.find({ companyId: company._id });
      const totalNet = payrolls.reduce((s, p) => s + p.netSalary, 0);
      const compliance = await Compliance.findOne({ companyId: company._id }).sort({ month: -1 });
      return {
        company: company.name, industry: company.industry,
        employees: employees.length,
        totalPayout: Math.round(totalNet),
        avgPayout: employees.length ? Math.round(totalNet / employees.length) : 0,
        complianceStatus: compliance?.status || 'Not Checked',
      };
    }));
    res.json({ success: true, data: result });
  } catch (err) { sendError(res, err); }
};

exports.getComplianceStatus = async (req, res) => {
  try {
    const companyId = getCompanyFilter(req);
    const filter = companyId ? { companyId } : {};
    const records = await Compliance.find(filter).populate('companyId', 'name').sort({ month: -1 });
    const summary = { Compliant: 0, 'Non-Compliant': 0, Partial: 0 };
    records.forEach(r => { if (summary[r.status] !== undefined) summary[r.status]++; });
    res.json({ success: true, data: { records, summary } });
  } catch (err) { sendError(res, err); }
};

exports.getAttendanceSummary = async (req, res) => {
  try {
    const companyId = getCompanyFilter(req);
    const { month = new Date().toISOString().substring(0, 7) } = req.query;
    let filter = { month };
    if (companyId) {
      const emps = await Employee.find({ companyId }).select('_id');
      filter.employeeId = { $in: emps.map(e => e._id) };
    }
    const records = await Attendance.find(filter);
    const summary = {
      Present: records.filter(r => r.status === 'Present').length,
      Absent: records.filter(r => r.status === 'Absent').length,
      'Half-Day': records.filter(r => r.status === 'Half-Day').length,
      Leave: records.filter(r => r.status === 'Leave').length,
      WFH: records.filter(r => r.status === 'WFH').length,
    };
    res.json({ success: true, data: summary });
  } catch (err) { sendError(res, err); }
};
