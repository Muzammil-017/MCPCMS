import { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import { exportAttendanceExcel, exportPayrollExcel, getCompanies, getPayroll, getAttendanceSummary, triggerDownload } from '../services/api';
import { useAuth } from '../context/AuthContext';

const currentMonth = new Date().toISOString().slice(0, 7);

export default function Reports() {
  const { isSuperAdmin, companyId } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [filters, setFilters] = useState({ month: currentMonth, companyId: '' });
  const [payrolls, setPayrolls] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState({ text: '', type: 'success' });

  const toast = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: 'success' }), 4000);
  };

  useEffect(() => {
    getCompanies()
      .then(response => setCompanies(response.data.companies || response.data || []))
      .catch(() => setCompanies([]));
  }, []);

  useEffect(() => {
    const scopedCompanyId = isSuperAdmin ? filters.companyId : companyId;
    Promise.all([
      getPayroll({ month: filters.month, companyId: scopedCompanyId }),
      getAttendanceSummary({ month: filters.month, companyId: scopedCompanyId }),
    ])
      .then(([payrollRes, attendanceRes]) => {
        setPayrolls(payrollRes.data.payrolls || payrollRes.data || []);
        setAttendance(attendanceRes.data.summary || attendanceRes.data.data || attendanceRes.data || {});
      })
      .catch(() => {
        setPayrolls([]);
        setAttendance({});
      });
  }, [filters, companyId, isSuperAdmin]);

  const scopedCompanyId = isSuperAdmin ? filters.companyId : companyId;
  const selectedCompany = companies.find(company => company._id === scopedCompanyId);
  const summary = useMemo(() => ({
    totalRecords: payrolls.length,
    totalNet: payrolls.reduce((sum, item) => sum + (item.netSalary || 0), 0),
    totalGross: payrolls.reduce((sum, item) => sum + (item.grossSalary || 0), 0),
    paid: payrolls.filter(item => item.status === 'Paid').length,
    onHold: payrolls.filter(item => item.status === 'Hold').length,
  }), [payrolls]);

  const attendanceEntries = Object.entries(attendance || {}).filter(([, count]) => Number(count) > 0);
  const fmt = value => `INR ${Number(value || 0).toLocaleString('en-IN')}`;

  const handleExport = async type => {
    setBusy(type);
    try {
      if (type === 'payroll') {
        const response = await exportPayrollExcel({ month: filters.month, companyId: scopedCompanyId });
        triggerDownload(response.data, `Payroll_Report_${filters.month}.xlsx`);
      } else {
        const response = await exportAttendanceExcel({ month: filters.month, companyId: scopedCompanyId });
        triggerDownload(response.data, `Attendance_Report_${filters.month}.xlsx`);
      }
      toast(`${type === 'payroll' ? 'Payroll' : 'Attendance'} report downloaded`);
    } catch {
      toast(`Unable to export ${type} report`, 'error');
    } finally {
      setBusy('');
    }
  };

  const checklist = [
    summary.totalRecords > 0 ? 'Payroll data is available for export.' : 'Run payroll first for the selected period.',
    summary.onHold > 0 ? `${summary.onHold} payroll records are still on hold.` : 'No payroll records are on hold.',
    attendanceEntries.length > 0 ? 'Attendance summary is available for this month.' : 'Attendance summary is empty for this month.',
    selectedCompany ? `Report scope is limited to ${selectedCompany.name}.` : 'Report scope currently includes all companies.',
  ];

  return (
    <div style={{ background: '#f0f2f8', minHeight: '100vh' }}>
      <Navbar />
      <div style={S.container}>
        <div style={S.header}>
          <div>
            <h2 style={S.title}>Reports Center</h2>
            <p style={S.sub}>Export payroll and attendance files with a quick operational summary.</p>
          </div>
        </div>

        {message.text && <div style={{ ...S.toast, background: message.type === 'error' ? '#ffebee' : '#e8f5e9', color: message.type === 'error' ? '#c62828' : '#2e7d32' }}>{message.text}</div>}

        <div style={{ ...S.card, marginBottom: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: '1rem', alignItems: 'end' }}>
            <div>
              <label style={S.label}>Report Month</label>
              <input style={S.input} type="month" value={filters.month} onChange={event => setFilters({ ...filters, month: event.target.value })} />
            </div>
            {isSuperAdmin && (
              <div>
                <label style={S.label}>Company</label>
                <select style={S.input} value={filters.companyId} onChange={event => setFilters({ ...filters, companyId: event.target.value })}>
                  <option value="">All Companies</option>
                  {companies.map(company => <option key={company._id} value={company._id}>{company.name}</option>)}
                </select>
              </div>
            )}
            <button style={{ ...S.btn, background: '#1a237e' }} onClick={() => handleExport('payroll')} disabled={busy === 'payroll'}>
              {busy === 'payroll' ? 'Exporting...' : 'Export Payroll Excel'}
            </button>
            <button style={{ ...S.btn, background: '#2e7d32' }} onClick={() => handleExport('attendance')} disabled={busy === 'attendance'}>
              {busy === 'attendance' ? 'Exporting...' : 'Export Attendance Excel'}
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
          {[
            ['Payroll records', summary.totalRecords, '#1a237e'],
            ['Net payout', fmt(summary.totalNet), '#2e7d32'],
            ['Gross payout', fmt(summary.totalGross), '#e65100'],
            ['Paid records', summary.paid, '#1565c0'],
          ].map(([label, value, color]) => (
            <div key={label} style={{ background: '#fff', borderRadius: '12px', padding: '1rem 1.15rem', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', borderTop: `3px solid ${color}` }}>
              <div style={{ fontSize: '1.3rem', fontWeight: '700', color }}>{value}</div>
              <div style={{ fontSize: '0.8rem', color: '#475467', marginTop: '0.3rem' }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          <div style={S.card}>
            <h3 style={S.cardTitle}>Report Readiness</h3>
            <div style={{ display: 'grid', gap: '0.85rem' }}>
              {checklist.map(item => (
                <div key={item} style={{ padding: '0.85rem 1rem', borderRadius: '10px', background: '#f8fafc', color: '#334155', fontSize: '0.88rem', lineHeight: 1.5 }}>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div style={S.card}>
            <h3 style={S.cardTitle}>Attendance Snapshot</h3>
            {attendanceEntries.length ? (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {attendanceEntries.map(([status, count]) => (
                  <div key={status}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: '#334155', marginBottom: '0.3rem' }}>
                      <span>{status}</span>
                      <strong>{count}</strong>
                    </div>
                    <div style={{ height: '10px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ width: `${(Number(count) / Math.max(...attendanceEntries.map(([, value]) => Number(value)), 1)) * 100}%`, height: '100%', background: '#1a237e' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: '#98a2b3', fontSize: '0.88rem' }}>No attendance summary available for the selected filters.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const S = {
  container: { padding: '1.75rem 2rem 3rem', maxWidth: '1480px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' },
  title: { margin: 0, color: '#0f172a', fontSize: '1.75rem', letterSpacing: '-0.04em' },
  sub: { margin: '0.35rem 0 0', color: '#64748b', fontSize: '0.9rem' },
  card: { background: 'rgba(255,255,255,0.78)', borderRadius: '22px', padding: '1.35rem', boxShadow: '0 18px 50px rgba(15,23,42,0.08)', border: '1px solid rgba(255,255,255,0.72)', backdropFilter: 'blur(18px)' },
  cardTitle: { margin: '0 0 1rem', color: '#0f172a', fontSize: '1rem', letterSpacing: '-0.02em' },
  label: { display: 'block', fontSize: '0.74rem', fontWeight: '750', color: '#334155', marginBottom: '0.3rem' },
  input: { width: '100%', padding: '0.72rem 0.85rem', border: '1.5px solid #dbe3ef', borderRadius: '12px', fontSize: '0.88rem', boxSizing: 'border-box', background: '#fff' },
  btn: { padding: '0.72rem 1.1rem', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '750', cursor: 'pointer', boxShadow: '0 12px 28px rgba(37,99,235,0.18)' },
  toast: { padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.88rem', fontWeight: '500' },
};
