import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee, getCompanies, createSalaryStructure, getSalaryStructure } from '../services/api';

const emptyEmp = { name:'', email:'', phone:'', department:'', position:'', gender:'Male', companyId:'', bankAccount:'', ifscCode:'', panNumber:'', pfNumber:'' };
const emptySal = { basicSalary:'', hra:'', allowances:'', medicalAllowance:'', travelAllowance:'', deductions:'' };

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [form, setForm] = useState(emptyEmp);
  const [salForm, setSalForm] = useState(emptySal);
  const [editing, setEditing] = useState(null);
  const [salModal, setSalModal] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filterCompany, setFilterCompany] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [msg, setMsg] = useState({ text: '', type: 'success' });
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('basic'); // basic | bank | salary

  const toast = (text, type = 'success') => { setMsg({ text, type }); setTimeout(() => setMsg({ text: '' }), 3000); };
  const load = async () => {
    const [e, c] = await Promise.all([getEmployees(), getCompanies()]);
    setEmployees(e.data.employees || e.data);
    setCompanies(c.data.companies || c.data);
  };
  useEffect(() => { load(); }, []);

  const filtered = employees.filter(e =>
    (!filterCompany || e.companyId?._id === filterCompany) &&
    (!filterDept || e.department === filterDept)
  );
  const depts = [...new Set(employees.map(e => e.department))];

  const handleSubmit = async ev => {
    ev.preventDefault(); setLoading(true);
    try {
      if (editing) { await updateEmployee(editing, form); toast('✅ Employee updated'); }
      else { await createEmployee(form); toast('✅ Employee added'); }
      setForm(emptyEmp); setEditing(null); setShowForm(false); load();
    } catch (err) { toast('❌ ' + (err.response?.data?.message || 'Error'), 'error'); }
    finally { setLoading(false); }
  };

  const handleEdit = e => {
    setForm({ name: e.name, email: e.email, phone: e.phone || '', department: e.department, position: e.position, gender: e.gender || 'Male', companyId: e.companyId?._id || e.companyId, bankAccount: e.bankAccount || '', ifscCode: e.ifscCode || '', panNumber: e.panNumber || '', pfNumber: e.pfNumber || '' });
    setEditing(e._id); setShowForm(true); setTab('basic');
  };

  const openSalary = async emp => {
    setSalModal(emp);
    try { const r = await getSalaryStructure(emp._id); const s = r.data.salary; setSalForm({ basicSalary: s.basicSalary, hra: s.hra, allowances: s.allowances, medicalAllowance: s.medicalAllowance || 0, travelAllowance: s.travelAllowance || 0, deductions: s.deductions }); }
    catch { setSalForm(emptySal); }
  };

  const handleSalary = async ev => {
    ev.preventDefault(); setLoading(true);
    try {
      await createSalaryStructure({ ...salForm, employeeId: salModal._id });
      toast('✅ Salary structure saved'); setSalModal(null); load();
    } catch (err) { toast('❌ ' + (err.response?.data?.message || 'Error'), 'error'); }
    finally { setLoading(false); }
  };

  const handleDelete = async id => { if (!window.confirm('Delete this employee?')) return; await deleteEmployee(id); toast('Deleted'); load(); };

  const Inp = ({ k, ph, type = 'text', req }) => (
    <div><label style={S.label}>{ph}{req ? ' *' : ''}</label>
      <input style={S.input} type={type} placeholder={ph} value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} required={req} /></div>
  );

  return (
    <div style={{ background: '#f0f2f8', minHeight: '100vh' }}>
      <Navbar />
      <div style={S.container}>
        <div style={S.header}>
          <div><h2 style={S.title}>👥 Employee Management</h2><p style={S.sub}>{employees.length} total employees</p></div>
          <button style={S.btn} onClick={() => { setForm(emptyEmp); setEditing(null); setShowForm(!showForm); }}>
            {showForm ? '✕ Cancel' : '+ Add Employee'}
          </button>
        </div>

        {msg.text && <div style={{ ...S.toast, background: msg.type === 'error' ? '#ffebee' : '#e8f5e9', color: msg.type === 'error' ? '#c62828' : '#2e7d32' }}>{msg.text}</div>}

        {/* Add/Edit Form */}
        {showForm && (
          <div style={S.card}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
              {[['basic','Basic Info'], ['bank','Bank & Statutory']].map(([t, l]) => (
                <button key={t} style={{ ...S.tabBtn, ...(tab === t ? S.tabActive : {}) }} onClick={() => setTab(t)}>{l}</button>
              ))}
            </div>
            <form onSubmit={handleSubmit}>
              {tab === 'basic' && (
                <div style={S.grid3}>
                  <Inp k="name" ph="Full Name" req />
                  <Inp k="email" ph="Email" type="email" req />
                  <Inp k="phone" ph="Phone" />
                  <Inp k="department" ph="Department" req />
                  <Inp k="position" ph="Position / Designation" req />
                  <div><label style={S.label}>Gender</label>
                    <select style={S.input} value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                      {['Male','Female','Other'].map(g => <option key={g}>{g}</option>)}
                    </select></div>
                  <div><label style={S.label}>Company *</label>
                    <select style={S.input} value={form.companyId} onChange={e => setForm({ ...form, companyId: e.target.value })} required>
                      <option value="">Select Company</option>
                      {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select></div>
                </div>
              )}
              {tab === 'bank' && (
                <div style={S.grid3}>
                  <Inp k="bankAccount" ph="Bank Account No." />
                  <Inp k="ifscCode" ph="IFSC Code" />
                  <Inp k="panNumber" ph="PAN Number" />
                  <Inp k="pfNumber" ph="PF Account Number" />
                </div>
              )}
              <div style={{ marginTop: '1rem' }}>
                <button style={S.btn} type="submit" disabled={loading}>{loading ? 'Saving...' : editing ? 'Update Employee' : 'Add Employee'}</button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div style={{ ...S.card, display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', padding: '1rem 1.5rem' }}>
          <span style={{ fontWeight: '600', color: '#1a237e', fontSize: '0.85rem' }}>Filter:</span>
          <select style={{ ...S.input, width: 'auto' }} value={filterCompany} onChange={e => setFilterCompany(e.target.value)}>
            <option value="">All Companies</option>
            {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <select style={{ ...S.input, width: 'auto' }} value={filterDept} onChange={e => setFilterDept(e.target.value)}>
            <option value="">All Departments</option>
            {depts.map(d => <option key={d}>{d}</option>)}
          </select>
          <span style={{ marginLeft: 'auto', color: '#666', fontSize: '0.82rem' }}>{filtered.length} results</span>
        </div>

        {/* Table */}
        <div style={S.card}>
          <div style={{ overflowX: 'auto' }}>
            <table style={S.table}>
              <thead>
                <tr style={{ background: '#e8eaf6' }}>
                  {['Code','Name','Email','Dept','Position','Company','Salary','Status','Actions'].map(h => <th key={h} style={S.th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {filtered.map(emp => (
                  <tr key={emp._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={S.td}><span style={S.chip}>{emp.employeeCode}</span></td>
                    <td style={S.td}><strong>{emp.name}</strong></td>
                    <td style={S.td}>{emp.email}</td>
                    <td style={S.td}>{emp.department}</td>
                    <td style={S.td}>{emp.position}</td>
                    <td style={S.td}>{emp.companyId?.name || '—'}</td>
                    <td style={S.td}>{emp.salaryStructureId ? <span style={{ color: '#2e7d32', fontWeight: '600' }}>₹{emp.salaryStructureId.basicSalary?.toLocaleString('en-IN')}</span> : <span style={{ color: '#e65100', fontSize: '0.78rem' }}>Not set</span>}</td>
                    <td style={S.td}><span style={{ padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.72rem', background: emp.isActive ? '#e8f5e9' : '#ffebee', color: emp.isActive ? '#2e7d32' : '#c62828' }}>{emp.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td style={S.td}>
                      <button style={S.editBtn} onClick={() => handleEdit(emp)}>✏</button>
                      <button style={{ ...S.editBtn, background: '#e3f2fd', color: '#1565c0' }} onClick={() => openSalary(emp)}>₹</button>
                      <button style={S.delBtn} onClick={() => handleDelete(emp._id)}>🗑</button>
                    </td>
                  </tr>
                ))}
                {!filtered.length && <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: '#aaa' }}>No employees found.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* Salary Modal */}
        {salModal && (
          <div style={S.overlay}>
            <div style={S.modal}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div><h3 style={{ margin: 0, color: '#1a237e' }}>💰 Salary Structure</h3><p style={{ margin: '0.2rem 0 0', color: '#666', fontSize: '0.82rem' }}>{salModal.name} — {salModal.employeeCode}</p></div>
                <button style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => setSalModal(null)}>✕</button>
              </div>
              <form onSubmit={handleSalary} style={S.grid2}>
                {[['basicSalary','Basic Salary *',true],['hra','HRA',false],['allowances','Other Allowances',false],['medicalAllowance','Medical Allowance',false],['travelAllowance','Travel Allowance',false],['deductions','Fixed Deductions',false]].map(([k, ph, req]) => (
                  <div key={k}>
                    <label style={S.label}>{ph}</label>
                    <input style={S.input} type="number" min="0" placeholder="₹ 0" value={salForm[k]} onChange={e => setSalForm({ ...salForm, [k]: e.target.value })} required={req} />
                  </div>
                ))}
              </form>
              {salForm.basicSalary && (
                <div style={{ background: '#e8f5e9', borderRadius: '8px', padding: '0.75rem 1rem', marginTop: '1rem', fontSize: '0.85rem' }}>
                  <strong>Preview:</strong> Gross ≈ ₹{(Number(salForm.basicSalary || 0) + Number(salForm.hra || 0) + Number(salForm.allowances || 0) + Number(salForm.medicalAllowance || 0) + Number(salForm.travelAllowance || 0)).toLocaleString('en-IN')} | PF ≈ ₹{Math.min(Number(salForm.basicSalary || 0) * 0.12, 1800).toFixed(0)}
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button style={{ ...S.btn, flex: 1 }} onClick={handleSalary} disabled={loading}>{loading ? 'Saving...' : '💾 Save Structure'}</button>
                <button style={{ ...S.btn, background: '#666' }} onClick={() => setSalModal(null)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const S = {
  container: { padding: '1.5rem 2rem', maxWidth: '1400px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' },
  title: { margin: 0, color: '#1a237e', fontSize: '1.4rem' },
  sub: { margin: '0.2rem 0 0', color: '#666', fontSize: '0.85rem' },
  card: { background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', marginBottom: '1.25rem' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem' },
  label: { display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#555', marginBottom: '0.25rem' },
  input: { width: '100%', padding: '0.55rem 0.75rem', border: '1.5px solid #e0e0e0', borderRadius: '7px', fontSize: '0.88rem', boxSizing: 'border-box' },
  btn: { padding: '0.6rem 1.25rem', background: '#1a237e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: '600' },
  tabBtn: { padding: '0.4rem 1rem', border: '1.5px solid #e0e0e0', borderRadius: '6px', cursor: 'pointer', background: '#fff', fontSize: '0.82rem' },
  tabActive: { background: '#1a237e', color: '#fff', borderColor: '#1a237e' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '0.6rem 0.75rem', textAlign: 'left', fontSize: '0.75rem', color: '#1a237e', fontWeight: '600' },
  td: { padding: '0.6rem 0.75rem', fontSize: '0.82rem' },
  chip: { background: '#e8eaf6', color: '#1a237e', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: '600' },
  editBtn: { padding: '0.25rem 0.5rem', background: '#f5f5f5', color: '#333', border: 'none', borderRadius: '5px', cursor: 'pointer', marginRight: '0.3rem', fontSize: '0.78rem' },
  delBtn: { padding: '0.25rem 0.5rem', background: '#ffebee', color: '#c62828', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '0.78rem' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 },
  modal: { background: '#fff', padding: '2rem', borderRadius: '16px', width: '520px', maxHeight: '85vh', overflowY: 'auto' },
  toast: { padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.88rem', fontWeight: '500' },
};
