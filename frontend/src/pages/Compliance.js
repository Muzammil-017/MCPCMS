import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { getCompanies, saveCompliance, getCompliance, autoValidateCompliance } from '../services/api';

const SC = { Compliant: '#2e7d32', 'Non-Compliant': '#c62828', Partial: '#e65100', 'Not Checked': '#888' };

const CHECKS = [
  { key: 'pfFiled', label: 'PF Filed', desc: 'Provident Fund deposited with EPFO', icon: '🏦' },
  { key: 'esiFiled', label: 'ESI Filed', desc: 'Employee State Insurance submitted', icon: '🏥' },
  { key: 'tdsDeducted', label: 'TDS Deducted', desc: 'Tax Deducted at Source processed', icon: '💸' },
  { key: 'professionalTaxFiled', label: 'Professional Tax', desc: 'State professional tax submitted', icon: '📜' },
  { key: 'minimumWageCompliance', label: 'Minimum Wage', desc: 'All employees at or above minimum wage', icon: '💰' },
  { key: 'labourWelfareFund', label: 'Labour Welfare Fund', desc: 'LWF contribution deposited', icon: '🤝' },
];

const empty = { pfFiled: false, esiFiled: false, tdsDeducted: false, professionalTaxFiled: false, minimumWageCompliance: false, labourWelfareFund: false, remarks: '' };

export default function Compliance() {
  const [companies, setCompanies] = useState([]);
  const [records, setRecords] = useState([]);
  const [companyId, setCompanyId] = useState('');
  const [month, setMonth] = useState(new Date().toISOString().substring(0, 7));
  const [form, setForm] = useState(empty);
  const [validation, setValidation] = useState(null);
  const [msg, setMsg] = useState({ text: '', type: 'success' });
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');

  const toast = (text, type = 'success') => { setMsg({ text, type }); setTimeout(() => setMsg({ text: '' }), 3000); };
  const load = async () => {
    const [c, r] = await Promise.all([getCompanies(), getCompliance(filterStatus ? { status: filterStatus } : {})]);
    setCompanies(c.data.companies || c.data);
    setRecords(r.data.records || r.data);
  };
  useEffect(() => { load(); }, [filterStatus]);

  const passedCount = CHECKS.filter(c => form[c.key]).length;
  const compliance = passedCount === CHECKS.length ? 'Compliant' : passedCount === 0 ? 'Non-Compliant' : 'Partial';

  const handleSave = async () => {
    if (!companyId) return toast('❌ Select a company', 'error');
    setLoading(true);
    try {
      await saveCompliance({ companyId, month, ...form });
      toast('✅ Compliance record saved!'); load();
    } catch (err) { toast('❌ ' + (err.response?.data?.message || 'Error'), 'error'); }
    finally { setLoading(false); }
  };

  const handleValidate = async () => {
    if (!companyId) return toast('❌ Select a company first', 'error');
    try {
      const r = await autoValidateCompliance(companyId, month);
      setValidation(r.data);
    } catch { toast('❌ Validation error', 'error'); }
  };

  return (
    <div style={{ background: '#f0f2f8', minHeight: '100vh' }}>
      <Navbar />
      <div style={S.container}>
        <div style={S.header}>
          <div><h2 style={S.title}>✅ Compliance Management</h2><p style={S.sub}>Track statutory compliance across all companies</p></div>
        </div>

        {msg.text && <div style={{ ...S.toast, background: msg.type === 'error' ? '#ffebee' : '#e8f5e9', color: msg.type === 'error' ? '#c62828' : '#2e7d32' }}>{msg.text}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', marginBottom: '1.25rem' }}>
          {/* Left: Checklist Form */}
          <div style={S.card}>
            <h3 style={S.cardTitle}>📋 Compliance Checklist</h3>

            {/* Company + Month */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ flex: 1 }}>
                <label style={S.label}>Company *</label>
                <select style={S.input} value={companyId} onChange={e => setCompanyId(e.target.value)}>
                  <option value="">Select Company</option>
                  {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>Month *</label>
                <input style={S.input} type="month" value={month} onChange={e => setMonth(e.target.value)} />
              </div>
            </div>

            {/* Status Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', padding: '0.75rem 1rem', background: SC[compliance] + '12', borderRadius: '8px', border: `1.5px solid ${SC[compliance]}30` }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: SC[compliance] }} />
              <span style={{ fontWeight: '700', color: SC[compliance] }}>Current Status: {compliance}</span>
              <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#888' }}>{passedCount}/{CHECKS.length} checks passed</span>
            </div>

            {/* Progress bar */}
            <div style={{ background: '#f0f0f0', borderRadius: '99px', height: '8px', marginBottom: '1.25rem' }}>
              <div style={{ background: SC[compliance], height: '100%', borderRadius: '99px', width: `${(passedCount / CHECKS.length) * 100}%`, transition: 'width 0.3s' }} />
            </div>

            {/* Checks */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {CHECKS.map(({ key, label, desc, icon }) => (
                <div key={key} onClick={() => setForm(f => ({ ...f, [key]: !f[key] }))}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.75rem 1rem', borderRadius: '10px', cursor: 'pointer', border: `1.5px solid ${form[key] ? '#2e7d32' : '#e0e0e0'}`, background: form[key] ? '#e8f5e9' : '#fafafa', transition: 'all 0.2s' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '5px', border: `2px solid ${form[key] ? '#2e7d32' : '#ccc'}`, background: form[key] ? '#2e7d32' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.8rem', color: '#fff' }}>
                    {form[key] ? '✓' : ''}
                  </div>
                  <div style={{ fontSize: '1.1rem' }}>{icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', fontSize: '0.88rem', color: form[key] ? '#1b5e20' : '#333' }}>{label}</div>
                    <div style={{ fontSize: '0.72rem', color: '#888' }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <textarea style={{ ...S.input, width: '100%', marginTop: '1rem', height: '60px', resize: 'vertical', boxSizing: 'border-box' }}
              placeholder="Remarks / Notes (optional)" value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} />

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button style={{ ...S.btn, flex: 1 }} onClick={handleSave} disabled={loading}>{loading ? 'Saving...' : '💾 Save Compliance'}</button>
              <button style={{ ...S.btn, background: '#1565c0' }} onClick={handleValidate}>🔍 Auto Validate</button>
            </div>
          </div>

          {/* Right: Validation Result */}
          <div>
            {validation ? (
              <div style={S.card}>
                <h3 style={S.cardTitle}>🔍 Auto Validation Result</h3>
                <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', background: validation.passed ? '#e8f5e9' : '#ffebee', color: validation.passed ? '#1b5e20' : '#b71c1c', fontWeight: '600', fontSize: '0.9rem' }}>
                  {validation.suggestion}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                  {[
                    ['Total Employees', validation.totalEmployees],
                    ['Payroll Processed', validation.payrollProcessed],
                    ['Total PF', `₹${(validation.totalPF || 0).toLocaleString('en-IN')}`],
                    ['Total ESI', `₹${(validation.totalESI || 0).toLocaleString('en-IN')}`],
                    ['Total TDS', `₹${(validation.totalTDS || 0).toLocaleString('en-IN')}`],
                    ['Below Min Wage', validation.belowMinWage],
                  ].map(([l, v]) => (
                    <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #f0f0f0', fontSize: '0.85rem' }}>
                      <span style={{ color: '#666' }}>{l}</span><strong>{v}</strong>
                    </div>
                  ))}
                </div>
                {validation.issues?.length > 0 && (
                  <div>
                    <div style={{ fontWeight: '700', color: '#c62828', fontSize: '0.85rem', marginBottom: '0.5rem' }}>⚠ Issues Found:</div>
                    {validation.issues.map((issue, i) => (
                      <div key={i} style={{ background: '#ffebee', color: '#c62828', padding: '0.5rem 0.75rem', borderRadius: '7px', fontSize: '0.82rem', marginBottom: '0.4rem' }}>• {issue}</div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ ...S.card, textAlign: 'center', padding: '3rem', color: '#aaa' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                <p>Click "Auto Validate" to run compliance checks against payroll data</p>
              </div>
            )}

            {/* Quick Stats */}
            <div style={S.card}>
              <h3 style={S.cardTitle}>📊 Compliance Summary</h3>
              {['Compliant', 'Partial', 'Non-Compliant'].map(status => {
                const count = records.filter(r => r.status === status).length;
                return (
                  <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.6rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: SC[status] }} />
                    <span style={{ flex: 1, fontSize: '0.85rem' }}>{status}</span>
                    <div style={{ background: '#f0f0f0', borderRadius: '99px', height: '6px', flex: 3 }}>
                      <div style={{ background: SC[status], height: '100%', borderRadius: '99px', width: records.length ? `${(count / records.length) * 100}%` : '0%' }} />
                    </div>
                    <strong style={{ fontSize: '0.85rem', minWidth: '24px', textAlign: 'right' }}>{count}</strong>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Records Table */}
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, color: '#1a237e', fontSize: '1rem' }}>📋 All Compliance Records ({records.length})</h3>
            <select style={{ ...S.input, width: 'auto' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All Status</option>
              {['Compliant', 'Partial', 'Non-Compliant'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={S.table}>
              <thead>
                <tr style={{ background: '#e8eaf6' }}>
                  {['Company', 'Month', 'PF', 'ESI', 'TDS', 'Prof Tax', 'Min Wage', 'LWF', 'Status', 'Remarks'].map(h => <th key={h} style={S.th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={S.td}><strong>{r.companyId?.name || '—'}</strong></td>
                    <td style={S.td}>{r.month}</td>
                    {['pfFiled', 'esiFiled', 'tdsDeducted', 'professionalTaxFiled', 'minimumWageCompliance', 'labourWelfareFund'].map(k => (
                      <td key={k} style={{ ...S.td, textAlign: 'center' }}>{r[k] ? '✅' : '❌'}</td>
                    ))}
                    <td style={S.td}><span style={{ padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700', background: SC[r.status] + '20', color: SC[r.status] }}>{r.status}</span></td>
                    <td style={{ ...S.td, maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.remarks || '—'}</td>
                  </tr>
                ))}
                {!records.length && <tr><td colSpan={10} style={{ textAlign: 'center', padding: '2rem', color: '#aaa' }}>No compliance records yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

const S = {
  container: { padding: '1.5rem 2rem', maxWidth: '1300px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' },
  title: { margin: 0, color: '#1a237e', fontSize: '1.4rem' },
  sub: { margin: '0.2rem 0 0', color: '#666', fontSize: '0.85rem' },
  card: { background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', marginBottom: '1.25rem' },
  cardTitle: { margin: '0 0 1.1rem', color: '#1a237e', fontSize: '1.05rem' },
  label: { display: 'block', fontSize: '0.72rem', fontWeight: '600', color: '#555', marginBottom: '0.25rem' },
  input: { padding: '0.55rem 0.75rem', border: '1.5px solid #e0e0e0', borderRadius: '7px', fontSize: '0.85rem', width: '100%' },
  btn: { padding: '0.6rem 1.25rem', background: '#1a237e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: '600' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' },
  th: { padding: '0.6rem 0.75rem', textAlign: 'left', fontSize: '0.73rem', color: '#1a237e', fontWeight: '600' },
  td: { padding: '0.55rem 0.75rem' },
  toast: { padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.88rem', fontWeight: '500' },
};
