import { useState } from 'react';
import { changePassword } from '../services/api';
import { useAuth } from '../context/AuthContext';

// Change-password dialog shared by admins, HR and employees
export default function ChangePasswordModal({ onClose }) {
  const { user, login } = useAuth();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field, value) => { setForm(prev => ({ ...prev, [field]: value })); setError(''); };

  const handleSubmit = async event => {
    event.preventDefault();
    if (form.newPassword.length < 6) return setError('New password must be at least 6 characters');
    if (form.newPassword !== form.confirmPassword) return setError('New passwords do not match');
    setLoading(true);
    try {
      const { data } = await changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      // Old sessions are signed out by the server; keep this one with the fresh token
      if (data.token) login({ ...user, token: data.token });
      setSuccess('Password changed successfully');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={event => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="change-password-title">
        <div style={S.header}>
          <h3 id="change-password-title" style={S.title}>Change password</h3>
          <button type="button" aria-label="Close" style={S.close} onClick={onClose}>✕</button>
        </div>
        {success ? (
          <>
            <div style={{ ...S.alert, ...S.ok }}>{success}</div>
            <button type="button" style={S.primary} onClick={onClose}>Done</button>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <div style={{ ...S.alert, ...S.err }}>{error}</div>}
            {[
              ['currentPassword', 'Current password', 'current-password'],
              ['newPassword', 'New password (min 6 characters)', 'new-password'],
              ['confirmPassword', 'Confirm new password', 'new-password'],
            ].map(([field, label, autoComplete]) => (
              <label key={field} style={S.label}>
                {label}
                <input style={S.input} type="password" required autoComplete={autoComplete} value={form[field]} onChange={event => update(field, event.target.value)} />
              </label>
            ))}
            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.4rem' }}>
              <button type="submit" style={{ ...S.primary, flex: 1 }} disabled={loading}>{loading ? 'Saving...' : 'Change password'}</button>
              <button type="button" style={S.secondary} onClick={onClose}>Cancel</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const S = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' },
  modal: { background: '#fff', borderRadius: '18px', padding: '1.4rem', width: '100%', maxWidth: '400px', boxShadow: '0 24px 60px rgba(15,23,42,0.25)', fontFamily: 'Inter, system-ui, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  title: { margin: 0, color: '#0f172a', fontSize: '1.1rem' },
  close: { background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: '#64748b' },
  label: { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.8rem' },
  input: { display: 'block', width: '100%', boxSizing: 'border-box', marginTop: '0.35rem', padding: '0.65rem 0.8rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem' },
  primary: { padding: '0.7rem 1rem', borderRadius: '10px', border: 'none', background: '#4f46e5', color: '#fff', fontWeight: 700, cursor: 'pointer', width: '100%' },
  secondary: { padding: '0.7rem 1rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff', color: '#334155', fontWeight: 600, cursor: 'pointer' },
  alert: { padding: '0.65rem 0.8rem', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '0.9rem' },
  err: { background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' },
  ok: { background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' },
};
