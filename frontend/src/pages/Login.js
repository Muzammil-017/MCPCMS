import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const { data } = await loginUser(form);
      login({ ...data.user, token: data.token });
      navigate('/dashboard');
    } catch (err) { setError(err.response?.data?.message || 'Login failed'); }
    finally { setLoading(false); }
  };

  return (
    <div style={S.page}>
      <div style={S.left}>
        <div style={S.logo}></div>
        <h1 style={S.title}>MCPCMS</h1>
        <p style={S.sub}>Multi-Company Payroll &<br/>Compliance Management System</p>
        <div style={S.features}>
          {['Multi-company Payroll Processing', 'Attendance Management', 'Statutory Compliance (PF, ESI, TDS)', 'Analytics & Reports', 'PDF Payslip Generation', 'Excel Export'].map(f => (
            <div key={f} style={S.feature}>✓ {f}</div>
          ))}
        </div>
      </div>

      <div style={S.right}>
        <div style={S.card}>
          <h2 style={S.cardTitle}>Welcome Back</h2>
          <p style={S.cardSub}>Sign in to your account</p>

          {error && <div style={S.error}>⚠ {error}</div>}

          <form onSubmit={handleSubmit}>
            <label style={S.label}>Email Address</label>
            <input
              style={S.input}
              type="email"
              placeholder="admin@company.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />

            <label style={S.label}>Password</label>
            <input
              style={S.input}
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />

            <button
              style={{ ...S.btn, opacity: loading ? 0.7 : 1 }}
              type="submit"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>

          {/* ✅ ADDED FEATURE (correct placement) */}
          <div style={{ marginTop: "12px", textAlign: "center" }}>
            <span style={{ fontSize: "13px", color: "#6b7280" }}>
              New company?{" "}
              <Link to="/contact-sales" style={{ color: "#4f46e5", fontWeight: "500" }}>
                Contact Sales
              </Link>
            </span>
          </div>

          <p style={{ textAlign: 'center', color: '#888', fontSize: '0.8rem', marginTop: '1.5rem' }}>
            © 2026 MCPCMS. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

const S = {
  page: { display: 'flex', minHeight: '100vh' },
  left: {
    flex: 1,
    background: 'linear-gradient(135deg, #0d1b4b 0%, #1a237e 60%, #283593 100%)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '3rem',
    color: '#fff'
  },
  logo: { fontSize: '3rem', marginBottom: '0.5rem' },
  title: { fontSize: '2.5rem', fontWeight: 'bold', margin: 0, color: '#7986cb' },
  sub: { color: '#9fa8da', fontSize: '1.1rem', margin: '0.5rem 0 2rem', lineHeight: 1.6 },
  features: { display: 'flex', flexDirection: 'column', gap: '0.6rem' },
  feature: { color: '#c5cae9', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' },

  right: {
    width: '420px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f5f6fa',
    padding: '2rem'
  },

  card: {
    background: '#fff',
    padding: '2.5rem',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
    width: '100%'
  },

  cardTitle: { fontSize: '1.6rem', fontWeight: 'bold', color: '#1a237e', margin: 0 },
  cardSub: { color: '#888', margin: '0.3rem 0 1.5rem', fontSize: '0.9rem' },

  label: {
    display: 'block',
    fontSize: '0.82rem',
    fontWeight: '600',
    color: '#555',
    marginBottom: '0.3rem',
    marginTop: '1rem'
  },

  input: {
    width: '100%',
    padding: '0.75rem',
    border: '1.5px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '0.95rem',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border 0.2s'
  },

  btn: {
    width: '100%',
    padding: '0.85rem',
    background: 'linear-gradient(135deg, #1a237e, #3949ab)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    cursor: 'pointer',
    marginTop: '1.5rem',
    fontWeight: '600'
  },

  error: {
    background: '#ffebee',
    color: '#c62828',
    padding: '0.7rem',
    borderRadius: '8px',
    fontSize: '0.85rem',
    marginBottom: '0.5rem'
  },
};