import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { getStaff, createStaff, updateStaff, resetStaffPassword, deleteStaff } from '../services/api';

const emptyForm = { name: '', email: '', password: '' };

// Company admin manages the HR users of their company. HR users get full access to
// employees, attendance, leave, requests, claims, payroll, compliance, analytics and reports,
// but cannot manage the team or edit company details.
export default function Team() {
  const { user } = useAuth();
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [pwTarget, setPwTarget] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState({ text: '', type: 'success' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const toast = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '' }), 3500);
  };

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await getStaff();
      setStaff(data.staff || []);
    } catch (err) {
      toast(err.response?.data?.message || 'Unable to load team', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async event => {
    event.preventDefault();
    if (form.password.length < 6) return toast('Password must be at least 6 characters', 'error');
    setSaving(true);
    try {
      await createStaff(form);
      toast(`HR user ${form.name} added`);
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      toast(err.response?.data?.message || 'Could not add HR user', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async member => {
    try {
      await updateStaff(member._id, { isActive: !member.isActive });
      toast(`${member.name} ${member.isActive ? 'deactivated' : 'activated'}`);
      load();
    } catch (err) {
      toast(err.response?.data?.message || 'Could not update HR user', 'error');
    }
  };

  const handleRemove = async member => {
    if (!window.confirm(`Remove ${member.name}? They will no longer be able to log in.`)) return;
    try {
      await deleteStaff(member._id);
      toast(`${member.name} removed`);
      load();
    } catch (err) {
      toast(err.response?.data?.message || 'Could not remove HR user', 'error');
    }
  };

  const handlePassword = async event => {
    event.preventDefault();
    if (newPassword.length < 6) return toast('Password must be at least 6 characters', 'error');
    setSaving(true);
    try {
      const { data } = await resetStaffPassword(pwTarget._id, { password: newPassword });
      toast(data.message || 'Password updated');
      setPwTarget(null);
      setNewPassword('');
    } catch (err) {
      toast(err.response?.data?.message || 'Could not update password', 'error');
    } finally {
      setSaving(false);
    }
  };

  const hrCount = staff.filter(member => member.role === 'HR').length;
  const activeHr = staff.filter(member => member.role === 'HR' && member.isActive).length;

  return (
    <>
      <Navbar />
      <main style={S.page}>
        <div style={S.header}>
          <div>
            <h1 style={S.title}>Team</h1>
            <p style={S.sub}>Add HR users who can manage employees, attendance, leave, payroll and reports for your company.</p>
          </div>
          <button type="button" style={S.primary} onClick={() => { setShowForm(open => !open); setForm(emptyForm); }}>
            {showForm ? 'Cancel' : 'Add HR User'}
          </button>
        </div>

        {msg.text && <div role="status" style={{ ...S.toast, ...(msg.type === 'error' ? S.toastError : {}) }}>{msg.text}</div>}

        {showForm && (
          <section style={{ ...S.card, marginBottom: '1rem' }}>
            <h2 style={S.cardTitle}>New HR user</h2>
            <form onSubmit={handleCreate} style={S.formGrid}>
              <label style={S.label}>Full name *
                <input style={S.input} required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
              </label>
              <label style={S.label}>Email *
                <input style={S.input} type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="hr@company.com" />
              </label>
              <label style={S.label}>Password *
                <input style={S.input} type="password" required minLength={6} autoComplete="new-password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Minimum 6 characters" />
              </label>
              <div style={{ alignSelf: 'end' }}>
                <button type="submit" style={S.primary} disabled={saving}>{saving ? 'Saving...' : 'Create HR User'}</button>
              </div>
            </form>
          </section>
        )}

        <section style={S.summary}>
          <div style={S.summaryItem}><span>HR users</span><strong>{hrCount}</strong></div>
          <div style={S.summaryItem}><span>Active HR users</span><strong>{activeHr}</strong></div>
        </section>

        <section style={S.card}>
          {loading ? <p style={S.empty}>Loading team...</p> : staff.length === 0 ? (
            <p style={S.empty}>No team members yet.</p>
          ) : (
            <div style={S.tableWrap}>
              <table style={S.table}>
                <thead>
                  <tr>{['Name', 'Email', 'Role', 'Status', 'Actions'].map(head => <th key={head} style={S.th}>{head}</th>)}</tr>
                </thead>
                <tbody>
                  {staff.map(member => {
                    const isSelf = member._id === user?._id;
                    return (
                      <tr key={member._id}>
                        <td style={S.td}><strong>{member.name}</strong>{isSelf && <span style={S.muted}> (you)</span>}</td>
                        <td style={S.td}>{member.email}</td>
                        <td style={S.td}><span style={{ ...S.badge, ...(member.role === 'Admin' ? S.adminBadge : S.hrBadge) }}>{member.role}</span></td>
                        <td style={S.td}><span style={{ ...S.badge, ...(member.isActive ? S.activeBadge : S.inactiveBadge) }}>{member.isActive ? 'Active' : 'Inactive'}</span></td>
                        <td style={S.td}>
                          {member.role === 'HR' ? (
                            <div style={S.actions}>
                              <button type="button" style={{ ...S.actionBtn, background: '#6a1b9a' }} onClick={() => { setPwTarget(member); setNewPassword(''); }}>Password</button>
                              <button type="button" style={{ ...S.actionBtn, background: member.isActive ? '#e65100' : '#2e7d32' }} onClick={() => toggleActive(member)}>{member.isActive ? 'Deactivate' : 'Activate'}</button>
                              <button type="button" style={{ ...S.actionBtn, background: '#c62828' }} onClick={() => handleRemove(member)}>Remove</button>
                            </div>
                          ) : <span style={S.muted}>Company admin</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {pwTarget && (
          <div style={S.overlay} onClick={() => setPwTarget(null)}>
            <div style={S.modal} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
              <h2 style={S.cardTitle}>Set password for {pwTarget.name}</h2>
              <form onSubmit={handlePassword}>
                <label style={S.label}>New password *
                  <input style={S.input} type="password" required minLength={6} autoComplete="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Minimum 6 characters" />
                </label>
                <p style={{ ...S.muted, margin: '0.4rem 0 1rem' }}>They will be signed out and must log in with the new password.</p>
                <div style={S.actions}>
                  <button type="submit" style={S.primary} disabled={saving}>{saving ? 'Saving...' : 'Update Password'}</button>
                  <button type="button" style={S.secondary} onClick={() => setPwTarget(null)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

const S = {
  page: { background: 'linear-gradient(180deg, #f7f8fc 0%, #eef2f7 100%)', minHeight: 'calc(100vh - 56px)', padding: '1.75rem 2rem 3rem', fontFamily: 'Inter, system-ui, sans-serif' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' },
  title: { color: '#0f172a', margin: 0, fontSize: '1.75rem', letterSpacing: '-0.04em' },
  sub: { color: '#64748b', margin: '0.35rem 0 0', fontSize: '0.92rem' },
  primary: { padding: '0.72rem 1.1rem', border: 'none', borderRadius: '12px', background: '#4f46e5', color: '#fff', fontWeight: 700, cursor: 'pointer' },
  secondary: { padding: '0.72rem 1.1rem', border: '1px solid #cbd5e1', borderRadius: '12px', background: '#fff', color: '#334155', fontWeight: 600, cursor: 'pointer' },
  toast: { background: '#e8f5e9', color: '#2e7d32', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontWeight: '600' },
  toastError: { background: '#ffebee', color: '#c62828' },
  summary: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.85rem', marginBottom: '1rem' },
  summaryItem: { background: 'rgba(255,255,255,0.78)', borderRadius: '18px', padding: '1rem', boxShadow: '0 18px 50px rgba(15,23,42,0.08)', border: '1px solid rgba(255,255,255,0.72)', display: 'flex', justifyContent: 'space-between', color: '#0f172a' },
  card: { background: 'rgba(255,255,255,0.78)', borderRadius: '22px', padding: '1.25rem', boxShadow: '0 18px 50px rgba(15,23,42,0.08)', border: '1px solid rgba(255,255,255,0.72)' },
  cardTitle: { margin: '0 0 1rem', color: '#0f172a', fontSize: '1.05rem' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.9rem' },
  label: { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155' },
  input: { display: 'block', width: '100%', boxSizing: 'border-box', marginTop: '0.35rem', padding: '0.65rem 0.8rem', borderRadius: '10px', border: '1.5px solid #dbe3ef', fontSize: '0.9rem', background: '#fff' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', color: '#64748b', fontSize: '0.74rem', padding: '0.8rem', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#f8fafc' },
  td: { padding: '0.8rem', borderBottom: '1px solid #eef2f7', color: '#334155', fontSize: '0.88rem', verticalAlign: 'middle' },
  muted: { color: '#777', fontSize: '0.8rem' },
  badge: { display: 'inline-block', padding: '0.3rem 0.55rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.76rem' },
  adminBadge: { background: '#ede7f6', color: '#4527a0' },
  hrBadge: { background: '#e3f2fd', color: '#1565c0' },
  activeBadge: { background: '#e8f5e9', color: '#2e7d32' },
  inactiveBadge: { background: '#eceff1', color: '#546e7a' },
  actions: { display: 'flex', gap: '0.45rem', flexWrap: 'wrap' },
  actionBtn: { border: 'none', borderRadius: '8px', color: '#fff', padding: '0.45rem 0.65rem', fontWeight: '700', cursor: 'pointer' },
  empty: { margin: 0, color: '#777' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' },
  modal: { background: '#fff', borderRadius: '18px', padding: '1.4rem', width: '100%', maxWidth: '420px', boxShadow: '0 24px 60px rgba(15,23,42,0.25)' },
};
