import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { getCompanies, createCompany, updateCompany, deleteCompany } from '../services/api';

const empty = { name: '', email: '', phone: '', industry: '', address: '', gstNumber: '', panNumber: '' };

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: 'success' });
  const [loading, setLoading] = useState(false);

  const load = async () => { const r = await getCompanies(); setCompanies(r.data.companies || r.data); };
  useEffect(() => { load(); }, []);

  const toast = (text, type = 'success') => { setMsg({ text, type }); setTimeout(() => setMsg({ text: '' }), 3000); };

  const handleSubmit = async e => {
    e.preventDefault(); setLoading(true);
    try {
      if (editing) { await updateCompany(editing, form); toast('✅ Company updated'); }
      else { await createCompany(form); toast('✅ Company created'); }
      setForm(empty); setEditing(null); setShowForm(false); load();
    } catch (err) { toast('❌ ' + (err.response?.data?.message || 'Error'), 'error'); }
    finally { setLoading(false); }
  };

  const handleEdit = c => { setForm({ name: c.name, email: c.email, phone: c.phone || '', industry: c.industry, address: c.address || '', gstNumber: c.gstNumber || '', panNumber: c.panNumber || '' }); setEditing(c._id); setShowForm(true); };
  const handleDelete = async id => { if (!window.confirm('Delete this company?')) return; await deleteCompany(id); toast('Deleted'); load(); };

  const industries = ['IT', 'Manufacturing', 'Healthcare', 'Finance', 'Retail', 'Education', 'Construction', 'Other'];

  return (
    <div style={{ background: '#f0f2f8', minHeight: '100vh' }}>
      <Navbar />
      <div style={S.container}>
        <div style={S.header}>
          <div><h2 style={S.title}>🏢 Company Management</h2><p style={S.sub}>{companies.length} companies registered</p></div>
          <button style={S.btn} onClick={() => { setForm(empty); setEditing(null); setShowForm(!showForm); }}>
            {showForm ? '✕ Cancel' : '+ Add Company'}
          </button>
        </div>

        {msg.text && <div style={{ ...S.toast, background: msg.type === 'error' ? '#ffebee' : '#e8f5e9', color: msg.type === 'error' ? '#c62828' : '#2e7d32' }}>{msg.text}</div>}

        {/* Form */}
        {showForm && (
          <div style={S.card}>
            <h3 style={S.cardTitle}>{editing ? 'Edit Company' : 'Add New Company'}</h3>
            <form onSubmit={handleSubmit} style={S.grid2}>
              {[['name','Company Name*','text'], ['email','Email*','email'], ['phone','Phone','text'], ['gstNumber','GST Number','text'], ['panNumber','PAN Number','text'], ['address','Address','text']].map(([k, ph, t]) => (
                <div key={k}>
                  <label style={S.label}>{ph}</label>
                  <input style={S.input} type={t} placeholder={ph} value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} required={ph.includes('*')} />
                </div>
              ))}
              <div>
                <label style={S.label}>Industry*</label>
                <select style={S.input} value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })} required>
                  <option value="">Select Industry</option>
                  {industries.map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button style={{ ...S.btn, width: '100%' }} type="submit" disabled={loading}>{loading ? 'Saving...' : editing ? 'Update Company' : 'Create Company'}</button>
              </div>
            </form>
          </div>
        )}

        {/* Table */}
        <div style={S.card}>
          <table style={S.table}>
            <thead>
              <tr style={{ background: '#e8eaf6' }}>
                {['Company Name', 'Email', 'Phone', 'Industry', 'GST', 'PAN', 'Actions'].map(h => <th key={h} style={S.th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {companies.map(c => (
                <tr key={c._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={S.td}><strong>{c.name}</strong></td>
                  <td style={S.td}>{c.email}</td>
                  <td style={S.td}>{c.phone || '—'}</td>
                  <td style={S.td}><span style={S.chip}>{c.industry}</span></td>
                  <td style={S.td}>{c.gstNumber || '—'}</td>
                  <td style={S.td}>{c.panNumber || '—'}</td>
                  <td style={S.td}>
                    <button style={S.editBtn} onClick={() => handleEdit(c)}>✏ Edit</button>
                    <button style={S.delBtn} onClick={() => handleDelete(c._id)}>🗑 Del</button>
                  </td>
                </tr>
              ))}
              {!companies.length && <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#aaa' }}>No companies yet. Add one above.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const S = {
  container: { padding: '1.5rem 2rem', maxWidth: '1300px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' },
  title: { margin: 0, color: '#1a237e', fontSize: '1.4rem' },
  sub: { margin: '0.2rem 0 0', color: '#666', fontSize: '0.85rem' },
  card: { background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', marginBottom: '1.25rem' },
  cardTitle: { margin: '0 0 1.25rem', color: '#1a237e', fontSize: '1.1rem' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  label: { display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#555', marginBottom: '0.3rem' },
  input: { width: '100%', padding: '0.6rem 0.75rem', border: '1.5px solid #e0e0e0', borderRadius: '8px', fontSize: '0.9rem', boxSizing: 'border-box' },
  btn: { padding: '0.6rem 1.25rem', background: '#1a237e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '0.65rem 0.75rem', textAlign: 'left', fontSize: '0.78rem', color: '#1a237e', fontWeight: '600' },
  td: { padding: '0.7rem 0.75rem', fontSize: '0.85rem' },
  chip: { background: '#e8eaf6', color: '#1a237e', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' },
  editBtn: { padding: '0.3rem 0.6rem', background: '#e8eaf6', color: '#1a237e', border: 'none', borderRadius: '6px', cursor: 'pointer', marginRight: '0.4rem', fontSize: '0.78rem' },
  delBtn: { padding: '0.3rem 0.6rem', background: '#ffebee', color: '#c62828', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem' },
  toast: { padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.88rem', fontWeight: '500' },
};
