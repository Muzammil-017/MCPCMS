import { useState } from "react";
import { API_BASE_URL } from "../services/api";

export default function ContactSales() {
  const [form, setForm] = useState({ company: "", email: "", message: "" });
  const [errors, setErrors]   = useState({});
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  /* ── ALL LOGIC UNCHANGED ── */
  const validate = () => {
    let newErrors = {};
    if (!form.company.trim()) newErrors.company = "Company name is required";
    if (!form.email.trim())   newErrors.email   = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = "Invalid email format";
    if (!form.message.trim()) newErrors.message = "Please enter your requirements";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setSuccess("");
    try {
      const res  = await fetch(`${API_BASE_URL}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("success");
        setForm({ company: "", email: "", message: "" });
      } else {
        setSuccess("error");
      }
    } catch (err) {
      console.error(err);
      setSuccess("error");
    } finally {
      setLoading(false);
    }
  };

  const perks = [
    { icon: "", title: "Quick onboarding", desc: "Up and running in under 48 hours" },
    { icon: "", title: "Multi-company ready", desc: "Manage unlimited entities from one dashboard" },
    { icon: "", title: "Compliance built-in", desc: "PF, ESI, TDS auto-calculated every cycle" },
    { icon: "", title: "Real-time analytics", desc: "Live payroll trends and department insights" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=DM+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .cs-root {
          display: flex;
          min-height: 100vh;
          font-family: 'DM Sans', sans-serif;
          background: #0b0c14;
        }

        /* ══ LEFT PANEL ══ */
        .cs-left {
          flex: 1;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 64px 72px;
          overflow: hidden;
        }
        .cs-left-bg {
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 70% 50% at 30% 40%, rgba(99,102,241,0.16) 0%, transparent 65%),
            radial-gradient(ellipse 50% 70% at 80% 80%, rgba(139,92,246,0.10) 0%, transparent 60%),
            linear-gradient(155deg, #0d0e1a 0%, #111228 60%, #0d0f1e 100%);
          z-index: 0;
        }
        .cs-left-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px);
          background-size: 48px 48px;
          z-index: 0;
        }
        .cs-left-content { position: relative; z-index: 1; }

        /* brand */
        .cs-brand {
          display: flex; align-items: center; gap: 12px;
          margin-bottom: 64px;
          text-decoration: none;
        }
        .cs-brand-mark {
          width: 40px; height: 40px; border-radius: 9px;
          background: linear-gradient(135deg, #6366f1, #4338ca);
          display: flex; align-items: center; justify-content: center;
          font-family: 'DM Mono', monospace;
          font-size: 12px; font-weight: 500; color: #fff;
          box-shadow: 0 0 0 1px rgba(99,102,241,0.4), 0 6px 20px rgba(99,102,241,0.28);
        }
        .cs-brand-name { font-size: 17px; font-weight: 600; color: #e8e8f0; letter-spacing: -0.3px; }

        .cs-eyebrow {
          font-size: 11px; font-weight: 600; letter-spacing: 0.1em;
          text-transform: uppercase; color: #6366f1; margin-bottom: 16px;
        }
        .cs-headline {
          font-size: 44px; font-weight: 300; line-height: 1.15;
          color: #f0f0f8; letter-spacing: -1.6px; margin-bottom: 20px;
        }
        .cs-headline strong {
          font-weight: 600;
          background: linear-gradient(135deg, #818cf8, #6366f1);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .cs-tagline {
          font-size: 15px; color: #5a5a78; line-height: 1.7;
          margin-bottom: 52px; max-width: 380px;
        }

        /* perks grid */
        .cs-perks { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .cs-perk {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px; padding: 18px 20px;
          transition: border-color 0.2s, background 0.2s;
        }
        .cs-perk:hover {
          background: rgba(99,102,241,0.06);
          border-color: rgba(99,102,241,0.2);
        }
        .cs-perk-icon { font-size: 20px; margin-bottom: 8px; }
        .cs-perk-title { font-size: 13px; font-weight: 600; color: #c0c0d8; margin-bottom: 4px; }
        .cs-perk-desc  { font-size: 12px; color: #4a4a62; line-height: 1.5; }

        .cs-left-footer {
          position: absolute; bottom: 36px; left: 72px;
          font-size: 12px; color: #2a2a3e; z-index: 1;
        }

        /* ══ RIGHT PANEL ══ */
        .cs-right {
          width: 500px; flex-shrink: 0;
          background: #f4f5f9;
          display: flex; align-items: center; justify-content: center;
          padding: 40px 36px;
        }

        .cs-card {
          background: #fff; border-radius: 20px;
          padding: 48px 44px; width: 100%;
          box-shadow:
            0 0 0 1px rgba(0,0,0,0.05),
            0 8px 24px rgba(0,0,0,0.06),
            0 32px 64px rgba(0,0,0,0.04);
          animation: cardIn 0.4s cubic-bezier(0.16,1,0.3,1) both;
        }
        @keyframes cardIn {
          from { opacity:0; transform: translateY(16px); }
          to   { opacity:1; transform: translateY(0); }
        }

        .cs-card-eyebrow {
          font-size: 11px; font-weight: 600; letter-spacing: 0.08em;
          text-transform: uppercase; color: #6366f1; margin-bottom: 10px;
        }
        .cs-card-title {
          font-size: 26px; font-weight: 600; color: #111118;
          letter-spacing: -0.6px; margin-bottom: 6px;
        }
        .cs-card-sub {
          font-size: 14px; color: #8c8c9e; margin-bottom: 32px;
          line-height: 1.6;
        }

        /* success / error banner */
        .cs-banner {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 14px 16px; border-radius: 12px;
          margin-bottom: 24px; font-size: 14px; line-height: 1.5;
        }
        .cs-banner.ok {
          background: #f0fdf4; border: 1px solid #bbf7d0; color: #15803d;
        }
        .cs-banner.err {
          background: #fff1f2; border: 1px solid #fecdd3; color: #be123c;
        }
        .cs-banner-icon { font-size: 18px; flex-shrink: 0; margin-top: 1px; }

        /* fields */
        .cs-field { margin-bottom: 20px; }
        .cs-label {
          display: block; font-size: 13px; font-weight: 500;
          color: #3a3a4a; margin-bottom: 7px;
        }
        .cs-input, .cs-textarea {
          width: 100%; padding: 11px 14px;
          border: 1.5px solid #e4e4ec; border-radius: 10px;
          font-size: 14px; font-family: 'DM Sans', sans-serif;
          color: #111118; background: #fafafa; outline: none;
          transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
        }
        .cs-input::placeholder, .cs-textarea::placeholder { color: #b0b0c0; }
        .cs-input:focus, .cs-textarea:focus {
          border-color: #6366f1; background: #fff;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
        }
        .cs-input.has-error, .cs-textarea.has-error {
          border-color: #f43f5e;
          background: #fff5f6;
        }
        .cs-input.has-error:focus, .cs-textarea.has-error:focus {
          box-shadow: 0 0 0 3px rgba(244,63,94,0.10);
        }
        .cs-textarea { min-height: 110px; resize: vertical; line-height: 1.6; }
        .cs-field-error {
          display: flex; align-items: center; gap: 5px;
          font-size: 12px; color: #e11d48; margin-top: 5px;
        }

        /* char count hint */
        .cs-field-meta {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 7px;
        }
        .cs-char-count { font-size: 12px; color: #c0c0d0; }

        /* submit */
        .cs-btn {
          width: 100%; padding: 14px;
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          color: #fff; border: none; border-radius: 10px;
          font-size: 15px; font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer; margin-top: 4px;
          transition: opacity 0.18s, transform 0.14s, box-shadow 0.18s;
          box-shadow: 0 4px 14px rgba(99,102,241,0.35);
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .cs-btn:hover:not(:disabled) {
          opacity: 0.92; transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(99,102,241,0.42);
        }
        .cs-btn:active:not(:disabled) { transform: translateY(0); }
        .cs-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .cs-spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff; border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .cs-back {
          display: flex; align-items: center; justify-content: center;
          gap: 6px; margin-top: 20px;
          font-size: 13px; color: #9898b0; text-decoration: none;
          transition: color 0.15s;
        }
        .cs-back:hover { color: #6366f1; text-decoration: none; }

        /* ══ Responsive ══ */
        @media (max-width: 960px) { .cs-left { display: none; } .cs-right { width: 100%; } }
        @media (max-width: 480px) {
          .cs-right { padding: 24px 16px; }
          .cs-card  { padding: 32px 24px; border-radius: 16px; }
        }
      `}</style>

      <div className="cs-root">

        {/* ══ LEFT PANEL ══ */}
        <div className="cs-left">
          <div className="cs-left-bg" />
          <div className="cs-left-grid" />
          <div className="cs-left-content">

            <a href="/" className="cs-brand" style={{ textDecoration: 'none' }}>
              <div className="cs-brand-mark">MC</div>
              <span className="cs-brand-name">MCPCMS</span>
            </a>

            <p className="cs-eyebrow">Sales enquiry</p>
            <h1 className="cs-headline">
              Let's get your<br />
              <strong>team onboarded.</strong>
            </h1>
            <p className="cs-tagline">
              Tell us about your company and we'll reach out within 24 hours with a tailored demo and pricing plan.
            </p>

            <div className="cs-perks">
              {perks.map(p => (
                <div className="cs-perk" key={p.title}>
                  <div className="cs-perk-icon">{p.icon}</div>
                  <div className="cs-perk-title">{p.title}</div>
                  <div className="cs-perk-desc">{p.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <span className="cs-left-footer">© 2026 MCPCMS. All rights reserved.</span>
        </div>

        {/* ══ RIGHT PANEL ══ */}
        <div className="cs-right">
          <div className="cs-card">

            <p className="cs-card-eyebrow">Get in touch</p>
            <h2 className="cs-card-title">Contact Sales</h2>
            <p className="cs-card-sub">
              Fill in the form below and our sales team will get back to you within 24 hours.
            </p>

            {/* Success / Error banner */}
            {success === "success" && (
              <div className="cs-banner ok">
                <span className="cs-banner-icon"></span>
                <span>Message Sent Successfully

Thanks for contacting us.
Our sales team will reach out within 24 hours.
</span>
              </div>
            )}
            {success === "error" && (
              <div className="cs-banner err">
                <span className="cs-banner-icon">⚠</span>
                <span>Something went wrong. Please try again or email us directly.</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>

              {/* Company */}
              <div className="cs-field">
                <label className="cs-label" htmlFor="company">Company name</label>
                <input
                  id="company"
                  className={`cs-input${errors.company ? ' has-error' : ''}`}
                  name="company"
                  type="text"
                  placeholder="Acme Corp"
                  value={form.company}
                  onChange={handleChange}
                />
                {errors.company && (
                  <span className="cs-field-error">⚠ {errors.company}</span>
                )}
              </div>

              {/* Email */}
              <div className="cs-field">
                <label className="cs-label" htmlFor="email">Work email</label>
                <input
                  id="email"
                  className={`cs-input${errors.email ? ' has-error' : ''}`}
                  name="email"
                  type="email"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={handleChange}
                />
                {errors.email && (
                  <span className="cs-field-error">⚠ {errors.email}</span>
                )}
              </div>

              {/* Message */}
              <div className="cs-field">
                <div className="cs-field-meta">
                  <label className="cs-label" htmlFor="message" style={{ margin: 0 }}>
                    Requirements
                  </label>
                  <span className="cs-char-count">{form.message.length} / 500</span>
                </div>
                <textarea
                  id="message"
                  className={`cs-textarea${errors.message ? ' has-error' : ''}`}
                  name="message"
                  placeholder="Tell us about your company size, payroll needs, compliance requirements…"
                  value={form.message}
                  onChange={handleChange}
                  maxLength={500}
                />
                {errors.message && (
                  <span className="cs-field-error">⚠ {errors.message}</span>
                )}
              </div>

              <button className="cs-btn" type="submit" disabled={loading}>
                {loading
                  ? <><div className="cs-spinner" /> Submitting…</>
                  : 'Submit request →'
                }
              </button>
            </form>

            <a href="/" className="cs-back">
              ← Back to login
            </a>
          </div>
        </div>
      </div>
    </>
  );
}