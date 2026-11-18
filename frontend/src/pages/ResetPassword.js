import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { resetPassword } from '../services/api';

export function AuthCard({ title, subtitle, children }) {
  return (
    <main style={S.page}>
      <div style={S.card}>
        <div style={S.brand}><span style={S.brandMark}>MC</span><span style={S.brandName}>MCPCMS</span></div>
        <h1 style={S.title}>{title}</h1>
        {subtitle && <p style={S.sub}>{subtitle}</p>}
        {children}
      </div>
    </main>
  );
}

export default function ResetPassword() {
  const { token } = useParams();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async event => {
    event.preventDefault();
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    if (form.password !== form.confirm) return setError('Passwords do not match');
    setLoading(true);
    try {
      const { data } = await resetPassword(token, { password: form.password });
      setDone(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reset password');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    const loginPath = done.role === 'Employee' ? '/employee-login' : '/';
    return (
      <AuthCard title="Password updated">
        <div style={{ ...S.alert, ...S.ok }}>{done.message}</div>
        <Link to={loginPath} style={{ ...S.primary, display: 'block', textAlign: 'center', textDecoration: 'none' }}>Go to sign in</Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Set a new password" subtitle="Choose a new password for your account.">
      <form onSubmit={handleSubmit}>
        {error && <div style={{ ...S.alert, ...S.err }}>{error}</div>}
        <label style={S.label}>New password (min 6 characters)
          <input style={S.input} type="password" required minLength={6} autoComplete="new-password" value={form.password} onChange={e => { setForm({ ...form, password: e.target.value }); setError(''); }} />
        </label>
        <label style={S.label}>Confirm new password
          <input style={S.input} type="password" required autoComplete="new-password" value={form.confirm} onChange={e => { setForm({ ...form, confirm: e.target.value }); setError(''); }} />
        </label>
        <button type="submit" style={S.primary} disabled={loading}>{loading ? 'Saving...' : 'Reset password'}</button>
      </form>
      <p style={S.footer}><Link to="/forgot-password" style={S.link}>Request a new link</Link></p>
    </AuthCard>
  );
}

export const S = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 16px', background: 'linear-gradient(160deg, #0f172a 0%, #1e1b4b 100%)', fontFamily: 'Inter, system-ui, sans-serif', boxSizing: 'border-box' },
  card: { width: '100%', maxWidth: '420px', background: '#fff', borderRadius: '20px', padding: '2rem 1.75rem', boxShadow: '0 30px 80px rgba(0,0,0,0.35)', boxSizing: 'border-box' },
  brand: { display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '1.4rem' },
  brandMark: { width: 34, height: 34, borderRadius: 10, background: '#4f46e5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem' },
  brandName: { fontWeight: 800, color: '#0f172a' },
  title: { margin: 0, fontSize: '1.45rem', color: '#0f172a', letterSpacing: '-0.03em' },
  sub: { margin: '0.4rem 0 1.3rem', color: '#64748b', fontSize: '0.9rem', lineHeight: 1.5 },
  label: { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.9rem' },
  input: { display: 'block', width: '100%', boxSizing: 'border-box', marginTop: '0.35rem', padding: '0.7rem 0.85rem', borderRadius: '10px', border: '1.5px solid #dbe3ef', fontSize: '0.92rem' },
  primary: { width: '100%', padding: '0.78rem 1rem', borderRadius: '10px', border: 'none', background: '#4f46e5', color: '#fff', fontWeight: 700, fontSize: '0.92rem', cursor: 'pointer', boxSizing: 'border-box' },
  alert: { padding: '0.7rem 0.85rem', borderRadius: '10px', fontSize: '0.86rem', marginBottom: '1rem', lineHeight: 1.45 },
  err: { background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' },
  ok: { background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' },
  footer: { textAlign: 'center', margin: '1.2rem 0 0', fontSize: '0.86rem' },
  link: { color: '#4f46e5', fontWeight: 600, textDecoration: 'none' },
};
