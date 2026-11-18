import { useEffect, useState } from 'react';
import { getCompanyAdmins, createCompanyAdmin, updateCompanyAdmin, resetCompanyAdminPassword } from '../services/api';

const emptyNew = { name: '', email: '', password: '' };

// SuperAdmin view of one company's Admin accounts: edit name/email, activate/deactivate,
// set password, add another admin. No other company data is shown here.
export default function CompanyAdminsModal({ company, onClose }) {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);   // { _id, name, email }
  const [pwFor, setPwFor] = useState(null);        // admin
  const [password, setPassword] = useState('');
  const [adding, setAdding] = useState(false);
  const [newAdmin, setNewAdmin] = useState(emptyNew);
  const [msg, setMsg] = useState({ text: '', type: 'ok' });
  const [saving, setSaving] = useState(false);

  const flash = (text, type = 'ok') => setMsg({ text, type });
  const errorOf = err => err.response?.data?.message || 'Something went wrong';

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await getCompanyAdmins(company._id);
      setAdmins(data.admins || []);
    } catch (err) {
      flash(errorOf(err), 'err');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [company._id]);

  const run = async (action, successText) => {
    setSaving(true);
    try {
      await action();
      flash(successText);
      setEditing(null);
      setPwFor(null);
      setPassword('');
      setAdding(false);
      setNewAdmin(emptyNew);
      await load();
    } catch (err) {
      flash(errorOf(err), 'err');
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = event => {
    event.preventDefault();
    run(() => updateCompanyAdmin(company._id, editing._id, { name: editing.name, email: editing.email }), 'Admin details updated');
  };

  const savePassword = event => {
    event.preventDefault();
    if (password.length < 6) return flash('Password must be at least 6 characters', 'err');
    run(() => resetCompanyAdminPassword(company._id, pwFor._id, { password }), `Password updated for ${pwFor.name}`);
  };

  const saveNew = event => {
    event.preventDefault();
    if (newAdmin.password.length < 6) return flash('Password must be at least 6 characters', 'err');
    run(() => createCompanyAdmin(company._id, newAdmin), `Admin ${newAdmin.name} added`);
  };

  const toggleActive = admin => run(
    () => updateCompanyAdmin(company._id, admin._id, { isActive: !admin.isActive }),
    `${admin.name} ${admin.isActive ? 'deactivated' : 'activated'}`
  );

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="company-admins-title">
        <div style={S.header}>
          <div>
            <h3 id="company-admins-title" style={S.title}>Company admins</h3>
            <p style={S.sub}>{company.name} · login accounts only</p>
          </div>
          <button type="button" aria-label="Close" style={S.close} onClick={onClose}>✕</button>
        </div>

        {msg.text && <div role="status" style={{ ...S.alert, ...(msg.type === 'err' ? S.err : S.ok) }}>{msg.text}</div>}

        {loading ? <p style={S.muted}>Loading admins...</p> : (
          <div style={{ display: 'grid', gap: '0.7rem' }}>
            {admins.map(admin => (
              <div key={admin._id} style={S.row}>
                {editing?._id === admin._id ? (
                  <form onSubmit={saveEdit} style={S.inlineForm}>
                    <input style={S.input} aria-label="Admin name" required value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} />
                    <input style={S.input} aria-label="Admin email" type="email" required value={editing.email} onChange={e => setEditing({ ...editing, email: e.target.value })} />
                    <div style={S.actions}>
                      <button type="submit" style={S.primarySm} disabled={saving}>Save</button>
                      <button type="button" style={S.secondarySm} onClick={() => setEditing(null)}>Cancel</button>
                    </div>
                  </form>
                ) : pwFor?._id === admin._id ? (
                  <form onSubmit={savePassword} style={S.inlineForm}>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>New password for {admin.name}</div>
                    <input style={S.input} aria-label="New password" type="password" required minLength={6} autoComplete="new-password" placeholder="Minimum 6 characters" value={password} onChange={e => setPassword(e.target.value)} />
                    <div style={S.actions}>
                      <button type="submit" style={S.primarySm} disabled={saving}>Update password</button>
                      <button type="button" style={S.secondarySm} onClick={() => setPwFor(null)}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{admin.name}</div>
                      <div style={{ ...S.muted, overflowWrap: 'anywhere' }}>{admin.email}</div>
                      <span style={{ ...S.badge, ...(admin.isActive ? S.active : S.inactive) }}>{admin.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                    <div style={S.actions}>
                      <button type="button" style={S.secondarySm} onClick={() => { setEditing({ _id: admin._id, name: admin.name, email: admin.email }); setPwFor(null); setMsg({ text: '' }); }}>Edit</button>
                      <button type="button" style={S.secondarySm} onClick={() => { setPwFor(admin); setPassword(''); setEditing(null); setMsg({ text: '' }); }}>Password</button>
                      <button type="button" style={{ ...S.secondarySm, color: admin.isActive ? '#c2410c' : '#15803d' }} onClick={() => toggleActive(admin)} disabled={saving}>{admin.isActive ? 'Deactivate' : 'Activate'}</button>
                    </div>
                  </>
                )}
              </div>
            ))}
            {!admins.length && <p style={S.muted}>This company has no admin account.</p>}
          </div>
        )}

        {adding ? (
          <form onSubmit={saveNew} style={{ ...S.row, ...S.inlineForm, marginTop: '0.9rem' }}>
            <div style={{ fontWeight: 700, color: '#0f172a' }}>Add another admin</div>
            <input style={S.input} aria-label="Name" required placeholder="Full name" value={newAdmin.name} onChange={e => setNewAdmin({ ...newAdmin, name: e.target.value })} />
            <input style={S.input} aria-label="Email" type="email" required placeholder="name@yourcompany.com" value={newAdmin.email} onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })} />
            <input style={S.input} aria-label="Password" type="password" required minLength={6} autoComplete="new-password" placeholder="Password (min 6 characters)" value={newAdmin.password} onChange={e => setNewAdmin({ ...newAdmin, password: e.target.value })} />
            <div style={S.actions}>
              <button type="submit" style={S.primarySm} disabled={saving}>Create admin</button>
              <button type="button" style={S.secondarySm} onClick={() => setAdding(false)}>Cancel</button>
            </div>
          </form>
        ) : (
          <button type="button" style={{ ...S.primarySm, marginTop: '0.9rem' }} onClick={() => { setAdding(true); setMsg({ text: '' }); }}>+ Add admin</button>
        )}
      </div>
    </div>
  );
}

const S = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' },
  modal: { background: '#fff', borderRadius: '18px', padding: '1.4rem', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(15,23,42,0.25)', fontFamily: 'Inter, system-ui, sans-serif', boxSizing: 'border-box' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' },
  title: { margin: 0, color: '#0f172a', fontSize: '1.1rem' },
  sub: { margin: '0.2rem 0 0', color: '#64748b', fontSize: '0.82rem' },
  close: { background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: '#64748b' },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap', padding: '0.8rem', border: '1px solid #e2e8f0', borderRadius: '12px' },
  inlineForm: { display: 'grid', gap: '0.55rem', width: '100%' },
  input: { width: '100%', boxSizing: 'border-box', padding: '0.6rem 0.75rem', borderRadius: '10px', border: '1.5px solid #dbe3ef', fontSize: '0.88rem' },
  actions: { display: 'flex', gap: '0.4rem', flexWrap: 'wrap' },
  primarySm: { padding: '0.5rem 0.85rem', borderRadius: '9px', border: 'none', background: '#4f46e5', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' },
  secondarySm: { padding: '0.5rem 0.8rem', borderRadius: '9px', border: '1px solid #cbd5e1', background: '#fff', color: '#334155', fontWeight: 600, cursor: 'pointer', fontSize: '0.82rem' },
  muted: { color: '#64748b', fontSize: '0.82rem', margin: 0 },
  badge: { display: 'inline-block', marginTop: '0.35rem', padding: '0.18rem 0.5rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700 },
  active: { background: '#dcfce7', color: '#15803d' },
  inactive: { background: '#f1f5f9', color: '#64748b' },
  alert: { padding: '0.65rem 0.8rem', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '0.9rem' },
  err: { background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' },
  ok: { background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' },
};
