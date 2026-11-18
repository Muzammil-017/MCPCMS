import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm]       = useState({ email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { user, login, isSuperAdmin }   = useAuth();
  const navigate    = useNavigate();

  useEffect(() => {
    if (!user) return;
    if (user.role === 'Employee') navigate('/employee/dashboard', { replace: true });
    else if (isSuperAdmin) navigate('/companies', { replace: true });
    else navigate('/dashboard', { replace: true });
  }, [user, isSuperAdmin, navigate]);

  /* ── ALL LOGIC UNCHANGED ── */
  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await loginUser(form);
      login({ ...data.user, token: data.token });
      if (data.user.role === 'Employee') navigate('/employee/dashboard', { replace: true });
      else if (data.user.isSuperAdmin || data.user.role === 'SuperAdmin') navigate('/companies', { replace: true });
      else navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: '◈', label: 'Multi-company Payroll Processing' },
    { icon: '◈', label: 'Attendance Management' },
    { icon: '◈', label: 'Statutory Compliance (PF, ESI, TDS)' },
    { icon: '◈', label: 'Analytics & Reports' },
    { icon: '◈', label: 'PDF Payslip Generation' },
    { icon: '◈', label: 'Excel Export' },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=DM+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .login-root {
          display: flex;
          min-height: 100vh;
          font-family: 'DM Sans', sans-serif;
          background: #0b0c14;
        }

        /* ── LEFT PANEL ── */
        .login-left {
          flex: 1;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 64px 72px;
          overflow: hidden;
        }
        .login-left-bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 20% 50%, rgba(99,102,241,0.18) 0%, transparent 70%),
            radial-gradient(ellipse 60% 80% at 80% 80%, rgba(79,70,229,0.12) 0%, transparent 60%),
            linear-gradient(160deg, #0d0e1a 0%, #111228 50%, #0d0f1e 100%);
          z-index: 0;
        }
        /* subtle grid lines */
        .login-left-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px);
          background-size: 48px 48px;
          z-index: 0;
        }
        .login-left-content {
          position: relative;
          z-index: 1;
        }

        .login-brand {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 56px;
        }
        .login-brand-mark {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          background: linear-gradient(135deg, #6366f1, #4338ca);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'DM Mono', monospace;
          font-size: 13px;
          font-weight: 500;
          color: #fff;
          letter-spacing: -0.5px;
          box-shadow: 0 0 0 1px rgba(99,102,241,0.4), 0 8px 24px rgba(99,102,241,0.3);
        }
        .login-brand-name {
          font-size: 18px;
          font-weight: 600;
          color: #e8e8f0;
          letter-spacing: -0.3px;
        }

        .login-headline {
          font-size: 42px;
          font-weight: 300;
          line-height: 1.2;
          color: #f0f0f8;
          letter-spacing: -1.5px;
          margin-bottom: 16px;
        }
        .login-headline strong {
          font-weight: 600;
          background: linear-gradient(135deg, #818cf8, #6366f1);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .login-tagline {
          font-size: 15px;
          color: #6b6b84;
          line-height: 1.7;
          margin-bottom: 48px;
          max-width: 380px;
        }

        .login-features {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .login-feature {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .login-feature-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #6366f1;
          flex-shrink: 0;
          box-shadow: 0 0 8px rgba(99,102,241,0.6);
        }
        .login-feature-text {
          font-size: 14px;
          color: #8080a0;
          font-weight: 400;
        }

        .login-footer-text {
          position: absolute;
          bottom: 36px;
          left: 72px;
          font-size: 12px;
          color: #3a3a52;
          z-index: 1;
        }

        /* ── RIGHT PANEL ── */
        .login-right {
          width: 480px;
          flex-shrink: 0;
          background: #f4f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 32px;
        }

        .login-card {
          background: #ffffff;
          border-radius: 20px;
          padding: 44px 40px;
          width: 100%;
          box-shadow:
            0 0 0 1px rgba(0,0,0,0.05),
            0 8px 24px rgba(0,0,0,0.06),
            0 32px 64px rgba(0,0,0,0.04);
          animation: cardIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .login-card-eyebrow {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #6366f1;
          margin-bottom: 10px;
        }
        .login-card-title {
          font-size: 26px;
          font-weight: 600;
          color: #111118;
          letter-spacing: -0.6px;
          margin-bottom: 6px;
        }
        .login-card-sub {
          font-size: 14px;
          color: #8c8c9e;
          margin-bottom: 32px;
        }

        .login-error {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #fff1f3;
          border: 1px solid #fecdd3;
          color: #be123c;
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 13px;
          margin-bottom: 20px;
        }
        .login-error-icon { font-size: 15px; flex-shrink: 0; }

        .login-field { margin-bottom: 18px; }
        .login-label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: #3a3a4a;
          margin-bottom: 7px;
        }
        .login-input-wrap { position: relative; }
        .login-input {
          width: 100%;
          padding: 11px 14px;
          border: 1.5px solid #e4e4ec;
          border-radius: 10px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          color: #111118;
          background: #fafafa;
          outline: none;
          transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
        }
        .login-input::placeholder { color: #b0b0c0; }
        .login-input:focus {
          border-color: #6366f1;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
        }
        .login-input-suffix {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #9898b0;
          font-size: 13px;
          padding: 4px;
          font-family: 'DM Sans', sans-serif;
          user-select: none;
        }
        .login-input-suffix:hover { color: #5a5a72; }

        .login-btn-primary {
          width: 100%;
          padding: 13px;
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          margin-top: 8px;
          margin-bottom: 12px;
          transition: opacity 0.18s, transform 0.14s, box-shadow 0.18s;
          box-shadow: 0 4px 14px rgba(99,102,241,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .login-btn-primary:hover:not(:disabled) {
          opacity: 0.92;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(99,102,241,0.42);
        }
        .login-btn-primary:active:not(:disabled) { transform: translateY(0); }
        .login-btn-primary:disabled { opacity: 0.65; cursor: not-allowed; }

        .login-spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .login-btn-secondary {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          padding: 12px;
          background: transparent;
          color: #4f46e5;
          border: 1.5px solid #e0e0f0;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          text-decoration: none;
          transition: background 0.16s, border-color 0.16s;
          margin-bottom: 24px;
        }
        .login-btn-secondary:hover {
          background: #f0f0ff;
          border-color: #c7c7f0;
          text-decoration: none;
        }

        .login-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }
        .login-divider-line {
          flex: 1;
          height: 1px;
          background: #ebebf0;
        }
        .login-divider-text {
          font-size: 12px;
          color: #b0b0c0;
          white-space: nowrap;
        }

        .login-contact {
          text-align: center;
          font-size: 13px;
          color: #9898b0;
          margin-bottom: 20px;
        }
        .login-contact a {
          color: #6366f1;
          font-weight: 500;
          text-decoration: none;
        }
        .login-contact a:hover { text-decoration: underline; }

        .login-copyright {
          text-align: center;
          font-size: 11.5px;
          color: #c0c0d0;
        }

        /* ── Responsive ── */
        @media (max-width: 900px) {
          .login-left { display: none; }
          .login-right { width: 100%; background: #f4f5f9; }
        }
        @media (max-width: 480px) {
          .login-right { padding: 24px 16px; }
          .login-card { padding: 32px 24px; border-radius: 16px; }
        }
      `}</style>

      <div className="login-root">
        {/* ── LEFT PANEL ── */}
        <div className="login-left">
          <div className="login-left-bg" />
          <div className="login-left-grid" />
          <div className="login-left-content">

            <div className="login-brand">
              <div className="login-brand-mark">MC</div>
              <span className="login-brand-name">MCPCMS</span>
            </div>

            <h1 className="login-headline">
              Payroll &amp; compliance,<br />
              <strong>finally unified.</strong>
            </h1>
            <p className="login-tagline">
              Multi-company payroll processing, statutory compliance, and HR operations — all in one platform.
            </p>

            <div className="login-features">
              {features.map(f => (
                <div className="login-feature" key={f.label}>
                  <div className="login-feature-dot" />
                  <span className="login-feature-text">{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          <span className="login-footer-text">© 2026 MCPCMS. All rights reserved.</span>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="login-right">
          <div className="login-card">

            <p className="login-card-eyebrow">Admin and HR Portal</p>
            <h2 className="login-card-title">Welcome back</h2>
            <p className="login-card-sub">Sign in to your account to continue</p>

            {error && (
              <div className="login-error">
                <span className="login-error-icon">⚠</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="login-field">
                <label className="login-label" htmlFor="email">Email address</label>
                <div className="login-input-wrap">
                  <input
                    id="email"
                    className="login-input"
                    type="email"
                    placeholder="name@yourcompany.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="login-field">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}><label className="login-label" htmlFor="password">Password</label><Link to="/forgot-password" style={{ fontSize: '0.78rem', color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}>Forgot password?</Link></div>
                <div className="login-input-wrap">
                  <input
                    id="password"
                    className="login-input"
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    style={{ paddingRight: '52px' }}
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    className="login-input-suffix"
                    onClick={() => setShowPass(p => !p)}
                    tabIndex={-1}
                  >
                    {showPass ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <button
                className="login-btn-primary"
                type="submit"
                disabled={loading}
              >
                {loading
                  ? <><div className="login-spinner" /> Signing in…</>
                  : 'Sign in →'
                }
              </button>
            </form>

            <div className="login-divider">
              <div className="login-divider-line" />
              <span className="login-divider-text">or</span>
              <div className="login-divider-line" />
            </div>

            <Link to="/employee-login" className="login-btn-secondary">
              Employee login
            </Link>

            <p className="login-contact">
              New company?{' '}
              <Link to="/contact-sales">Contact Sales</Link>
            </p>

            <p className="login-copyright">© 2026 MCPCMS. All rights reserved.</p>
          </div>
        </div>
      </div>
    </>
  );
}
