const PDFDocument = require('pdfkit');

// ─── Brand Colors ───────────────────────────────────────────────
const NAVY   = '#0D1B4B';
const INDIGO = '#1A237E';
const ACCENT = '#3949AB';
const GOLD   = '#FFD700';
const WHITE  = '#FFFFFF';
const GREEN  = '#2E7D32';
const RED    = '#C62828';
const GRAY   = '#666666';
const LGRAY  = '#EEEEEE';
const LIGHT  = '#EEF0F8';
const BORDER = '#C5CAE9';

// ─── Helpers ────────────────────────────────────────────────────
const fmt = v =>
  'INR ' + Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

// Draw the circular logo using pdfkit primitives — letters are dynamic
const drawLogo = (doc, cx, cy, companyName, r = 28) => {
  // Get initials: up to 3 chars from company name e.g. "ATS", "CS", "XYZ"
  const initials = (companyName || 'CO')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 3);

  const fontSize = initials.length === 1 ? r * 0.55
                 : initials.length === 2 ? r * 0.46
                 : r * 0.36;

  // Outer circle (accent blue)
  doc.circle(cx, cy, r).fill(ACCENT);
  // White ring
  doc.circle(cx, cy, r * 0.75).fill(WHITE);
  // Navy inner
  doc.circle(cx, cy, r * 0.60).fill(NAVY);
  // Gold dot (top-right)
  doc.circle(cx + r * 0.55, cy - r * 0.55, r * 0.13).fill(GOLD);
  // Initials text
  doc.fillColor(WHITE)
     .font('Helvetica-Bold')
     .fontSize(fontSize)
     .text(initials, cx - r * 0.58, cy - fontSize * 0.42, { lineBreak: false, width: r * 1.16, align: 'center' });
};

// Rounded rect helper (pdfkit doesn't have built-in roundRect)
const roundRect = (doc, x, y, w, h, rx, fillColor, strokeColor) => {
  doc.roundedRect(x, y, w, h, rx);
  if (fillColor && strokeColor) doc.fillAndStroke(fillColor, strokeColor);
  else if (fillColor) doc.fill(fillColor);
  else if (strokeColor) doc.stroke(strokeColor);
};

// ─── Main Generator ─────────────────────────────────────────────
// Builds the payslip PDF in memory and resolves with its bytes
const buildPayslipPDF = (data) => new Promise((resolve, reject) => {
  const { employee, payroll, company } = data;

  const doc = new PDFDocument({ margin: 0, size: 'A4' });
  const chunks = [];
  doc.on('data', chunk => chunks.push(chunk));
  doc.on('end', () => resolve(Buffer.concat(chunks)));
  doc.on('error', reject);

  const PW = doc.page.width;   // 595
  const PH = doc.page.height;  // 842
  const PAD = 22;
  const IW = PW - PAD * 2;     // inner width

  // ── Page border ────────────────────────────────────────────────
  roundRect(doc, 8, 8, PW - 16, PH - 16, 10, null, BORDER);

  // ── HEADER ─────────────────────────────────────────────────────
  doc.rect(0, 0, PW, 88).fill(NAVY);
  doc.rect(0, 88, PW, 3).fill(ACCENT);

  // Logo — initials auto-generated from company name
  drawLogo(doc, PAD + 32, 44, company?.name || 'CO', 28);

  // Company name
  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(18)
     .text(company?.name || 'MCPCMS', PAD + 72, 26, { lineBreak: false });
  doc.fillColor('#9FB3FF').font('Helvetica').fontSize(8.5)
     .text('Multi-Company Payroll & Compliance Management System', PAD + 72, 48, { lineBreak: false });

  // Right: SALARY SLIP label
  doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(13)
     .text('SALARY SLIP', 0, 28, { align: 'right', width: PW - PAD, lineBreak: false });
  doc.fillColor('#C5CAE9').font('Helvetica').fontSize(8.5)
     .text(`Pay Period: ${payroll.payrollMonth}`, 0, 46, { align: 'right', width: PW - PAD, lineBreak: false })
     .text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 0, 59, { align: 'right', width: PW - PAD, lineBreak: false });

  // ── EMPLOYEE DETAILS ───────────────────────────────────────────
  const empY = 100;
  roundRect(doc, PAD, empY, IW, 80, 8, LIGHT, BORDER);

  doc.fillColor(INDIGO).font('Helvetica-Bold').fontSize(10)
     .text('EMPLOYEE DETAILS', PAD + 12, empY + 10, { lineBreak: false });
  // Underline
  doc.moveTo(PAD + 12, empY + 23).lineTo(PAD + 130, empY + 23)
     .lineWidth(1.5).strokeColor(ACCENT).stroke();

  // 3-column layout: col1 | col2 | badge
  // col1: Name, Emp ID, Department
  // col2: Position, Email (truncated safely), Pay Period
  // col3: Working Days badge (fixed right, no overlap)
  const lx1 = PAD + 12, vx1 = PAD + 78;   // col1 label/value
  const lx2 = PAD + 195, vx2 = PAD + 260; // col2 label/value — max width 120 before badge
  const badgeX = PW - PAD - 95;            // badge starts here

  const col1 = [
    ['Name',        employee.name || '—'],
    ['Employee ID', employee.employeeCode || '—'],
    ['Department',  employee.department || '—'],
  ];
  const col2 = [
    ['Position',   employee.position || '—'],
    ['Email',      employee.email || '—'],
    ['Pay Period', payroll.payrollMonth || '—'],
  ];

  col1.forEach(([label, value], i) => {
    const fy = empY + 32 + i * 16;
    doc.fillColor(GRAY).font('Helvetica').fontSize(8.5)
       .text(label + ':', lx1, fy, { lineBreak: false, width: 60 });
    doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(8.5)
       .text(value, vx1, fy, { lineBreak: false, width: 110 });
  });

  col2.forEach(([label, value], i) => {
    const fy = empY + 32 + i * 16;
    doc.fillColor(GRAY).font('Helvetica').fontSize(8.5)
       .text(label + ':', lx2, fy, { lineBreak: false, width: 55 });
    doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(8.5)
       // limit value width so it never runs into badge
       .text(value, vx2, fy, { lineBreak: false, width: badgeX - vx2 - 8, ellipsis: true });
  });

  // Working days badge — safely in its own right column
  roundRect(doc, badgeX, empY + 26, 88, 32, 6, ACCENT, null);
  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(7.5)
     .text(payroll.lopDays ? `PAID DAYS (LOP ${payroll.lopDays})` : 'PAID DAYS', badgeX, empY + 30, { width: 88, align: 'center', lineBreak: false });
  doc.fontSize(12)
     .text(`${payroll.presentDays} / ${payroll.workingDays}`, badgeX, empY + 42, { width: 88, align: 'center', lineBreak: false });

  // ── EARNINGS & DEDUCTIONS ──────────────────────────────────────
  const tblY = 196;
  const colW = (IW - 10) / 2;

  // --- Earnings box ---
  roundRect(doc, PAD, tblY, colW, 170, 6, WHITE, BORDER);
  // Header
  roundRect(doc, PAD, tblY, colW, 26, 6, INDIGO, null);
  doc.rect(PAD, tblY + 14, colW, 12).fill(INDIGO); // square bottom corners
  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(9.5)
     .text('EARNINGS', PAD + 12, tblY + 8, { lineBreak: false });
  doc.text('AMOUNT', PAD, tblY + 8, { width: colW - 12, align: 'right', lineBreak: false });

  const earnings = [
    ['Basic Salary', payroll.basicSalary],
    ['HRA',          payroll.hra],
    ['Allowances',   payroll.allowances],
  ];
  earnings.forEach(([label, val], i) => {
    const ry = tblY + 28 + i * 24;
    if (i % 2 === 0) doc.rect(PAD, ry, colW, 24).fill(LIGHT);
    doc.fillColor('#333333').font('Helvetica').fontSize(9)
       .text(label, PAD + 12, ry + 7, { lineBreak: false });
    doc.fillColor(INDIGO).font('Helvetica-Bold').fontSize(9)
       .text(fmt(val), PAD, ry + 7, { width: colW - 12, align: 'right', lineBreak: false });
  });

  // Gross total row
  const grossY = tblY + 28 + 3 * 24;
  doc.rect(PAD, grossY, colW, 26).fill(INDIGO);
  doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(9.5)
     .text('Gross Salary', PAD + 12, grossY + 8, { lineBreak: false });
  doc.text(fmt(payroll.grossSalary), PAD, grossY + 8, { width: colW - 12, align: 'right', lineBreak: false });

  // --- Deductions box ---
  const dx = PAD + colW + 10;
  roundRect(doc, dx, tblY, colW, 170, 6, WHITE, BORDER);
  roundRect(doc, dx, tblY, colW, 26, 6, RED, null);
  doc.rect(dx, tblY + 14, colW, 12).fill(RED);
  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(9.5)
     .text('DEDUCTIONS', dx + 12, tblY + 8, { lineBreak: false });
  doc.text('AMOUNT', dx, tblY + 8, { width: colW - 12, align: 'right', lineBreak: false });

  const totalDed = (payroll.pfDeduction || 0) + (payroll.esiDeduction || 0) +
                   (payroll.tdsDeduction || 0) + (payroll.otherDeductions || 0);

  const deductions = [
    ['PF (12% of Basic)', payroll.pfDeduction],
    ['ESI (0.75%)',       payroll.esiDeduction],
    ['TDS',               payroll.tdsDeduction],
    ['Other Deductions',  payroll.otherDeductions],
  ];
  deductions.forEach(([label, val], i) => {
    const ry = tblY + 28 + i * 22;
    if (i % 2 === 0) doc.rect(dx, ry, colW, 22).fill('#FFF8F8');
    doc.fillColor('#333333').font('Helvetica').fontSize(9)
       .text(label, dx + 12, ry + 6, { lineBreak: false });
    doc.fillColor(RED).font('Helvetica-Bold').fontSize(9)
       .text(fmt(val), dx, ry + 6, { width: colW - 12, align: 'right', lineBreak: false });
  });

  // Total deductions row
  const dedTotalY = tblY + 28 + 4 * 22;
  doc.rect(dx, dedTotalY, colW, 26).fill(RED);
  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(9.5)
     .text('Total Deductions', dx + 12, dedTotalY + 8, { lineBreak: false });
  doc.text(fmt(totalDed), dx, dedTotalY + 8, { width: colW - 12, align: 'right', lineBreak: false });

  // ── NET SALARY ─────────────────────────────────────────────────
  const netY = 382;
  roundRect(doc, PAD, netY, IW, 68, 10, NAVY, null);

  doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(11)
     .text('NET SALARY', PAD, netY + 12, { width: IW, align: 'center', lineBreak: false });
  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(26)
     .text(fmt(payroll.netSalary), PAD, netY + 26, { width: IW, align: 'center', lineBreak: false });

  // Status badge
  const statusColor = payroll.status === 'Paid' ? GREEN : '#E65100';
  const statusLabel = payroll.status === 'Paid' ? '✓  PAID' : payroll.status?.toUpperCase() || 'PENDING';
  roundRect(doc, PW / 2 - 36, netY + 52, 72, 14, 4, statusColor, null);
  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(7.5)
     .text(statusLabel, PW / 2 - 36, netY + 55, { width: 72, align: 'center', lineBreak: false });

  // ── FOOTER ─────────────────────────────────────────────────────
  doc.moveTo(PAD, 468).lineTo(PW - PAD, 468).lineWidth(0.8).strokeColor(ACCENT).stroke();

  doc.fillColor(GRAY).font('Helvetica-Oblique').fontSize(7.5)
     .text('This is a computer-generated payslip and is valid without a signature.',
           PAD, 476, { width: IW, align: 'center', lineBreak: false });
  doc.text('MCPCMS — Multi-Company Payroll & Compliance Management System',
           PAD, 488, { width: IW, align: 'center', lineBreak: false });

  doc.end();
});

module.exports = { buildPayslipPDF };