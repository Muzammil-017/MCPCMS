import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { getEmployees, getAttendance, markBulkAttendance, getCompanies, exportAttendanceExcel, triggerDownload } from '../services/api';
import { useAuth } from '../context/AuthContext';

const STATUS = ['Present', 'Absent', 'Half-Day', 'Leave', 'Holiday', 'WFH'];
const SC = { Present: '#2e7d32', Absent: '#c62828', 'Half-Day': '#e65100', Leave: '#1565c0', Holiday: '#6a1b9a', WFH: '#00695c' };
const getId = value => String(value?._id || value || '');
const today = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().substring(0, 10);
};
const isFutureDate = date => date > today();

export default function Attendance() {
  const { isSuperAdmin, companyId } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [records, setRecords] = useState([]);
  const [marked, setMarked] = useState({});
  const [locked, setLocked] = useState({});
  const [filterCompany, setFilterCompany] = useState('');
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().substring(0, 7));
  const [markDate, setMarkDate] = useState(new Date().toISOString().substring(0, 10));
  const [msg, setMsg] = useState({ text: '', type: 'success' });
  const [activeTab, setActiveTab] = useState('mark');

  const toast = (text, type = 'success') => { setMsg({ text, type }); setTimeout(() => setMsg({ text: '' }), 3000); };

  const load = async () => {
    const [e, c] = await Promise.all([getEmployees(), getCompanies()]);
    setEmployees(e.data.employees || e.data);
    setCompanies(c.data.companies || c.data);
  };

  const loadRecords = async () => {
    const params = { month: filterMonth };
    const scopedCompanyId = isSuperAdmin ? filterCompany : companyId;
    if (scopedCompanyId) params.companyId = scopedCompanyId;
    const r = await getAttendance(params);
    setRecords(r.data.records || r.data);
    // Pre-fill marked status for selected date
    const dayRecords = (r.data.records || r.data).filter(rec => rec.date === markDate);
    const m = {};
    const l = {};
    dayRecords.forEach(rec => {
      const empId = rec.employeeId?._id || rec.employeeId;
      m[empId] = rec.status;
      l[empId] = true;
    });
    setMarked(m);
    setLocked(l);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { loadRecords(); }, [filterMonth, filterCompany, markDate, companyId, isSuperAdmin]);

  const scopedFilterCompany = isSuperAdmin ? filterCompany : companyId;
  const filteredEmps = scopedFilterCompany
    ? employees.filter(e => getId(e.companyId) === getId(scopedFilterCompany))
    : employees;

  const handleMark = async (empId, status) => {
    if (locked[empId]) {
      toast('Attendance is already marked and cannot be changed', 'error');
      return;
    }
    if (isFutureDate(markDate)) {
      toast('Future attendance cannot be marked', 'error');
      return;
    }
    setMarked(prev => ({ ...prev, [empId]: status }));
  };

  const handleSubmitAttendance = async () => {
    if (isFutureDate(markDate)) {
      toast('Future attendance cannot be submitted', 'error');
      return;
    }
    try {
      const records = filteredEmps
        .filter(e => !locked[e._id] && marked[e._id])
        .map(e => ({ employeeId: e._id, date: markDate, status: marked[e._id] }));

      if (!records.length) {
        toast('Select attendance before submitting', 'error');
        return;
      }

      const response = await markBulkAttendance({ records });
      toast(response.data.message || 'Attendance submitted');
      loadRecords();
    } catch (err) { toast(err.response?.data?.message || 'Error marking attendance', 'error'); }
  };

  const handleMarkAll = async (status) => {
    if (isFutureDate(markDate)) {
      toast('Future attendance cannot be marked', 'error');
      return;
    }
    const availableEmployees = filteredEmps.filter(e => !locked[e._id]);
    if (!availableEmployees.length) {
      toast('All employees are already marked for this date', 'error');
      return;
    }
    setMarked(prev => {
      const next = { ...prev };
      availableEmployees.forEach(e => { next[e._id] = status; });
      return next;
    });
  };

  const handleExport = async () => {
    try {
      const r = await exportAttendanceExcel({ month: filterMonth, ...(scopedFilterCompany && { companyId: scopedFilterCompany }) });
      triggerDownload(r.data, `Attendance_${filterMonth}.xlsx`);
    } catch { toast('❌ Export failed', 'error'); }
  };

  // Summary
  const summary = STATUS.map(s => ({ status: s, count: records.filter(r => r.status === s).length, color: SC[s] }));
  const futureSelected = isFutureDate(markDate);
  const pendingCount = filteredEmps.filter(e => !locked[e._id] && marked[e._id]).length;

  return (
    <div style={{ background: '#f0f2f8', minHeight: '100vh' }}>
      <Navbar />
      <div style={S.container}>
        <div style={S.header}>
          <div><h2 style={S.title}>📅 Attendance Management</h2><p style={S.sub}>{records.length} records for {filterMonth}</p></div>
          <button style={{ ...S.btn, background: '#2e7d32' }} onClick={handleExport}>⬇ Export Excel</button>
        </div>

        {msg.text && <div style={{ ...S.toast, background: msg.type === 'error' ? '#ffebee' : '#e8f5e9', color: msg.type === 'error' ? '#c62828' : '#2e7d32' }}>{msg.text}</div>}

        {/* Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
          {summary.map(s => (
            <div key={s.status} style={{ background: '#fff', borderRadius: '10px', padding: '0.85rem', textAlign: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.06)', borderTop: `3px solid ${s.color}` }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: s.color }}>{s.count}</div>
              <div style={{ fontSize: '0.72rem', color: '#666' }}>{s.status}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ ...S.card, display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', padding: '1rem 1.5rem' }}>
          {isSuperAdmin && (
            <div><label style={S.label}>Company</label>
              <select style={S.sel} value={filterCompany} onChange={e => setFilterCompany(e.target.value)}>
                <option value="">All Companies</option>
                {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select></div>
          )}
          <div><label style={S.label}>Month</label>
            <input style={S.sel} type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} /></div>
          <div><label style={S.label}>Mark Date</label>
            <input style={S.sel} type="date" value={markDate} max={today()} onChange={e => setMarkDate(e.target.value)} /></div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          {[['mark', '✏ Mark Attendance'], ['records', '📋 View Records']].map(([t, l]) => (
            <button key={t} style={{ ...S.tabBtn, ...(activeTab === t ? S.tabActive : {}) }} onClick={() => setActiveTab(t)}>{l}</button>
          ))}
        </div>

        {/* Mark Attendance Tab */}
        {activeTab === 'mark' && (
          <div style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#1a237e', fontSize: '1rem' }}>Mark for {markDate}</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.78rem', color: '#666', alignSelf: 'center' }}>Mark all:</span>
                {['Present', 'Absent', 'Holiday'].map(s => (
                  <button key={s} onClick={() => handleMarkAll(s)}
                    disabled={futureSelected || filteredEmps.every(e => locked[e._id])}
                    style={{ padding: '0.3rem 0.7rem', background: SC[s] + '22', color: SC[s], border: `1px solid ${SC[s]}`, borderRadius: '6px', cursor: futureSelected || filteredEmps.every(e => locked[e._id]) ? 'not-allowed' : 'pointer', fontSize: '0.75rem', fontWeight: '600', opacity: futureSelected || filteredEmps.every(e => locked[e._id]) ? 0.5 : 1 }}>{s}</button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.82rem', color: futureSelected ? '#c62828' : '#64748b', fontWeight: '650' }}>
                {futureSelected ? 'Future dates cannot be marked.' : `${pendingCount} attendance selection(s) ready to submit.`}
              </span>
              <button type="button" style={{ ...S.btn, opacity: futureSelected || !pendingCount ? 0.55 : 1, cursor: futureSelected || !pendingCount ? 'not-allowed' : 'pointer' }} disabled={futureSelected || !pendingCount} onClick={handleSubmitAttendance}>
                Submit Attendance
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={S.table}>
                <thead>
                  <tr style={{ background: '#e8eaf6' }}>
                    <th style={S.th}>Code</th><th style={S.th}>Employee</th><th style={S.th}>Department</th>
                    {STATUS.map(s => <th key={s} style={{ ...S.th, textAlign: 'center' }}>{s}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {filteredEmps.map(emp => (
                    <tr key={emp._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={S.td}><span style={S.chip}>{emp.employeeCode}</span></td>
                      <td style={S.td}><strong>{emp.name}</strong></td>
                      <td style={S.td}>{emp.department}</td>
                      {STATUS.map(s => (
                        <td key={s} style={{ ...S.td, textAlign: 'center' }}>
                          <input type="radio" name={`att_${emp._id}`} checked={marked[emp._id] === s} disabled={futureSelected || !!locked[emp._id]} onChange={() => handleMark(emp._id, s)}
                            title={futureSelected ? 'Future attendance cannot be marked' : locked[emp._id] ? 'Attendance locked' : `Select ${s}`}
                            style={{ accentColor: SC[s], width: '16px', height: '16px', cursor: futureSelected || locked[emp._id] ? 'not-allowed' : 'pointer' }} />
                        </td>
                      ))}
                    </tr>
                  ))}
                  {!filteredEmps.length && <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: '#aaa' }}>No employees found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Records Tab */}
        {activeTab === 'records' && (
          <div style={S.card}>
            <div style={{ overflowX: 'auto' }}>
              <table style={S.table}>
                <thead>
                  <tr style={{ background: '#e8eaf6' }}>
                    {['Code', 'Employee', 'Dept', 'Date', 'Status', 'Check In', 'Check Out'].map(h => <th key={h} style={S.th}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {records.map(r => (
                    <tr key={r._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={S.td}><span style={S.chip}>{r.employeeId?.employeeCode || '—'}</span></td>
                      <td style={S.td}><strong>{r.employeeId?.name || '—'}</strong></td>
                      <td style={S.td}>{r.employeeId?.department || '—'}</td>
                      <td style={S.td}>{r.date}</td>
                      <td style={S.td}><span style={{ padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700', background: SC[r.status] + '20', color: SC[r.status] }}>{r.status}</span></td>
                      <td style={S.td}>{r.checkIn || '—'}</td>
                      <td style={S.td}>{r.checkOut || '—'}</td>
                    </tr>
                  ))}
                  {!records.length && <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#aaa' }}>No records for this period.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const S = {
  container: { padding: '1.75rem 2rem 3rem', maxWidth: '1480px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' },
  title: { margin: 0, color: '#0f172a', fontSize: '1.75rem', letterSpacing: '-0.04em' },
  sub: { margin: '0.35rem 0 0', color: '#64748b', fontSize: '0.9rem' },
  card: { background: 'rgba(255,255,255,0.78)', borderRadius: '22px', padding: '1.35rem', boxShadow: '0 18px 50px rgba(15,23,42,0.08)', border: '1px solid rgba(255,255,255,0.72)', backdropFilter: 'blur(18px)', marginBottom: '1.25rem' },
  btn: { padding: '0.72rem 1.15rem', background: 'linear-gradient(135deg, #4f46e5, #2563eb)', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: '750', boxShadow: '0 12px 28px rgba(37,99,235,0.18)' },
  sel: { padding: '0.7rem 0.85rem', border: '1.5px solid #dbe3ef', borderRadius: '12px', fontSize: '0.86rem', background: '#fff' },
  label: { display: 'block', fontSize: '0.74rem', fontWeight: '750', color: '#334155', marginBottom: '0.3rem' },
  tabBtn: { padding: '0.55rem 1.1rem', border: '1.5px solid #dbe3ef', borderRadius: '999px', cursor: 'pointer', background: 'rgba(255,255,255,0.78)', fontSize: '0.83rem', fontWeight: '700', color: '#475569' },
  tabActive: { background: '#2563eb', color: '#fff', borderColor: '#2563eb' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' },
  th: { padding: '0.78rem 0.85rem', textAlign: 'left', fontSize: '0.72rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#f8fafc' },
  td: { padding: '0.78rem 0.85rem', color: '#334155' },
  chip: { background: '#eef2ff', color: '#3730a3', padding: '0.2rem 0.48rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: '750' },
  toast: { padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.88rem', fontWeight: '500' },
};
