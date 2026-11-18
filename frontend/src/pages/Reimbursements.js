import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { downloadReimbursementBill, getReimbursements, updateReimbursementStatus } from '../services/api';

const badge = {
  Pending: { background: '#fff3e0', color: '#e65100' },
  Approved: { background: '#e8f5e9', color: '#2e7d32' },
  Rejected: { background: '#ffebee', color: '#c62828' },
};

export default function Reimbursements() {
  const [claims, setClaims] = useState([]);
  const [filters, setFilters] = useState({ status: '', category: '' });
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
      if (filters.category) params.category = filters.category;
      const { data } = await getReimbursements(params);
      setClaims(data.reimbursements || []);
    } catch (err) {
      toast(err.response?.data?.message || 'Unable to load reimbursements', 'error');
    }
  };

  useEffect(() => { load(); }, [filters.status, filters.category]);

  const handleStatus = async (id, status) => {
    try {
      await updateReimbursementStatus(id, { status, adminRemarks: remarks[id] || '' });
      toast(`Claim ${status.toLowerCase()}`);
      load();
    } catch (err) {
      toast(err.response?.data?.message || 'Unable to update claim', 'error');
    }
  };

  const fmt = value => `INR ${Number(value || 0).toLocaleString('en-IN')}`;

  const handleViewBill = async item => {
    try {
      const response = await downloadReimbursementBill(item._id);
      const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch (err) {
      toast(err.response?.data?.message || 'Unable to open bill', 'error');
    }
  };

  return (
    <>
      <Navbar />
      <main style={S.page}>
        <div style={S.header}>
          <div>
            <h1 style={S.title}>Reimbursement Claims</h1>
            <p style={S.sub}>Review travel, food, internet and equipment bill claims.</p>
          </div>
          <div style={S.filters}>
            <select style={S.select} value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })}>
              <option value="">All Categories</option>
              {['Travel', 'Food', 'Internet', 'Equipment'].map(category => <option key={category}>{category}</option>)}
            </select>
            <select style={S.select} value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
              <option value="">All Status</option>
              {['Pending', 'Approved', 'Rejected'].map(status => <option key={status}>{status}</option>)}
            </select>
          </div>
        </div>

        {msg.text && <div style={{ ...S.toast, ...(msg.type === 'error' ? S.toastError : {}) }}>{msg.text}</div>}

        <section style={S.card}>
          {claims.length === 0 ? <p style={S.empty}>No reimbursement claims found.</p> : claims.map(item => (
            <div key={item._id} style={S.item}>
              <div>
                <strong style={S.itemTitle}>{item.category} - {fmt(item.amount)}</strong>
                <div style={S.meta}>{item.employeeId?.name || '-'} | {item.employeeId?.employeeCode || '-'} | {item.employeeId?.department || '-'}</div>
                <div style={S.meta}>{item.companyId?.name || '-'} | Expense date: {item.expenseDate}</div>
                <p style={S.details}>{item.description}</p>
                {item.billFile && <button type="button" style={S.bill} onClick={() => handleViewBill(item)}>View bill</button>}
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
  details: { color: '#334155' },
  bill: { color: '#2563eb', fontWeight: '750', textDecoration: 'none', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' },
  review: { display: 'flex', flexDirection: 'column', gap: '0.55rem' },
  badge: { alignSelf: 'flex-start', padding: '0.35rem 0.6rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.8rem' },
  remarks: { minHeight: '70px', border: '1.5px solid #dbe3ef', borderRadius: '12px', padding: '0.7rem', resize: 'vertical', background: '#fff' },
  actions: { display: 'flex', gap: '0.5rem' },
  btn: { color: '#fff', border: 'none', borderRadius: '10px', padding: '0.62rem 0.8rem', fontWeight: '750', cursor: 'pointer' },
  empty: { color: '#777', margin: 0 },
};
