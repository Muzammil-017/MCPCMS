const PDFDocument = require('pdfkit');

const generatePayslipPDF = (data, res) => {
  const { employee, payroll, company } = data;
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=Payslip_${employee.employeeCode || employee._id}_${payroll.payrollMonth}.pdf`);
  doc.pipe(res);

  const W = doc.page.width - 80;

  // Header bar
  doc.rect(40, 40, W, 70).fill('#1a237e');
  doc.fillColor('#fff').fontSize(20).font('Helvetica-Bold').text(company?.name || 'Company', 55, 52);
  doc.fontSize(9).font('Helvetica').text('SALARY SLIP', 55, 76);
  doc.text(`Pay Period: ${payroll.payrollMonth}`, 40, 56, { align: 'right', width: W });
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 40, 70, { align: 'right', width: W });

  let y = 125;

  // Employee Info box
  doc.rect(40, y, W, 85).fillAndStroke('#f5f7ff', '#e0e4f0');
  doc.fillColor('#1a237e').fontSize(10).font('Helvetica-Bold').text('EMPLOYEE DETAILS', 55, y + 10);
  doc.fillColor('#333').font('Helvetica').fontSize(9);
  const col1 = 55, col2 = 220, col3 = 380;
  const labelStyle = { width: 90 };
  y += 26;
  doc.font('Helvetica-Bold').text('Name:', col1, y).font('Helvetica').text(employee.name, col1 + 55, y);
  doc.font('Helvetica-Bold').text('Emp Code:', col2, y).font('Helvetica').text(employee.employeeCode || '—', col2 + 65, y);
  doc.font('Helvetica-Bold').text('Department:', col3, y).font('Helvetica').text(employee.department, col3 + 70, y);
  y += 18;
  doc.font('Helvetica-Bold').text('Email:', col1, y).font('Helvetica').text(employee.email, col1 + 55, y);
  doc.font('Helvetica-Bold').text('Position:', col2, y).font('Helvetica').text(employee.position, col2 + 65, y);
  doc.font('Helvetica-Bold').text('Working Days:', col3, y).font('Helvetica').text(`${payroll.presentDays}/${payroll.workingDays}`, col3 + 80, y);

  y = 230;

  // Earnings + Deductions side by side
  const halfW = (W - 10) / 2;
  doc.rect(40, y, halfW, 160).fillAndStroke('#fff', '#e0e4f0');
  doc.rect(40 + halfW + 10, y, halfW, 160).fillAndStroke('#fff', '#e0e4f0');

  // Earnings header
  doc.rect(40, y, halfW, 24).fill('#1a237e');
  doc.fillColor('#fff').fontSize(9).font('Helvetica-Bold').text('EARNINGS', 55, y + 8);
  doc.text('AMOUNT (₹)', 40, y + 8, { align: 'right', width: halfW + 40 - 15 });

  // Deductions header
  doc.rect(40 + halfW + 10, y, halfW, 24).fill('#b71c1c');
  doc.fillColor('#fff').text('DEDUCTIONS', 55 + halfW + 10, y + 8);
  doc.text('AMOUNT (₹)', 40 + halfW + 10, y + 8, { align: 'right', width: halfW + 40 - 15 });

  const earnings = [
    ['Basic Salary', payroll.basicSalary],
    ['HRA', payroll.hra],
    ['Allowances', payroll.allowances],
  ];
  const deductions = [
    ['PF (12% of Basic)', payroll.pfDeduction],
    ['ESI (0.75%)', payroll.esiDeduction],
    ['TDS', payroll.tdsDeduction],
    ['Other Deductions', payroll.otherDeductions],
  ];

  doc.fillColor('#333').font('Helvetica').fontSize(9);
  let ey = y + 34, dy = y + 34;

  earnings.forEach(([l, v]) => {
    doc.text(l, 55, ey).text(`₹ ${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 40, ey, { align: 'right', width: halfW + 40 - 15 });
    ey += 18;
  });

  deductions.forEach(([l, v]) => {
    doc.text(l, 55 + halfW + 10, dy).text(`₹ ${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 40 + halfW + 10, dy, { align: 'right', width: halfW + 40 - 15 });
    dy += 18;
  });

  // Totals row in boxes
  const totalY = y + 136;
  doc.rect(40, totalY, halfW, 24).fill('#e8eaf6');
  doc.fillColor('#1a237e').font('Helvetica-Bold').fontSize(9)
    .text('Gross Salary', 55, totalY + 7)
    .text(`₹ ${Number(payroll.grossSalary).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 40, totalY + 7, { align: 'right', width: halfW + 40 - 15 });

  const totalDed = (payroll.pfDeduction + payroll.esiDeduction + payroll.tdsDeduction + payroll.otherDeductions);
  doc.rect(40 + halfW + 10, totalY, halfW, 24).fill('#ffebee');
  doc.fillColor('#b71c1c')
    .text('Total Deductions', 55 + halfW + 10, totalY + 7)
    .text(`₹ ${Number(totalDed).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 40 + halfW + 10, totalY + 7, { align: 'right', width: halfW + 40 - 15 });

  // Net Salary
  y = 410;
  doc.rect(40, y, W, 50).fill('#1b5e20');
  doc.fillColor('#fff').fontSize(13).font('Helvetica-Bold')
    .text('NET SALARY', 55, y + 16)
    .fontSize(16)
    .text(`₹ ${Number(payroll.netSalary).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 40, y + 14, { align: 'right', width: W });

  // Status
  y += 65;
  doc.fillColor('#555').fontSize(9).font('Helvetica')
    .text(`Payment Status: `, 40, y)
    .font('Helvetica-Bold').fillColor(payroll.status === 'Paid' ? '#2e7d32' : '#e65100')
    .text(payroll.status, 105, y);

  // Footer
  doc.moveTo(40, 760).lineTo(40 + W, 760).strokeColor('#ccc').stroke();
  doc.fillColor('#999').fontSize(7).font('Helvetica')
    .text('This is a computer-generated payslip and is valid without a signature.', 40, 768, { align: 'center', width: W });
  doc.text(`MCPCMS — Multi-Company Payroll & Compliance Management System`, 40, 778, { align: 'center', width: W });

  doc.end();
};

module.exports = { generatePayslipPDF };
