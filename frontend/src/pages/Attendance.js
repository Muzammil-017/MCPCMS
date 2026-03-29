import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { getEmployees, getAttendance, markAttendance, getCompanies, exportAttendanceExcel, triggerDownload } from '../services/api';

const STATUS = ['Present', 'Absent', 'Half-Day', 'Leave', 'Holiday', 'WFH'];
const SC = { Present: '#2e7d32', Absent: '#c62828', 'Half-Day': '#e65100', Leave: '#1565c0', Holiday: '#6a1b9a', WFH: '#00695c' };

export default function Attendance() {
  const [employees, setEmployees] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [records, setRecords] = useState([]);
  const [marked, setMarked] = useState({});
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
    if (filterCompany) params.companyId = filterCompany;
    const r = await getAttendance(params);
    setRecords(r.data.records || r.data);
    // Pre-fill marked status for selected date
    const dayRecords = (r.data.records || r.data).filter(rec => rec.date === markDate);
    const m = {};
    dayRecords.forEach(rec => { m[rec.employeeId?._id || rec.employeeId] = rec.status; });
    setMarked(m);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { loadRecords(); }, [filterMonth, filterCompany, markDate]);

  const filteredEmps = filterCompany
    ? employees.filter(e => (e.companyId?._id || e.companyId) === filterCompany)
    : employees;

  const handleMark = async (empId, status) => {
    setMarked(prev => ({ ...prev, [empId]: status }));
    try {
      await markAttendance({ employeeId: empId, date: markDate, status });
      toast(`✅ Marked ${status}`);
      loadRecords();
    } catch { toast('❌ Error marking attendance', 'error'); }
  };

  const handleMarkAll = async (status) => {
    try {
      const records = filteredEmps.map(e => ({ employeeId: e._id, date: markDate, status }));
      await Promise.all(records.map(r => markAttendance(r)));
      const m = {};
      filteredEmps.forEach(e => { m[e._id] = status; });
      setMarked(m);
      toast(`✅ All marked as ${status}`);
      loadRecords();
    } catch { toast('❌ Error', 'error'); }
  };

  const handleExport = async () => {
    try {
      const r = await exportAttendanceExcel({ month: filterMonth, ...(filterCompany && { companyId: filterCompany }) });
      triggerDownload(r.data, `Attendance_${filterMonth}.xlsx`);
    } catch { toast('❌ Export failed', 'error'); }
  };

  // Summary
  const summary = STATUS.map(s => ({ status: s, count: records.filter(r => r.status === s).length, color: SC[s] }));

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
          <div><label style={S.label}>Company</label>
            <select style={S.sel} value={filterCompany} onChange={e => setFilterCompany(e.target.value)}>
              <option value="">All Companies</option>
              {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select></div>
          <div><label style={S.label}>Month</label>
            <input style={S.sel} type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} /></div>
          <div><label style={S.label}>Mark Date</label>
            <input style={S.sel} type="date" value={markDate} onChange={e => setMarkDate(e.target.value)} /></div>
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
                    style={{ padding: '0.3rem 0.7rem', background: SC[s] + '22', color: SC[s], border: `1px solid ${SC[s]}`, borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600' }}>{s}</button>
                ))}
              </div>
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
                          <input type="radio" name={`att_${emp._id}`} checked={marked[emp._id] === s} onChange={() => handleMark(emp._id, s)}
                            style={{ accentColor: SC[s], width: '16px', height: '16px', cursor: 'pointer' }} />
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
  container: { padding: '1.5rem 2rem', maxWidth: '1400px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' },
  title: { margin: 0, color: '#1a237e', fontSize: '1.4rem' },
  sub: { margin: '0.2rem 0 0', color: '#666', fontSize: '0.85rem' },
  card: { background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', marginBottom: '1.25rem' },
  btn: { padding: '0.6rem 1.25rem', background: '#1a237e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: '600' },
  sel: { padding: '0.5rem 0.75rem', border: '1.5px solid #e0e0e0', borderRadius: '7px', fontSize: '0.85rem' },
  label: { display: 'block', fontSize: '0.72rem', fontWeight: '600', color: '#555', marginBottom: '0.25rem' },
  tabBtn: { padding: '0.45rem 1.1rem', border: '1.5px solid #e0e0e0', borderRadius: '7px', cursor: 'pointer', background: '#fff', fontSize: '0.83rem', fontWeight: '500' },
  tabActive: { background: '#1a237e', color: '#fff', borderColor: '#1a237e' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' },
  th: { padding: '0.6rem 0.75rem', textAlign: 'left', fontSize: '0.74rem', color: '#1a237e', fontWeight: '600' },
  td: { padding: '0.55rem 0.75rem' },
  chip: { background: '#e8eaf6', color: '#1a237e', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '600' },
  toast: { padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.88rem', fontWeight: '500' },
};
