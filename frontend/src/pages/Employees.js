import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { getEmployees, createEmployee, bulkCreateEmployees, updateEmployee, deleteEmployee, getCompanies, createSalaryStructure, getSalaryStructure, resetEmployeePassword } from '../services/api';
import { useAuth } from '../context/AuthContext';

const emptyEmp = { name: '', email: '', password: '', phone: '', department: '', position: '', gender: 'Male', companyId: '', bankAccount: '', ifscCode: '', panNumber: '', pfNumber: '' };
const emptySal = { basicSalary: '', hra: '', allowances: '', medicalAllowance: '', travelAllowance: '', deductions: '' };
const sampleCsv = `name,email,password,phone,department,position,gender,basicSalary,hra,allowances
Rahul Sharma,rahul@example.com,Rahul@2026,9999999999,IT,Developer,Male,50000,15000,5000
Priya Singh,priya@example.com,Priya@2026,8888888888,HR,HR Manager,Female,60000,18000,6000`;

function EmployeeInput({ field, label, value, onChange, type = 'text', required = false, minLength, autoComplete }) {
  return (
    <div>
      <label style={S.label}>{label}{required ? ' *' : ''}</label>
      <input style={S.input} type={type} placeholder={label} value={value} onChange={event => onChange(field, event.target.value)} required={required} minLength={minLength} autoComplete={autoComplete} />
    </div>
  );
}

export default function Employees() {
  const { isSuperAdmin, companyId } = useAuth();
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
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState(sampleCsv);
  const [bulkResults, setBulkResults] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [tab, setTab] = useState('basic');
  const [pwModal, setPwModal] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  const toast = (text, type = 'success') => { setMsg({ text, type }); setTimeout(() => setMsg({ text: '' }), 3000); };
  const load = async () => {
    const [employeeRes, companyRes] = await Promise.all([getEmployees(), getCompanies()]);
    setEmployees(employeeRes.data.employees || employeeRes.data);
    setCompanies(companyRes.data.companies || companyRes.data);
  };

  useEffect(() => { load(); }, []);

  const filtered = employees.filter(employee =>
    (!isSuperAdmin || !filterCompany || employee.companyId?._id === filterCompany) &&
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
      const payload = isSuperAdmin ? form : { ...form, companyId };
      if (editing) {
        await updateEmployee(editing, payload);
        toast('Employee updated');
      } else {
        await createEmployee(payload);
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
      companyId: isSuperAdmin ? (employee.companyId?._id || employee.companyId) : companyId,
      bankAccount: employee.bankAccount || '',
      ifscCode: employee.ifscCode || '',
      panNumber: employee.panNumber || '',
      pfNumber: employee.pfNumber || '',
    });
    setEditing(employee._id);
    setShowForm(true);
    setTab('basic');
  };

  const handlePasswordReset = async event => {
    event.preventDefault();
    if (newPassword.length < 6) return toast('Password must be at least 6 characters', 'error');
    setLoading(true);
    try {
      const { data } = await resetEmployeePassword(pwModal._id, { password: newPassword });
      toast(data.message || 'Password updated');
      setPwModal(null);
      setNewPassword('');
    } catch (err) {
      toast(err.response?.data?.message || 'Could not update password', 'error');
    } finally {
      setLoading(false);
    }
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

  const parseCsvLine = line => {
    const values = [];
    let value = '';
    let quoted = false;
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      const next = line[i + 1];
      if (char === '"' && quoted && next === '"') {
        value += '"';
        i += 1;
      } else if (char === '"') {
        quoted = !quoted;
      } else if (char === ',' && !quoted) {
        values.push(value.trim());
        value = '';
      } else {
        value += char;
      }
    }
    values.push(value.trim());
    return values;
  };

  const parseEmployeesCsv = text => {
    const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    if (lines.length < 2) throw new Error('CSV must include a header row and at least one employee row');
    const headers = parseCsvLine(lines[0]).map(header => header.trim());
    return lines.slice(1).map(line => {
      const values = parseCsvLine(line);
      return headers.reduce((row, header, index) => {
        row[header] = values[index] || '';
        return row;
      }, {});
    });
  };

  const getBulkPreview = () => {
    try {
      const rows = parseEmployeesCsv(bulkText);
      const seen = new Set();
      const issues = [];
      rows.forEach((row, index) => {
        const rowNo = index + 1;
        ['name', 'email', 'department', 'position'].forEach(field => {
          if (!row[field]) issues.push(`Row ${rowNo}: ${field} is required`);
        });
        if (row.email) {
          const email = row.email.toLowerCase();
          if (seen.has(email)) issues.push(`Row ${rowNo}: duplicate email in file`);
          seen.add(email);
        }
      });
      return { rows, issues, valid: rows.length - new Set(issues.map(issue => issue.split(':')[0])).size };
    } catch (err) {
      return { rows: [], issues: [err.message], valid: 0 };
    }
  };

  const handleCsvFile = event => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => setBulkText(String(e.target.result || ''));
    reader.readAsText(file);
    event.target.value = '';
  };

  const downloadTemplate = () => {
    const blob = new Blob([sampleCsv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'employee_import_template.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleBulkImport = async event => {
    event.preventDefault();
    const preview = getBulkPreview();
    if (!preview.rows.length || preview.issues.length) {
      toast('Fix CSV validation issues before importing', 'error');
      return;
    }
    setBulkLoading(true);
    setBulkResults([]);
    try {
      const employeesToImport = parseEmployeesCsv(bulkText).map(row => (
        isSuperAdmin ? row : { ...row, companyId }
      ));
      const response = await bulkCreateEmployees({ employees: employeesToImport });
      setBulkResults(response.data.results || []);
      toast(`Imported ${response.data.created} employee(s), ${response.data.failed} failed`, response.data.failed ? 'error' : 'success');
      load();
    } catch (err) {
      toast(err.response?.data?.message || err.message || 'Bulk import failed', 'error');
      setBulkResults(err.response?.data?.results || []);
    } finally {
      setBulkLoading(false);
    }
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

  const bulkPreview = getBulkPreview();
  const createdCount = bulkResults.filter(result => result.success).length;
  const failedCount = bulkResults.filter(result => !result.success).length;
  const updateFormField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div style={{ background: '#f0f2f8', minHeight: '100vh' }}>
      <Navbar />
      <div style={S.container}>
        <div style={S.header}>
          <div><h2 style={S.title}>Employee Management</h2><p style={S.sub}>{employees.length} total employees</p></div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button style={{ ...S.btn, background: '#1565c0' }} onClick={() => { setBulkOpen(true); setBulkResults([]); }}>
              Import CSV
            </button>
            <button style={S.btn} onClick={() => { setForm(emptyEmp); setEditing(null); setShowForm(!showForm); }}>
              {showForm ? 'Cancel' : 'Add Employee'}
            </button>
          </div>
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
                  <EmployeeInput field="name" label="Full Name" value={form.name} onChange={updateFormField} required />
                  <EmployeeInput field="email" label="Email" type="email" value={form.email} onChange={updateFormField} required />
                  {!editing && (
                    <EmployeeInput field="password" label="Login Password (min 6 characters)" type="password" value={form.password} onChange={updateFormField} required minLength={6} autoComplete="new-password" />
                  )}
                  <EmployeeInput field="phone" label="Phone" value={form.phone} onChange={updateFormField} />
                  <EmployeeInput field="department" label="Department" value={form.department} onChange={updateFormField} required />
                  <EmployeeInput field="position" label="Position / Designation" value={form.position} onChange={updateFormField} required />
                  <div>
                    <label style={S.label}>Gender</label>
                    <select style={S.input} value={form.gender} onChange={event => setForm({ ...form, gender: event.target.value })}>
                      {['Male', 'Female', 'Other'].map(option => <option key={option}>{option}</option>)}
                    </select>
                  </div>
                  {isSuperAdmin && (
                    <div>
                      <label style={S.label}>Company *</label>
                      <select style={S.input} value={form.companyId} onChange={event => setForm({ ...form, companyId: event.target.value })} required>
                        <option value="">Select Company</option>
                        {companies.map(company => <option key={company._id} value={company._id}>{company.name}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              )}
              {tab === 'bank' && (
                <div style={S.grid3}>
                  <EmployeeInput field="bankAccount" label="Bank Account No." value={form.bankAccount} onChange={updateFormField} />
                  <EmployeeInput field="ifscCode" label="IFSC Code" value={form.ifscCode} onChange={updateFormField} />
                  <EmployeeInput field="panNumber" label="PAN Number" value={form.panNumber} onChange={updateFormField} />
                  <EmployeeInput field="pfNumber" label="PF Account Number" value={form.pfNumber} onChange={updateFormField} />
                </div>
              )}
              <div style={{ marginTop: '1rem' }}>
                <button style={S.btn} type="submit" disabled={loading}>{loading ? 'Saving...' : editing ? 'Update Employee' : 'Add Employee'}</button>
              </div>
            </form>
          </div>
        )}

        {bulkOpen && (
          <div style={S.overlay}>
            <div style={S.importModal}>
              <div style={S.importHeader}>
                <div>
                  <h3 style={S.importTitle}>Import employees</h3>
                  <p style={S.importSub}>Upload a CSV or paste rows from a spreadsheet. Required columns are name, email, password (login, min 6 characters), department, and position.</p>
                </div>
                <button type="button" style={S.iconBtn} onClick={() => setBulkOpen(false)}>X</button>
              </div>

              <div style={S.importStats}>
                <div style={S.importStat}><strong>{bulkPreview.rows.length}</strong><span>Rows detected</span></div>
                <div style={S.importStat}><strong>{Math.max(bulkPreview.rows.length - bulkPreview.issues.length, 0)}</strong><span>Ready to import</span></div>
                <div style={S.importStat}><strong>{bulkPreview.issues.length}</strong><span>Validation issues</span></div>
              </div>

              <div style={S.importActions}>
                <label style={S.fileDrop}>
                  <input type="file" accept=".csv,text/csv" onChange={handleCsvFile} style={{ display: 'none' }} />
                  <strong>Choose CSV file</strong>
                  <span>or paste CSV data below</span>
                </label>
                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <button type="button" style={{ ...S.secondaryBtn }} onClick={downloadTemplate}>Download template</button>
                  <button type="button" style={{ ...S.secondaryBtn }} onClick={() => { setBulkText(sampleCsv); setBulkResults([]); }}>Use sample</button>
                </div>
              </div>

              {isSuperAdmin && (
                <div style={S.notice}>
                  Super admin imports can include a companyId column. Company admins are scoped to their own company automatically.
                </div>
              )}

              <form onSubmit={handleBulkImport}>
                <label style={S.label}>CSV data</label>
                <textarea
                  style={S.importTextarea}
                  value={bulkText}
                  onChange={event => { setBulkText(event.target.value); setBulkResults([]); }}
                  spellCheck={false}
                />

                {bulkPreview.issues.length > 0 && (
                  <div style={S.errorPanel}>
                    <strong>Fix before import</strong>
                    {bulkPreview.issues.slice(0, 5).map(issue => <div key={issue}>{issue}</div>)}
                    {bulkPreview.issues.length > 5 && <div>{bulkPreview.issues.length - 5} more issue(s)</div>}
                  </div>
                )}

                {bulkResults.length > 0 && (
                  <div style={S.resultPanel}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                      <strong>Import results</strong>
                      <span>{createdCount} created, {failedCount} failed</span>
                    </div>
                    <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                      <table style={S.table}>
                        <thead>
                          <tr style={{ background: '#f1f5f9' }}>
                            {['Row', 'Email', 'Status', 'Message'].map(header => <th key={header} style={S.th}>{header}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {bulkResults.map(result => (
                            <tr key={result.row} style={{ borderBottom: '1px solid #eef2f7' }}>
                              <td style={S.td}>{result.row}</td>
                              <td style={S.td}>{result.email || '-'}</td>
                              <td style={S.td}><span style={result.success ? S.okBadge : S.badBadge}>{result.success ? 'Created' : 'Failed'}</span></td>
                              <td style={S.td}>{result.success ? result.name : result.message}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div style={S.importFooter}>
                  <div style={{ color: '#667085', fontSize: '0.8rem' }}>
                    Optional salary columns: basicSalary, hra, allowances, medicalAllowance, travelAllowance, deductions.
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button type="button" style={S.secondaryBtn} onClick={() => setBulkOpen(false)}>Cancel</button>
                    <button style={{ ...S.btn, background: '#1565c0' }} type="submit" disabled={bulkLoading || bulkPreview.issues.length > 0 || !bulkPreview.rows.length}>
                      {bulkLoading ? 'Importing...' : 'Import employees'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        <div style={{ ...S.card, display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', padding: '1rem 1.5rem' }}>
          <span style={{ fontWeight: '600', color: '#1a237e', fontSize: '0.85rem' }}>Filter:</span>
          <input style={{ ...S.input, minWidth: '220px' }} placeholder="Search name, code, email..." value={search} onChange={event => setSearch(event.target.value)} />
          {isSuperAdmin && (
            <select style={{ ...S.input, width: 'auto' }} value={filterCompany} onChange={event => setFilterCompany(event.target.value)}>
              <option value="">All Companies</option>
              {companies.map(company => <option key={company._id} value={company._id}>{company.name}</option>)}
            </select>
          )}
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
              {isSuperAdmin && label === 'Visible employees' && <div style={{ marginTop: '0.3rem', color: '#98a2b3', fontSize: '0.72rem' }}>{companySpread} companies in current view</div>}
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
                      <button type="button" style={{ ...S.editBtn, background: '#f3e5f5', color: '#6a1b9a' }} onClick={() => { setPwModal(employee); setNewPassword(''); }}>Password</button>
                      <button type="button" style={S.delBtn} onClick={() => handleDelete(employee._id)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {!filtered.length && <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: '#aaa' }}>No employees found.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {pwModal && (
          <div style={S.overlay}>
            <div style={S.modal}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div><h3 style={{ margin: 0, color: '#1a237e' }}>Set Login Password</h3><p style={{ margin: '0.2rem 0 0', color: '#666', fontSize: '0.82rem' }}>{pwModal.name} - {pwModal.employeeCode}</p></div>
                <button type="button" aria-label="Close" style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => setPwModal(null)}>✕</button>
              </div>
              <form onSubmit={handlePasswordReset}>
                <label style={S.label}>New password *</label>
                <input style={S.input} type="password" minLength={6} required autoComplete="new-password" placeholder="Minimum 6 characters" value={newPassword} onChange={event => setNewPassword(event.target.value)} />
                <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '0.6rem 0 0' }}>Share the new password with the employee. They can change it from their portal.</p>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                  <button type="submit" style={{ ...S.btn, flex: 1 }} disabled={loading}>{loading ? 'Saving...' : 'Update Password'}</button>
                  <button type="button" style={{ ...S.btn, background: '#666' }} onClick={() => setPwModal(null)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {salModal && (
          <div style={S.overlay}>
            <div style={S.modal}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div><h3 style={{ margin: 0, color: '#1a237e' }}>Salary Structure</h3><p style={{ margin: '0.2rem 0 0', color: '#666', fontSize: '0.82rem' }}>{salModal.name} - {salModal.employeeCode}</p></div>
                <button type="button" style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }} aria-label="Close" onClick={() => setSalModal(null)}>✕</button>
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
  container: { padding: '1.75rem 2rem 3rem', maxWidth: '1480px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.4rem', gap: '1rem' },
  title: { margin: 0, color: '#0f172a', fontSize: '1.75rem', letterSpacing: '-0.04em' },
  sub: { margin: '0.35rem 0 0', color: '#64748b', fontSize: '0.9rem' },
  card: { background: 'rgba(255,255,255,0.78)', borderRadius: '22px', padding: '1.35rem', boxShadow: '0 18px 50px rgba(15,23,42,0.08)', border: '1px solid rgba(255,255,255,0.72)', backdropFilter: 'blur(18px)', marginBottom: '1.25rem' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem' },
  label: { display: 'block', fontSize: '0.76rem', fontWeight: '750', color: '#334155', marginBottom: '0.32rem' },
  input: { width: '100%', padding: '0.72rem 0.85rem', border: '1.5px solid #dbe3ef', borderRadius: '12px', fontSize: '0.9rem', boxSizing: 'border-box', background: 'rgba(255,255,255,0.9)', outline: 'none' },
  btn: { padding: '0.72rem 1.15rem', background: 'linear-gradient(135deg, #4f46e5, #2563eb)', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: '750', boxShadow: '0 12px 28px rgba(37,99,235,0.18)' },
  tabBtn: { padding: '0.5rem 1rem', border: '1.5px solid #dbe3ef', borderRadius: '999px', cursor: 'pointer', background: 'rgba(255,255,255,0.74)', fontSize: '0.82rem', fontWeight: '700', color: '#475569' },
  tabActive: { background: '#2563eb', color: '#fff', borderColor: '#2563eb' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '0.78rem 0.85rem', textAlign: 'left', fontSize: '0.72rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#f8fafc' },
  td: { padding: '0.78rem 0.85rem', fontSize: '0.84rem', color: '#334155' },
  chip: { background: '#eef2ff', color: '#3730a3', padding: '0.22rem 0.48rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: '750' },
  editBtn: { padding: '0.34rem 0.6rem', background: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', marginRight: '0.3rem', fontSize: '0.78rem', fontWeight: '700' },
  delBtn: { padding: '0.34rem 0.6rem', background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: '8px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '700' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(8px)' },
  modal: { background: '#fff', padding: '2rem', borderRadius: '20px', width: '520px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 24px 70px rgba(15,23,42,0.25)' },
  importModal: { background: '#fff', borderRadius: '12px', width: '880px', maxWidth: 'calc(100vw - 40px)', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 70px rgba(15,23,42,0.28)' },
  importHeader: { display: 'flex', justifyContent: 'space-between', gap: '1rem', padding: '1.4rem 1.5rem', borderBottom: '1px solid #eef2f7' },
  importTitle: { margin: 0, color: '#0f172a', fontSize: '1.15rem', fontWeight: '700' },
  importSub: { margin: '0.3rem 0 0', color: '#667085', fontSize: '0.86rem', lineHeight: 1.45 },
  iconBtn: { width: '32px', height: '32px', border: '1px solid #e2e8f0', borderRadius: '7px', background: '#fff', cursor: 'pointer', color: '#475467', fontWeight: '700' },
  importStats: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', padding: '1rem 1.5rem 0' },
  importStat: { border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.85rem 1rem', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '0.15rem' },
  importActions: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem', flexWrap: 'wrap' },
  fileDrop: { minWidth: '260px', flex: 1, border: '1.5px dashed #94a3b8', borderRadius: '10px', padding: '1rem', background: '#f8fafc', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.2rem', color: '#334155' },
  secondaryBtn: { padding: '0.55rem 0.9rem', background: '#fff', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontSize: '0.84rem', fontWeight: '600' },
  notice: { margin: '0 1.5rem 1rem', background: '#fff7ed', color: '#9a3412', padding: '0.65rem 0.85rem', borderRadius: '8px', fontSize: '0.82rem' },
  importTextarea: { width: 'calc(100% - 3rem)', margin: '0.25rem 1.5rem 0', minHeight: '180px', padding: '0.75rem', border: '1.5px solid #d0d5dd', borderRadius: '8px', fontSize: '0.82rem', fontFamily: 'Consolas, monospace', lineHeight: 1.55, resize: 'vertical', boxSizing: 'border-box' },
  errorPanel: { margin: '1rem 1.5rem 0', padding: '0.75rem 0.9rem', background: '#fff1f2', border: '1px solid #fecdd3', color: '#be123c', borderRadius: '8px', fontSize: '0.82rem', lineHeight: 1.6 },
  resultPanel: { margin: '1rem 1.5rem 0', padding: '0.85rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.84rem' },
  importFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem 1.4rem', borderTop: '1px solid #eef2f7', marginTop: '1rem', flexWrap: 'wrap' },
  okBadge: { padding: '0.15rem 0.45rem', borderRadius: '4px', background: '#e8f5e9', color: '#2e7d32', fontSize: '0.72rem', fontWeight: '600' },
  badBadge: { padding: '0.15rem 0.45rem', borderRadius: '4px', background: '#ffebee', color: '#c62828', fontSize: '0.72rem', fontWeight: '600' },
  toast: { padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.88rem', fontWeight: '500' },
};
