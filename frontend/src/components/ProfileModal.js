import { useState } from 'react';
import { updateProfile } from '../services/api';
import { useAuth } from '../context/AuthContext';

// "My profile" dialog for every role: name and login email.
// Changing the email asks for the current password. Employees' names are managed by HR.
export default function ProfileModal({ onClose }) {
  const { user, login } = useAuth();
  const isEmployee = user?.role === 'Employee';
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', currentPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const emailChanged = form.email.trim().toLowerCase() !== String(user?.email || '').toLowerCase();
  const update = (field, value) => { setForm(prev => ({ ...prev, [field]: value })); setError(''); setSuccess(''); };

  const handleSubmit = async event => {
    event.preventDefault();
    if (!form.name.trim()) return setError('Name cannot be empty');
    setLoading(true);
    try {
      const payload = { email: form.email };
      if (!isEmployee) payload.name = form.name;
      if (emailChanged) payload.currentPassword = form.currentPassword;
      const { data } = await updateProfile(payload);
      login({ ...user, name: data.user.name, email: data.user.email });
      setForm(prev => ({ ...prev, currentPassword: '' }));
      setSuccess('Profile updated');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={event => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="profile-title">
        <div style={S.header}>
          <h3 id="profile-title" style={S.title}>My profile</h3>
          <button type="button" aria-label="Close" style={S.close} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div style={{ ...S.alert, ...S.err }}>{error}</div>}
          {success && <div style={{ ...S.alert, ...S.ok }}>{success}</div>}
          <label style={S.label}>Name
            <input style={{ ...S.input, ...(isEmployee ? S.readOnly : {}) }} required readOnly={isEmployee} value={form.name} onChange={event => update('name', event.target.value)} />
            {isEmployee && <span style={S.hint}>Your name is managed by HR.</span>}
          </label>
          <label style={S.label}>Login email
            <input style={S.input} type="email" required autoComplete="email" value={form.email} onChange={event => update('email', event.target.value)} />
          </label>
          {emailChanged && (
            <label style={S.label}>Current password (required to change email)
              <input style={S.input} type="password" required autoComplete="current-password" value={form.currentPassword} onChange={event => update('currentPassword', event.target.value)} />
            </label>
          )}
          <p style={S.hint}>Role: {user?.isSuperAdmin || user?.role === 'SuperAdmin' ? 'Super Admin' : user?.role}{user?.companyName ? ` · ${user.companyName}` : ''}</p>
          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.8rem' }}>
            <button type="submit" style={{ ...S.primary, flex: 1 }} disabled={loading}>{loading ? 'Saving...' : 'Save profile'}</button>
            <button type="button" style={S.secondary} onClick={onClose}>Close</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const S = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' },
  modal: { background: '#fff', borderRadius: '18px', padding: '1.4rem', width: '100%', maxWidth: '420px', boxShadow: '0 24px 60px rgba(15,23,42,0.25)', fontFamily: 'Inter, system-ui, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  title: { margin: 0, color: '#0f172a', fontSize: '1.1rem' },
  close: { background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: '#64748b' },
  label: { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.8rem' },
  input: { display: 'block', width: '100%', boxSizing: 'border-box', marginTop: '0.35rem', padding: '0.65rem 0.8rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem' },
  readOnly: { background: '#f1f5f9', color: '#64748b' },
  hint: { display: 'block', fontSize: '0.76rem', fontWeight: 400, color: '#64748b', marginTop: '0.3rem' },
  primary: { padding: '0.7rem 1rem', borderRadius: '10px', border: 'none', background: '#4f46e5', color: '#fff', fontWeight: 700, cursor: 'pointer' },
  secondary: { padding: '0.7rem 1rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff', color: '#334155', fontWeight: 600, cursor: 'pointer' },
  alert: { padding: '0.65rem 0.8rem', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '0.9rem' },
  err: { background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' },
  ok: { background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' },
};
