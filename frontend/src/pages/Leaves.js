import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { getLeaveRequests, updateLeaveStatus } from '../services/api';

const statusColors = {
  Pending: { background: '#fff3e0', color: '#e65100' },
  Approved: { background: '#e8f5e9', color: '#2e7d32' },
  Rejected: { background: '#ffebee', color: '#c62828' },
};

export default function Leaves() {
  const [leaves, setLeaves] = useState([]);
  const [status, setStatus] = useState('');
  const [msg, setMsg] = useState({ text: '', type: 'success' });
  const [loading, setLoading] = useState(false);

  const toast = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '' }), 3000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await getLeaveRequests(status ? { status } : {});
      setLeaves(data.leaves || []);
    } catch (err) {
      toast(err.response?.data?.message || 'Unable to load leave requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [status]);

  const handleStatus = async (id, nextStatus) => {
    try {
      await updateLeaveStatus(id, nextStatus);
      toast(`Leave ${nextStatus.toLowerCase()}`);
      load();
    } catch (err) {
      toast(err.response?.data?.message || 'Unable to update leave request', 'error');
    }
  };

  const summary = ['Pending', 'Approved', 'Rejected'].map(item => ({
    status: item,
    count: leaves.filter(leave => leave.status === item).length,
  }));

  return (
    <>
      <Navbar />
      <main style={S.page}>
        <div style={S.header}>
          <div>
            <h1 style={S.title}>Leave Requests</h1>
            <p style={S.sub}>Review employee leave applications and update approval status.</p>
          </div>
          <select style={S.select} value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        {msg.text && <div style={{ ...S.toast, ...(msg.type === 'error' ? S.toastError : {}) }}>{msg.text}</div>}

        <section style={S.summary}>
          {summary.map(item => (
            <div key={item.status} style={S.summaryItem}>
              <span>{item.status}</span>
              <strong>{item.count}</strong>
            </div>
          ))}
        </section>

        <section style={S.card}>
          {loading ? <p style={S.empty}>Loading leave requests...</p> : leaves.length === 0 ? (
            <p style={S.empty}>No leave requests found.</p>
          ) : (
            <div style={S.tableWrap}>
              <table style={S.table}>
                <thead>
                  <tr>
                    {['Employee', 'Company', 'Dates', 'Type', 'Reason', 'Status', 'Action'].map(head => (
                      <th key={head} style={S.th}>{head}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leaves.map(leave => (
                    <tr key={leave._id}>
                      <td style={S.td}>
                        <strong>{leave.employeeId?.name || '-'}</strong>
                        <div style={S.muted}>{leave.employeeId?.employeeCode || leave.employeeId?.email || '-'}</div>
                        <div style={S.muted}>{leave.employeeId?.department || '-'}</div>
                      </td>
                      <td style={S.td}>{leave.companyId?.name || '-'}</td>
                      <td style={S.td}>{leave.fromDate} to {leave.toDate}</td>
                      <td style={S.td}>{leave.type}</td>
                      <td style={S.td}>{leave.reason}</td>
                      <td style={S.td}>
                        <span style={{ ...S.badge, ...(statusColors[leave.status] || {}) }}>{leave.status}</span>
                      </td>
                      <td style={S.td}>
                        <div style={S.actions}>
                          <button style={{ ...S.actionBtn, ...S.approve }} disabled={leave.status === 'Approved'} onClick={() => handleStatus(leave._id, 'Approved')}>Approve</button>
                          <button style={{ ...S.actionBtn, ...S.reject }} disabled={leave.status === 'Rejected'} onClick={() => handleStatus(leave._id, 'Rejected')}>Reject</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </>
  );
}

const S = {
  page: { background: 'linear-gradient(180deg, #f7f8fc 0%, #eef2f7 100%)', minHeight: 'calc(100vh - 56px)', padding: '1.75rem 2rem 3rem', fontFamily: 'Inter, system-ui, sans-serif' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' },
  title: { color: '#0f172a', margin: 0, fontSize: '1.75rem', letterSpacing: '-0.04em' },
  sub: { color: '#64748b', margin: '0.35rem 0 0', fontSize: '0.92rem' },
  select: { padding: '0.72rem 0.85rem', border: '1.5px solid #dbe3ef', borderRadius: '12px', minWidth: '150px', background: '#fff' },
  toast: { background: '#e8f5e9', color: '#2e7d32', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontWeight: '600' },
  toastError: { background: '#ffebee', color: '#c62828' },
  summary: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.85rem', marginBottom: '1rem' },
  summaryItem: { background: 'rgba(255,255,255,0.78)', borderRadius: '18px', padding: '1rem', boxShadow: '0 18px 50px rgba(15,23,42,0.08)', border: '1px solid rgba(255,255,255,0.72)', display: 'flex', justifyContent: 'space-between', color: '#0f172a', backdropFilter: 'blur(18px)' },
  card: { background: 'rgba(255,255,255,0.78)', borderRadius: '22px', padding: '1.25rem', boxShadow: '0 18px 50px rgba(15,23,42,0.08)', border: '1px solid rgba(255,255,255,0.72)', backdropFilter: 'blur(18px)' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', color: '#64748b', fontSize: '0.74rem', padding: '0.8rem', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#f8fafc' },
  td: { padding: '0.8rem', borderBottom: '1px solid #eef2f7', color: '#334155', fontSize: '0.88rem', verticalAlign: 'top' },
  muted: { color: '#777', fontSize: '0.78rem', marginTop: '0.2rem' },
  badge: { display: 'inline-block', padding: '0.35rem 0.55rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.78rem' },
  actions: { display: 'flex', gap: '0.45rem', flexWrap: 'wrap' },
  actionBtn: { border: 'none', borderRadius: '8px', color: '#fff', padding: '0.45rem 0.65rem', fontWeight: '700', cursor: 'pointer' },
  approve: { background: '#2e7d32' },
  reject: { background: '#c62828' },
  empty: { margin: 0, color: '#777' },
};
