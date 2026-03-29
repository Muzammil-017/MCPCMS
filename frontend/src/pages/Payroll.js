import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { runPayroll, getPayroll, getCompanies, updatePayrollStatus, downloadPayslip, exportPayrollExcel, triggerDownload } from '../services/api';

const STATUS_C = { Processed: '#e65100', Paid: '#2e7d32', Hold: '#c62828' };

export default function Payroll() {
  const [payrolls, setPayrolls] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [runForm, setRunForm] = useState({ companyId: '', payrollMonth: new Date().toISOString().substring(0, 7) });
  const [filterMonth, setFilterMonth] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [msg, setMsg] = useState({ text: '', type: 'success' });
  const [running, setRunning] = useState(false);

  const toast = (text, type = 'success') => { setMsg({ text, type }); setTimeout(() => setMsg({ text: '' }), 4000); };

  const load = async () => {
    const [c, p] = await Promise.all([getCompanies(), getPayroll({ month: filterMonth, companyId: filterCompany, status: filterStatus })]);
    setCompanies(c.data.companies || c.data);
    setPayrolls(p.data.payrolls || p.data);
  };
  useEffect(() => { load(); }, [filterMonth, filterCompany, filterStatus]);

  const handleRun = async e => {
    e.preventDefault();
    if (!runForm.companyId) return toast('❌ Select a company', 'error');
    setRunning(true);
    try {
      const r = await runPayroll(runForm);
      toast(`✅ ${r.data.message}`);
      load();
    } catch (err) { toast('❌ ' + (err.response?.data?.message || 'Error'), 'error'); }
    finally { setRunning(false); }
  };

  const handleStatus = async (id, status) => {
    try {
      await updatePayrollStatus(id, status);
      toast(`✅ Status updated to ${status}`);
      load();
    } catch { toast('❌ Error updating status', 'error'); }
  };

  const handlePayslip = async (empId, month, name) => {
    try {
      const r = await downloadPayslip(empId, month);
      triggerDownload(r.data, `Payslip_${name}_${month}.pdf`);
    } catch { toast('❌ Payslip not found', 'error'); }
  };

  const handleExcel = async () => {
    try {
      const r = await exportPayrollExcel({ month: filterMonth, companyId: filterCompany });
      triggerDownload(r.data, `Payroll_${filterMonth || 'All'}.xlsx`);
    } catch { toast('❌ Export failed', 'error'); }
  };

  const totals = {
    gross: payrolls.reduce((s, p) => s + p.grossSalary, 0),
    pf: payrolls.reduce((s, p) => s + p.pfDeduction, 0),
    esi: payrolls.reduce((s, p) => s + p.esiDeduction, 0),
    tds: payrolls.reduce((s, p) => s + p.tdsDeduction, 0),
    net: payrolls.reduce((s, p) => s + p.netSalary, 0),
  };

  const fmt = n => `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;

  return (
    <div style={{ background: '#f0f2f8', minHeight: '100vh' }}>
      <Navbar />
      <div style={S.container}>
        <div style={S.header}>
          <div><h2 style={S.title}>💰 Payroll Processing</h2><p style={S.sub}>{payrolls.length} payroll records</p></div>
          <button style={{ ...S.btn, background: '#2e7d32' }} onClick={handleExcel}>⬇ Export Excel</button>
        </div>

        {msg.text && <div style={{ ...S.toast, background: msg.type === 'error' ? '#ffebee' : '#e8f5e9', color: msg.type === 'error' ? '#c62828' : '#2e7d32' }}>{msg.text}</div>}

        {/* Run Payroll */}
        <div style={S.card}>
          <h3 style={S.cardTitle}>▶ Run Payroll</h3>
          <form onSubmit={handleRun} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={S.label}>Company *</label>
              <select style={S.input} value={runForm.companyId} onChange={e => setRunForm({ ...runForm, companyId: e.target.value })} required>
                <option value="">Select Company</option>
                {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>Payroll Month *</label>
              <input style={S.input} type="month" value={runForm.payrollMonth} onChange={e => setRunForm({ ...runForm, payrollMonth: e.target.value })} required />
            </div>
            <button style={{ ...S.btn, padding: '0.6rem 2rem' }} type="submit" disabled={running}>
              {running ? '⏳ Processing...' : '▶ Run Payroll'}
            </button>
          </form>
          <p style={{ margin: '0.75rem 0 0', color: '#888', fontSize: '0.78rem' }}>
            ℹ Payroll uses attendance data for pro-rata calculation. PF capped at ₹1,800. ESI applied if gross ≤ ₹21,000.
          </p>
        </div>

        {/* Totals */}
        {payrolls.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
            {[['Gross', totals.gross, '#1a237e'], ['PF', totals.pf, '#6a1b9a'], ['ESI', totals.esi, '#1565c0'], ['TDS', totals.tds, '#e65100'], ['Net Payout', totals.net, '#2e7d32']].map(([l, v, c]) => (
              <div key={l} style={{ background: '#fff', borderRadius: '10px', padding: '1rem', boxShadow: '0 2px 6px rgba(0,0,0,0.06)', borderTop: `3px solid ${c}`, textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: c }}>{fmt(v)}</div>
                <div style={{ fontSize: '0.75rem', color: '#666' }}>Total {l}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div style={{ ...S.card, display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end', padding: '1rem 1.5rem' }}>
          <div><label style={S.label}>Filter Month</label>
            <input style={S.input} type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} /></div>
          <div><label style={S.label}>Company</label>
            <select style={S.input} value={filterCompany} onChange={e => setFilterCompany(e.target.value)}>
              <option value="">All Companies</option>
              {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select></div>
          <div><label style={S.label}>Status</label>
            <select style={S.input} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All Status</option>
              {['Processed', 'Paid', 'Hold'].map(s => <option key={s}>{s}</option>)}
            </select></div>
          <button style={{ ...S.btn, background: '#666' }} onClick={() => { setFilterMonth(''); setFilterCompany(''); setFilterStatus(''); }}>Clear</button>
        </div>

        {/* Table */}
        <div style={S.card}>
          <div style={{ overflowX: 'auto' }}>
            <table style={S.table}>
              <thead>
                <tr style={{ background: '#e8eaf6' }}>
                  {['Code', 'Employee', 'Dept', 'Month', 'Gross', 'PF', 'ESI', 'TDS', 'Net Salary', 'Days', 'Status', 'Actions'].map(h => <th key={h} style={S.th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {payrolls.map(p => (
                  <tr key={p._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={S.td}><span style={S.chip}>{p.employeeId?.employeeCode || '—'}</span></td>
                    <td style={S.td}><strong>{p.employeeId?.name || '—'}</strong><br /><span style={{ fontSize: '0.7rem', color: '#888' }}>{p.companyId?.name}</span></td>
                    <td style={S.td}>{p.employeeId?.department || '—'}</td>
                    <td style={S.td}>{p.payrollMonth}</td>
                    <td style={S.td}>{fmt(p.grossSalary)}</td>
                    <td style={S.td}>{fmt(p.pfDeduction)}</td>
                    <td style={S.td}>{fmt(p.esiDeduction)}</td>
                    <td style={S.td}>{fmt(p.tdsDeduction)}</td>
                    <td style={{ ...S.td, fontWeight: '700', color: '#2e7d32' }}>{fmt(p.netSalary)}</td>
                    <td style={S.td}>{p.presentDays}/{p.workingDays}</td>
                    <td style={S.td}>
                      <select value={p.status} onChange={e => handleStatus(p._id, e.target.value)}
                        style={{ padding: '0.2rem 0.4rem', border: `1.5px solid ${STATUS_C[p.status]}`, borderRadius: '5px', color: STATUS_C[p.status], fontSize: '0.75rem', fontWeight: '600', background: STATUS_C[p.status] + '15', cursor: 'pointer' }}>
                        {['Processed', 'Paid', 'Hold'].map(s => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td style={S.td}>
                      <button style={S.pdfBtn} onClick={() => handlePayslip(p.employeeId?._id, p.payrollMonth, p.employeeId?.name)}>📄 PDF</button>
                    </td>
                  </tr>
                ))}
                {!payrolls.length && <tr><td colSpan={12} style={{ textAlign: 'center', padding: '2rem', color: '#aaa' }}>No payroll records. Run payroll above.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

const S = {
  container: { padding: '1.5rem 2rem', maxWidth: '1400px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' },
  title: { margin: 0, color: '#1a237e', fontSize: '1.4rem' },
  sub: { margin: '0.2rem 0 0', color: '#666', fontSize: '0.85rem' },
  card: { background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', marginBottom: '1.25rem' },
  cardTitle: { margin: '0 0 1rem', color: '#1a237e', fontSize: '1.05rem' },
  label: { display: 'block', fontSize: '0.72rem', fontWeight: '600', color: '#555', marginBottom: '0.25rem' },
  input: { padding: '0.55rem 0.75rem', border: '1.5px solid #e0e0e0', borderRadius: '7px', fontSize: '0.85rem', minWidth: '160px' },
  btn: { padding: '0.6rem 1.25rem', background: '#1a237e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: '600' },
  pdfBtn: { padding: '0.25rem 0.6rem', background: '#e8eaf6', color: '#1a237e', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' },
  th: { padding: '0.6rem 0.75rem', textAlign: 'left', fontSize: '0.73rem', color: '#1a237e', fontWeight: '600', whiteSpace: 'nowrap' },
  td: { padding: '0.55rem 0.75rem', whiteSpace: 'nowrap' },
  chip: { background: '#e8eaf6', color: '#1a237e', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '600' },
  toast: { padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.88rem', fontWeight: '500' },
};
