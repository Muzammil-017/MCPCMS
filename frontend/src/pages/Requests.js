import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { getEmployeeRequests, updateEmployeeRequestStatus } from '../services/api';

const badge = {
  Pending: { background: '#fff3e0', color: '#e65100' },
  Approved: { background: '#e8f5e9', color: '#2e7d32' },
  Rejected: { background: '#ffebee', color: '#c62828' },
};

export default function Requests() {
  const [requests, setRequests] = useState([]);
  const [filters, setFilters] = useState({ status: '', type: '' });
  const [remarks, setRemarks] = useState({});
  const [msg, setMsg] = useState({ text: '', type: 'success' });

  const toast = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '' }), 3000);
  };

  const load = async () => {
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.type) params.type = filters.type;
      const { data } = await getEmployeeRequests(params);
      setRequests(data.requests || []);
    } catch (err) {
      toast(err.response?.data?.message || 'Unable to load requests', 'error');
    }
  };

  useEffect(() => { load(); }, [filters.status, filters.type]);

  const handleStatus = async (id, status) => {
    try {
      await updateEmployeeRequestStatus(id, { status, adminRemarks: remarks[id] || '' });
      toast(`Request ${status.toLowerCase()}`);
      load();
    } catch (err) {
      toast(err.response?.data?.message || 'Unable to update request', 'error');
    }
  };

  return (
    <>
      <Navbar />
      <main style={S.page}>
        <div style={S.header}>
          <div>
            <h1 style={S.title}>Employee Requests</h1>
            <p style={S.sub}>Attendance corrections, shift changes, WFH and resignation requests.</p>
          </div>
          <div style={S.filters}>
            <select style={S.select} value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value })}>
              <option value="">All Types</option>
              {['Attendance Correction', 'Shift Change', 'Work From Home', 'Resignation'].map(type => <option key={type}>{type}</option>)}
            </select>
            <select style={S.select} value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
              <option value="">All Status</option>
              {['Pending', 'Approved', 'Rejected'].map(status => <option key={status}>{status}</option>)}
            </select>
          </div>
        </div>

        {msg.text && <div style={{ ...S.toast, ...(msg.type === 'error' ? S.toastError : {}) }}>{msg.text}</div>}

        <section style={S.card}>
          {requests.length === 0 ? <p style={S.empty}>No requests found.</p> : requests.map(item => (
            <div key={item._id} style={S.item}>
              <div>
                <strong style={S.itemTitle}>{item.type}</strong>
                <div style={S.meta}>{item.employeeId?.name || '-'} | {item.employeeId?.employeeCode || '-'} | {item.employeeId?.department || '-'}</div>
                <div style={S.meta}>{item.companyId?.name || '-'} | Request date: {item.requestDate}</div>
                <p style={S.details}>{item.details}</p>
              </div>
              <div style={S.review}>
                <span style={{ ...S.badge, ...(badge[item.status] || {}) }}>{item.status}</span>
                <textarea style={S.remarks} placeholder="Admin remarks" value={remarks[item._id] || ''} onChange={e => setRemarks({ ...remarks, [item._id]: e.target.value })} />
                <div style={S.actions}>
                  <button style={{ ...S.btn, background: '#2e7d32' }} disabled={item.status === 'Approved'} onClick={() => handleStatus(item._id, 'Approved')}>Approve</button>
                  <button style={{ ...S.btn, background: '#c62828' }} disabled={item.status === 'Rejected'} onClick={() => handleStatus(item._id, 'Rejected')}>Reject</button>
                </div>
              </div>
            </div>
          ))}
        </section>
      </main>
    </>
  );
}

const S = {
  page: { background: 'linear-gradient(180deg, #f7f8fc 0%, #eef2f7 100%)', minHeight: 'calc(100vh - 56px)', padding: '1.75rem 2rem 3rem', fontFamily: 'Inter, system-ui, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' },
  title: { color: '#0f172a', margin: 0, fontSize: '1.75rem', letterSpacing: '-0.04em' },
  sub: { color: '#64748b', margin: '0.35rem 0 0' },
  filters: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap' },
  select: { padding: '0.72rem 0.85rem', border: '1.5px solid #dbe3ef', borderRadius: '12px', background: '#fff' },
  toast: { background: '#e8f5e9', color: '#2e7d32', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontWeight: '600' },
  toastError: { background: '#ffebee', color: '#c62828' },
  card: { background: 'rgba(255,255,255,0.78)', borderRadius: '22px', padding: '1.25rem', boxShadow: '0 18px 50px rgba(15,23,42,0.08)', border: '1px solid rgba(255,255,255,0.72)', backdropFilter: 'blur(18px)' },
  item: { display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1rem', padding: '1rem', borderBottom: '1px solid #eef2f7', borderRadius: '14px' },
  itemTitle: { color: '#0f172a' },
  meta: { color: '#64748b', fontSize: '0.82rem', marginTop: '0.25rem' },
  details: { color: '#334155', marginBottom: 0 },
  review: { display: 'flex', flexDirection: 'column', gap: '0.55rem' },
  badge: { alignSelf: 'flex-start', padding: '0.35rem 0.6rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.8rem' },
  remarks: { minHeight: '70px', border: '1.5px solid #dbe3ef', borderRadius: '12px', padding: '0.7rem', resize: 'vertical', background: '#fff' },
  actions: { display: 'flex', gap: '0.5rem' },
  btn: { color: '#fff', border: 'none', borderRadius: '10px', padding: '0.62rem 0.8rem', fontWeight: '750', cursor: 'pointer' },
  empty: { color: '#777', margin: 0 },
};
