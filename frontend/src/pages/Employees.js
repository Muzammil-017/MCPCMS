import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee, getCompanies, createSalaryStructure, getSalaryStructure } from '../services/api';

const emptyEmp = { name: '', email: '', phone: '', department: '', position: '', gender: 'Male', companyId: '', bankAccount: '', ifscCode: '', panNumber: '', pfNumber: '' };
const emptySal = { basicSalary: '', hra: '', allowances: '', medicalAllowance: '', travelAllowance: '', deductions: '' };

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
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState({ text: '', type: 'success' });
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('basic');

  const toast = (text, type = 'success') => { setMsg({ text, type }); setTimeout(() => setMsg({ text: '' }), 3000); };
  const load = async () => {
    const [employeeRes, companyRes] = await Promise.all([getEmployees(), getCompanies()]);
    setEmployees(employeeRes.data.employees || employeeRes.data);
    setCompanies(companyRes.data.companies || companyRes.data);
  };

  useEffect(() => { load(); }, []);

  const filtered = employees.filter(employee =>
    (!filterCompany || employee.companyId?._id === filterCompany) &&
    (!filterDept || employee.department === filterDept) &&
    (!search || [employee.name, employee.email, employee.employeeCode, employee.department, employee.position, employee.companyId?.name].filter(Boolean).join(' ').toLowerCase().includes(search.toLowerCase()))
  );
  const departments = [...new Set(employees.map(employee => employee.department))];
  const activeCount = filtered.filter(employee => employee.isActive).length;
  const missingSalaryCount = filtered.filter(employee => !employee.salaryStructureId).length;
  const companySpread = new Set(filtered.map(employee => employee.companyId?._id || employee.companyId).filter(Boolean)).size;

  const handleSubmit = async event => {
    event.preventDefault();
    setLoading(true);
    try {
      if (editing) {
        await updateEmployee(editing, form);
        toast('Employee updated');
      } else {
        await createEmployee(form);
        toast('Employee added');
      }
      setForm(emptyEmp);
      setEditing(null);
      setShowForm(false);
      load();
    } catch (err) {
      toast(err.response?.data?.message || 'Error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = employee => {
    setForm({
      name: employee.name,
      email: employee.email,
      phone: employee.phone || '',
      department: employee.department,
      position: employee.position,
      gender: employee.gender || 'Male',
      companyId: employee.companyId?._id || employee.companyId,
      bankAccount: employee.bankAccount || '',
      ifscCode: employee.ifscCode || '',
      panNumber: employee.panNumber || '',
      pfNumber: employee.pfNumber || '',
    });
    setEditing(employee._id);
    setShowForm(true);
    setTab('basic');
  };

  const openSalary = async employee => {
    setSalModal(employee);
    try {
      const response = await getSalaryStructure(employee._id);
      const salary = response.data.salary;
      setSalForm({
        basicSalary: salary.basicSalary,
        hra: salary.hra,
        allowances: salary.allowances,
        medicalAllowance: salary.medicalAllowance || 0,
        travelAllowance: salary.travelAllowance || 0,
        deductions: salary.deductions,
      });
    } catch {
      setSalForm(emptySal);
    }
  };

  const handleSalary = async event => {
    event.preventDefault();
    setLoading(true);
    try {
      await createSalaryStructure({ ...salForm, employeeId: salModal._id });
      toast('Salary structure saved');
      setSalModal(null);
      load();
    } catch (err) {
      toast(err.response?.data?.message || 'Error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this employee?')) return;
    await deleteEmployee(id);
    toast('Deleted');
    load();
  };

  const exportFilteredEmployees = () => {
    const rows = [
      ['Code', 'Name', 'Email', 'Department', 'Position', 'Company', 'Status'],
      ...filtered.map(employee => [
        employee.employeeCode || '',
        employee.name || '',
        employee.email || '',
        employee.department || '',
        employee.position || '',
        employee.companyId?.name || '',
        employee.isActive ? 'Active' : 'Inactive',
      ]),
    ];
    const csv = rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'employees_filtered.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const Input = ({ field, label, type = 'text', required = false }) => (
    <div>
      <label style={S.label}>{label}{required ? ' *' : ''}</label>
      <input style={S.input} type={type} placeholder={label} value={form[field]} onChange={event => setForm({ ...form, [field]: event.target.value })} required={required} />
    </div>
  );

  return (
    <div style={{ background: '#f0f2f8', minHeight: '100vh' }}>
      <Navbar />
      <div style={S.container}>
        <div style={S.header}>
          <div><h2 style={S.title}>Employee Management</h2><p style={S.sub}>{employees.length} total employees</p></div>
          <button style={S.btn} onClick={() => { setForm(emptyEmp); setEditing(null); setShowForm(!showForm); }}>
            {showForm ? 'Cancel' : 'Add Employee'}
          </button>
        </div>

        {msg.text && <div style={{ ...S.toast, background: msg.type === 'error' ? '#ffebee' : '#e8f5e9', color: msg.type === 'error' ? '#c62828' : '#2e7d32' }}>{msg.text}</div>}

        {showForm && (
          <div style={S.card}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
              {[['basic', 'Basic Info'], ['bank', 'Bank and Statutory']].map(([key, label]) => (
                <button key={key} type="button" style={{ ...S.tabBtn, ...(tab === key ? S.tabActive : {}) }} onClick={() => setTab(key)}>{label}</button>
              ))}
            </div>
            <form onSubmit={handleSubmit}>
              {tab === 'basic' && (
                <div style={S.grid3}>
                  <Input field="name" label="Full Name" required />
                  <Input field="email" label="Email" type="email" required />
                  <Input field="phone" label="Phone" />
                  <Input field="department" label="Department" required />
                  <Input field="position" label="Position / Designation" required />
                  <div>
                    <label style={S.label}>Gender</label>
                    <select style={S.input} value={form.gender} onChange={event => setForm({ ...form, gender: event.target.value })}>
                      {['Male', 'Female', 'Other'].map(option => <option key={option}>{option}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={S.label}>Company *</label>
                    <select style={S.input} value={form.companyId} onChange={event => setForm({ ...form, companyId: event.target.value })} required>
                      <option value="">Select Company</option>
                      {companies.map(company => <option key={company._id} value={company._id}>{company.name}</option>)}
                    </select>
                  </div>
                </div>
              )}
              {tab === 'bank' && (
                <div style={S.grid3}>
                  <Input field="bankAccount" label="Bank Account No." />
                  <Input field="ifscCode" label="IFSC Code" />
                  <Input field="panNumber" label="PAN Number" />
                  <Input field="pfNumber" label="PF Account Number" />
                </div>
              )}
              <div style={{ marginTop: '1rem' }}>
                <button style={S.btn} type="submit" disabled={loading}>{loading ? 'Saving...' : editing ? 'Update Employee' : 'Add Employee'}</button>
              </div>
            </form>
          </div>
        )}

        <div style={{ ...S.card, display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', padding: '1rem 1.5rem' }}>
          <span style={{ fontWeight: '600', color: '#1a237e', fontSize: '0.85rem' }}>Filter:</span>
          <input style={{ ...S.input, minWidth: '220px' }} placeholder="Search name, code, email..." value={search} onChange={event => setSearch(event.target.value)} />
          <select style={{ ...S.input, width: 'auto' }} value={filterCompany} onChange={event => setFilterCompany(event.target.value)}>
            <option value="">All Companies</option>
            {companies.map(company => <option key={company._id} value={company._id}>{company.name}</option>)}
          </select>
          <select style={{ ...S.input, width: 'auto' }} value={filterDept} onChange={event => setFilterDept(event.target.value)}>
            <option value="">All Departments</option>
            {departments.map(department => <option key={department}>{department}</option>)}
          </select>
          <button type="button" style={{ ...S.btn, background: '#2e7d32' }} onClick={exportFilteredEmployees}>Export CSV</button>
          <span style={{ marginLeft: 'auto', color: '#666', fontSize: '0.82rem' }}>{filtered.length} results</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
          {[
            ['Visible employees', filtered.length, '#1a237e'],
            ['Active records', activeCount, '#2e7d32'],
            ['Missing salary setup', missingSalaryCount, '#e65100'],
          ].map(([label, value, color]) => (
            <div key={label} style={{ background: '#fff', borderRadius: '12px', padding: '1rem 1.2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', borderTop: `3px solid ${color}` }}>
              <div style={{ fontSize: '1.45rem', color, fontWeight: '700' }}>{value}</div>
              <div style={{ marginTop: '0.25rem', color: '#475467', fontSize: '0.82rem' }}>{label}</div>
              {label === 'Visible employees' && <div style={{ marginTop: '0.3rem', color: '#98a2b3', fontSize: '0.72rem' }}>{companySpread} companies in current view</div>}
            </div>
          ))}
        </div>

        <div style={S.card}>
          <div style={{ overflowX: 'auto' }}>
            <table style={S.table}>
              <thead>
                <tr style={{ background: '#e8eaf6' }}>
                  {['Code', 'Name', 'Email', 'Dept', 'Position', 'Company', 'Salary', 'Status', 'Actions'].map(header => <th key={header} style={S.th}>{header}</th>)}
                </tr>
              </thead>
              <tbody>
                {filtered.map(employee => (
                  <tr key={employee._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={S.td}><span style={S.chip}>{employee.employeeCode}</span></td>
                    <td style={S.td}><strong>{employee.name}</strong></td>
                    <td style={S.td}>{employee.email}</td>
                    <td style={S.td}>{employee.department}</td>
                    <td style={S.td}>{employee.position}</td>
                    <td style={S.td}>{employee.companyId?.name || '-'}</td>
                    <td style={S.td}>{employee.salaryStructureId ? <span style={{ color: '#2e7d32', fontWeight: '600' }}>INR {employee.salaryStructureId.basicSalary?.toLocaleString('en-IN')}</span> : <span style={{ color: '#e65100', fontSize: '0.78rem' }}>Not set</span>}</td>
                    <td style={S.td}><span style={{ padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.72rem', background: employee.isActive ? '#e8f5e9' : '#ffebee', color: employee.isActive ? '#2e7d32' : '#c62828' }}>{employee.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td style={S.td}>
                      <button type="button" style={S.editBtn} onClick={() => handleEdit(employee)}>Edit</button>
                      <button type="button" style={{ ...S.editBtn, background: '#e3f2fd', color: '#1565c0' }} onClick={() => openSalary(employee)}>Salary</button>
                      <button type="button" style={S.delBtn} onClick={() => handleDelete(employee._id)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {!filtered.length && <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: '#aaa' }}>No employees found.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {salModal && (
          <div style={S.overlay}>
            <div style={S.modal}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div><h3 style={{ margin: 0, color: '#1a237e' }}>Salary Structure</h3><p style={{ margin: '0.2rem 0 0', color: '#666', fontSize: '0.82rem' }}>{salModal.name} - {salModal.employeeCode}</p></div>
                <button type="button" style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => setSalModal(null)}>X</button>
              </div>
              <form onSubmit={handleSalary} style={S.grid2}>
                {[['basicSalary', 'Basic Salary *', true], ['hra', 'HRA', false], ['allowances', 'Other Allowances', false], ['medicalAllowance', 'Medical Allowance', false], ['travelAllowance', 'Travel Allowance', false], ['deductions', 'Fixed Deductions', false]].map(([field, label, required]) => (
                  <div key={field}>
                    <label style={S.label}>{label}</label>
                    <input style={S.input} type="number" min="0" placeholder="INR 0" value={salForm[field]} onChange={event => setSalForm({ ...salForm, [field]: event.target.value })} required={required} />
                  </div>
                ))}
              </form>
              {salForm.basicSalary && (
                <div style={{ background: '#e8f5e9', borderRadius: '8px', padding: '0.75rem 1rem', marginTop: '1rem', fontSize: '0.85rem' }}>
                  <strong>Preview:</strong> Gross about INR {(Number(salForm.basicSalary || 0) + Number(salForm.hra || 0) + Number(salForm.allowances || 0) + Number(salForm.medicalAllowance || 0) + Number(salForm.travelAllowance || 0)).toLocaleString('en-IN')} | PF about INR {Math.min(Number(salForm.basicSalary || 0) * 0.12, 1800).toFixed(0)}
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" style={{ ...S.btn, flex: 1 }} onClick={handleSalary} disabled={loading}>{loading ? 'Saving...' : 'Save Structure'}</button>
                <button type="button" style={{ ...S.btn, background: '#666' }} onClick={() => setSalModal(null)}>Cancel</button>
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
