const ExcelJS = require('exceljs');
const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');

exports.exportPayrollExcel = async (req, res) => {
  try {
    const { month, companyId } = req.query;
    const filter = {};
    if (month) filter.payrollMonth = month;
    if (companyId) filter.companyId = companyId;

    const payrolls = await Payroll.find(filter)
      .populate('employeeId', 'name email department position employeeCode')
      .populate('companyId', 'name');

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'MCPCMS';
    const sheet = workbook.addWorksheet(`Payroll_${month || 'All'}`);

    // Style header
    sheet.columns = [
      { header: 'Emp Code', key: 'code', width: 12 },
      { header: 'Name', key: 'name', width: 22 },
      { header: 'Department', key: 'dept', width: 18 },
      { header: 'Month', key: 'month', width: 12 },
      { header: 'Basic', key: 'basic', width: 14 },
      { header: 'HRA', key: 'hra', width: 12 },
      { header: 'Allowances', key: 'allow', width: 14 },
      { header: 'Gross', key: 'gross', width: 14 },
      { header: 'PF', key: 'pf', width: 12 },
      { header: 'ESI', key: 'esi', width: 12 },
      { header: 'TDS', key: 'tds', width: 12 },
      { header: 'Net Salary', key: 'net', width: 16 },
      { header: 'Status', key: 'status', width: 12 },
    ];

    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A237E' } };
    sheet.getRow(1).alignment = { horizontal: 'center' };

    payrolls.forEach(p => {
      sheet.addRow({
        code: p.employeeId?.employeeCode || '',
        name: p.employeeId?.name || '',
        dept: p.employeeId?.department || '',
        month: p.payrollMonth,
        basic: p.basicSalary,
        hra: p.hra,
        allow: p.allowances,
        gross: p.grossSalary,
        pf: p.pfDeduction,
        esi: p.esiDeduction,
        tds: p.tdsDeduction,
        net: p.netSalary,
        status: p.status,
      });
    });

    // Total row
    const lastRow = sheet.lastRow.number + 1;
    sheet.addRow({
      code: '', name: 'TOTAL', dept: '',
      month: '', basic: '', hra: '', allow: '',
      gross: { formula: `SUM(H2:H${lastRow - 1})` },
      pf: { formula: `SUM(I2:I${lastRow - 1})` },
      esi: { formula: `SUM(J2:J${lastRow - 1})` },
      tds: { formula: `SUM(K2:K${lastRow - 1})` },
      net: { formula: `SUM(L2:L${lastRow - 1})` },
    });
    sheet.getRow(lastRow).font = { bold: true };
    sheet.getRow(lastRow).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Payroll_${month || 'All'}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.exportAttendanceExcel = async (req, res) => {
  try {
    const { month, companyId } = req.query;
    const filter = {};
    if (month) filter.month = month;
    if (companyId) {
      const emps = await Employee.find({ companyId }).select('_id');
      filter.employeeId = { $in: emps.map(e => e._id) };
    }
    const records = await Attendance.find(filter).populate('employeeId', 'name department employeeCode');

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(`Attendance_${month || 'All'}`);
    sheet.columns = [
      { header: 'Emp Code', key: 'code', width: 12 },
      { header: 'Name', key: 'name', width: 22 },
      { header: 'Department', key: 'dept', width: 18 },
      { header: 'Date', key: 'date', width: 14 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Check In', key: 'checkIn', width: 12 },
      { header: 'Check Out', key: 'checkOut', width: 12 },
    ];
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A237E' } };

    records.forEach(r => {
      sheet.addRow({
        code: r.employeeId?.employeeCode || '',
        name: r.employeeId?.name || '',
        dept: r.employeeId?.department || '',
        date: r.date, status: r.status,
        checkIn: r.checkIn || '—', checkOut: r.checkOut || '—',
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Attendance_${month || 'All'}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
