import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginEmployee } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function EmployeeLogin() {
  const [form, setForm]       = useState({ identifier: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { user, login }   = useAuth();
  const navigate    = useNavigate();

  useEffect(() => {
    if (user?.role === 'Employee') navigate('/employee/dashboard', { replace: true });
    else if (user) navigate(user?.isSuperAdmin || user?.role === 'SuperAdmin' ? '/companies' : '/dashboard', { replace: true });
  }, [user, navigate]);

  /* ── ALL LOGIC UNCHANGED ── */
  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await loginEmployee(form);
      login({ ...data.user, token: data.token });
      navigate('/employee/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Employee login failed');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    'View attendance records',
    'Download monthly payslips',
    'Apply and track leave',
    'Keep profile details updated',
    'Receive company notifications',
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=DM+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .el-root {
          display: flex;
          min-height: 100vh;
          font-family: 'DM Sans', sans-serif;
        }

        /* ── RIGHT form side (shown first on mobile) ── */
        .el-right {
          width: 480px;
          flex-shrink: 0;
          background: #f4f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 32px;
          order: 2;
        }

        /* ── LEFT brand side ── */
        .el-left {
          flex: 1;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 64px 72px;
          overflow: hidden;
          order: 1;
        }
        .el-left-bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 70% 55% at 75% 40%, rgba(20,184,166,0.15) 0%, transparent 65%),
            radial-gradient(ellipse 50% 70% at 20% 80%, rgba(13,148,136,0.10) 0%, transparent 60%),
            linear-gradient(155deg, #080f12 0%, #0d1a1c 50%, #091014 100%);
          z-index: 0;
        }
        .el-left-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(20,184,166,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(20,184,166,0.05) 1px, transparent 1px);
          background-size: 48px 48px;
          z-index: 0;
        }
        .el-left-content { position: relative; z-index: 1; }

        .el-brand {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 56px;
        }
        .el-brand-mark {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          background: linear-gradient(135deg, #14b8a6, #0d9488);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'DM Mono', monospace;
          font-size: 13px;
          font-weight: 500;
          color: #fff;
          letter-spacing: -0.5px;
          box-shadow: 0 0 0 1px rgba(20,184,166,0.4), 0 8px 24px rgba(20,184,166,0.25);
        }
        .el-brand-name {
          font-size: 18px;
          font-weight: 600;
          color: #e0f0ee;
          letter-spacing: -0.3px;
        }
        .el-brand-badge {
          font-size: 11px;
          font-weight: 500;
          color: #0d9488;
          background: rgba(20,184,166,0.12);
          border: 1px solid rgba(20,184,166,0.2);
          border-radius: 20px;
          padding: 2px 10px;
          margin-left: 4px;
        }

        .el-headline {
          font-size: 40px;
          font-weight: 300;
          line-height: 1.2;
          color: #e8f4f2;
          letter-spacing: -1.4px;
          margin-bottom: 16px;
        }
        .el-headline strong {
          font-weight: 600;
          background: linear-gradient(135deg, #5eead4, #14b8a6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .el-tagline {
          font-size: 15px;
          color: #4a6a66;
          line-height: 1.7;
          margin-bottom: 48px;
          max-width: 380px;
        }

        .el-features { display: flex; flex-direction: column; gap: 14px; }
        .el-feature { display: flex; align-items: center; gap: 12px; }
        .el-feature-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #14b8a6;
          flex-shrink: 0;
          box-shadow: 0 0 8px rgba(20,184,166,0.5);
        }
        .el-feature-text { font-size: 14px; color: #5a8a84; }

        .el-footer-text {
          position: absolute;
          bottom: 36px; left: 72px;
          font-size: 12px;
          color: #1e3432;
          z-index: 1;
        }

        /* ── Card ── */
        .el-card {
          background: #ffffff;
          border-radius: 20px;
          padding: 44px 40px;
          width: 100%;
          box-shadow:
            0 0 0 1px rgba(0,0,0,0.05),
            0 8px 24px rgba(0,0,0,0.06),
            0 32px 64px rgba(0,0,0,0.04);
          animation: cardIn 0.4s cubic-bezier(0.16,1,0.3,1) both;
        }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .el-eyebrow {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #0d9488;
          margin-bottom: 10px;
        }
        .el-card-title {
          font-size: 26px;
          font-weight: 600;
          color: #111118;
          letter-spacing: -0.6px;
          margin-bottom: 6px;
        }
        .el-card-sub {
          font-size: 14px;
          color: #8c8c9e;
          margin-bottom: 32px;
        }

        .el-error {
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

        .el-field { margin-bottom: 18px; }
        .el-label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: #3a3a4a;
          margin-bottom: 7px;
        }
        .el-input-wrap { position: relative; }
        .el-input {
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
        .el-input::placeholder { color: #b0b0c0; }
        .el-input:focus {
          border-color: #14b8a6;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(20,184,166,0.12);
        }
        .el-input-suffix {
          position: absolute;
          right: 12px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none;
          cursor: pointer; color: #9898b0;
          font-size: 13px; padding: 4px;
          font-family: 'DM Sans', sans-serif;
          user-select: none;
        }
        .el-input-suffix:hover { color: #5a5a72; }

        .el-btn-primary {
          width: 100%;
          padding: 13px;
          background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          margin-top: 8px;
          margin-bottom: 28px;
          transition: opacity 0.18s, transform 0.14s, box-shadow 0.18s;
          box-shadow: 0 4px 14px rgba(20,184,166,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .el-btn-primary:hover:not(:disabled) {
          opacity: 0.92;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(20,184,166,0.38);
        }
        .el-btn-primary:active:not(:disabled) { transform: translateY(0); }
        .el-btn-primary:disabled { opacity: 0.65; cursor: not-allowed; }

        .el-spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .el-switch {
          text-align: center;
          font-size: 13px;
          color: #9898b0;
          padding-top: 20px;
          border-top: 1px solid #f0f0f5;
        }
        .el-switch a {
          color: #0d9488;
          font-weight: 600;
          text-decoration: none;
        }
        .el-switch a:hover { text-decoration: underline; }

        /* ── Responsive ── */
        @media (max-width: 900px) {
          .el-root { flex-direction: column; }
          .el-left { display: none; }
          .el-right { width: 100%; order: 1; }
        }
        @media (max-width: 480px) {
          .el-right { padding: 24px 16px; }
          .el-card { padding: 32px 24px; border-radius: 16px; }
        }
      `}</style>

      <div className="el-root">
        {/* ── LEFT BRAND PANEL ── */}
        <div className="el-left">
          <div className="el-left-bg" />
          <div className="el-left-grid" />
          <div className="el-left-content">

            <div className="el-brand">
              <div className="el-brand-mark">MC</div>
              <span className="el-brand-name">MCPCMS</span>
              <span className="el-brand-badge">Employee</span>
            </div>

            <h1 className="el-headline">
              Your work life,<br />
              <strong>at your fingertips.</strong>
            </h1>
            <p className="el-tagline">
              Access payslips, attendance, leave, and more — all from your personal self-service portal.
            </p>

            <div className="el-features">
              {features.map(f => (
                <div className="el-feature" key={f}>
                  <div className="el-feature-dot" />
                  <span className="el-feature-text">{f}</span>
                </div>
              ))}
            </div>
          </div>

          <span className="el-footer-text">© 2026 MCPCMS. All rights reserved.</span>
        </div>

        {/* ── RIGHT FORM PANEL ── */}
        <div className="el-right">
          <div className="el-card">

            <p className="el-eyebrow">Employee Portal</p>
            <h2 className="el-card-title">Welcome back</h2>
            <p className="el-card-sub">Sign in with your employee ID or email</p>

            {error && (
              <div className="el-error">
                <span>⚠</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="el-field">
                <label className="el-label" htmlFor="identifier">Employee ID or email</label>
                <div className="el-input-wrap">
                  <input
                    id="identifier"
                    className="el-input"
                    type="text"
                    placeholder="EMP0001 or name@company.com"
                    value={form.identifier}
                    onChange={e => setForm({ ...form, identifier: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="el-field">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}><label className="el-label" htmlFor="emp-password">Password</label><Link to="/forgot-password?from=employee" style={{ fontSize: '0.78rem', color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}>Forgot password?</Link></div>
                <div className="el-input-wrap">
                  <input
                    id="emp-password"
                    className="el-input"
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    style={{ paddingRight: '52px' }}
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    className="el-input-suffix"
                    onClick={() => setShowPass(p => !p)}
                    tabIndex={-1}
                  >
                    {showPass ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <button
                className="el-btn-primary"
                type="submit"
                disabled={loading}
              >
                {loading
                  ? <><div className="el-spinner" /> Signing in…</>
                  : 'Sign in →'
                }
              </button>
            </form>

            <div className="el-switch">
              Admin or HR?{' '}
              <Link to="/">Company login</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
