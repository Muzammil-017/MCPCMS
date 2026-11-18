/**
 * MCPCMS Payroll Calculation Engine
 * ─────────────────────────────────
 * Gross  = Basic + HRA + Allowances + Medical + Travel
 * PF     = 12% of Basic (capped at ₹1800)
 * ESI    = 0.75% of Gross (only if gross <= 21000)
 * TDS    = 10% of (Gross - 250000/12) if applicable
 * Net    = Gross - PF - ESI - TDS - Other Deductions
 */
const calculatePayroll = (salary, presentDays = 26, workingDays = 26) => {
  const { basicSalary = 0, hra = 0, allowances = 0, medicalAllowance = 0, travelAllowance = 0, deductions = 0 } = salary;

  // Pro-rate based on attendance
  const ratio = workingDays > 0 ? presentDays / workingDays : 1;

  const basic  = parseFloat((basicSalary * ratio).toFixed(2));
  const hraAmt = parseFloat((hra * ratio).toFixed(2));
  const allAmt = parseFloat(((allowances + medicalAllowance + travelAllowance) * ratio).toFixed(2));

  const grossSalary = parseFloat((basic + hraAmt + allAmt).toFixed(2));

  // PF: 12% of basic, max ₹1800/month
  const pfDeduction = parseFloat(Math.min(basic * 0.12, 1800).toFixed(2));

  // ESI: 0.75% only if gross <= 21000
  const esiDeduction = grossSalary <= 21000 ? parseFloat((grossSalary * 0.0075).toFixed(2)) : 0;

  // TDS: simplified 10% on income above exemption (250000/12 per month)
  const monthlyExemption = 250000 / 12;
  const tdsDeduction = grossSalary > monthlyExemption
    ? parseFloat(((grossSalary - monthlyExemption) * 0.10).toFixed(2))
    : 0;

  const totalDeductions = pfDeduction + esiDeduction + tdsDeduction + deductions;
  const netSalary = parseFloat((grossSalary - totalDeductions).toFixed(2));

  return {
    basicSalary: basic,
    hra: hraAmt,
    allowances: allAmt,
    grossSalary,
    pfDeduction,
    esiDeduction,
    tdsDeduction,
    otherDeductions: deductions,
    netSalary: Math.max(netSalary, 0),
    presentDays,
    workingDays,
  };
};

/**
 * Loss of Pay (LOP) days for one employee in one month.
 * Employees are paid for the full month by default; only recorded absences reduce pay:
 *   Absent = 1 day, Half-Day = 0.5 day, approved Unpaid leave = 1 day per calendar day in the month.
 * A day marked Present / WFH / Holiday / Leave is never LOP, even if it falls inside an Unpaid leave;
 * a Half-Day inside an Unpaid leave stays 0.5. Unmarked days are paid.
 */
const ATTENDANCE_LOP = { Absent: 1, 'Half-Day': 0.5 };

const daysOfLeaveInMonth = (leave, month) => {
  const days = [];
  const end = new Date(`${leave.toDate}T00:00:00Z`);
  for (let d = new Date(`${leave.fromDate}T00:00:00Z`); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const day = d.toISOString().slice(0, 10);
    if (day.startsWith(month)) days.push(day);
  }
  return days;
};

const calculateLopDays = (attendanceRecords = [], unpaidLeaves = [], month) => {
  const lopByDate = {};
  const markedDates = new Set();
  attendanceRecords.forEach(record => {
    markedDates.add(record.date);
    if (ATTENDANCE_LOP[record.status]) lopByDate[record.date] = ATTENDANCE_LOP[record.status];
  });
  unpaidLeaves.forEach(leave => {
    daysOfLeaveInMonth(leave, month).forEach(day => {
      if (!markedDates.has(day)) lopByDate[day] = 1;
    });
  });
  return Object.values(lopByDate).reduce((sum, value) => sum + value, 0);
};

module.exports = { calculatePayroll, calculateLopDays };
