import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ChangePasswordModal from '../components/ChangePasswordModal';
import ProfileModal from '../components/ProfileModal';
import {
  applyEmployeeLeave,
  createEmployeeReimbursement,
  createEmployeeRequest,
  downloadEmployeePayslip,
  getEmployeeAttendance,
  getEmployeeLeaves,
  getEmployeeNotifications,
  getEmployeePayslips,
  getEmployeeProfile,
  getMyEmployeeRequests,
  getMyReimbursements,
  triggerDownload,
  updateEmployeeProfile,
} from '../services/api';

const tabs = [
  { id: 'profile', label: 'Profile', icon: 'ID' },
  { id: 'attendance', label: 'Attendance', icon: 'AT' },
  { id: 'payslips', label: 'Payslips', icon: 'PY' },
  { id: 'leave', label: 'Leave', icon: 'LV' },
  { id: 'requests', label: 'Requests', icon: 'RQ' },
  { id: 'reimbursements', label: 'Claims', icon: 'CL' },
  { id: 'notifications', label: 'Notifications', icon: 'NT' },
];

export default function EmployeeDashboard() {
  const { user, logout } = useAuth();
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [requests, setRequests] = useState([]);
  const [reimbursements, setReimbursements] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [profileForm, setProfileForm] = useState({ phone: '', bankAccount: '', ifscCode: '', panNumber: '' });
  const [leaveForm, setLeaveForm] = useState({ fromDate: '', toDate: '', type: 'Casual', reason: '' });
  const [requestForm, setRequestForm] = useState({ type: 'Attendance Correction', requestDate: new Date().toISOString().slice(0, 10), details: '' });
  const [reimbursementForm, setReimbursementForm] = useState({ category: 'Travel', amount: '', expenseDate: new Date().toISOString().slice(0, 10), description: '', bill: null });
  const [msg, setMsg] = useState({ text: '', type: 'success' });
  const [loading, setLoading] = useState(true);

  const toast = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '' }), 3500);
  };

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const [profileRes, attendanceRes, payslipRes, leaveRes, requestRes, reimbursementRes, notificationRes] = await Promise.allSettled([
      getEmployeeProfile(),
      getEmployeeAttendance(),
      getEmployeePayslips(),
      getEmployeeLeaves(),
      getMyEmployeeRequests(),
      getMyReimbursements(),
      getEmployeeNotifications(),
    ]);

    if (profileRes.status === 'fulfilled') {
      const employee = profileRes.value.data.employee;
      setProfile(employee);
      setProfileForm({
        phone: employee.phone || '',
        bankAccount: employee.bankAccount || '',
        ifscCode: employee.ifscCode || '',
        panNumber: employee.panNumber || '',
      });
    } else {
      setProfileForm({ phone: '', bankAccount: '', ifscCode: '', panNumber: '' });
    }

    if (attendanceRes.status === 'fulfilled') setAttendance(attendanceRes.value.data.attendance || []);
    if (payslipRes.status === 'fulfilled') setPayslips(payslipRes.value.data.payslips || []);
    if (leaveRes.status === 'fulfilled') setLeaves(leaveRes.value.data.leaves || []);
    if (requestRes.status === 'fulfilled') setRequests(requestRes.value.data.requests || []);
    if (reimbursementRes.status === 'fulfilled') setReimbursements(reimbursementRes.value.data.reimbursements || []);
    if (notificationRes.status === 'fulfilled') setNotifications(notificationRes.value.data.notifications || []);

    const failed = [profileRes, attendanceRes, payslipRes, leaveRes, requestRes, reimbursementRes, notificationRes].filter(result => result.status === 'rejected');
    if (failed.length) {
      const firstMessage = failed[0].reason?.response?.data?.message || 'Some employee data could not be loaded';
      toast(firstMessage, 'error');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/employee-login');
  };

  const handleProfileSave = async event => {
    event.preventDefault();
    try {
      const { data } = await updateEmployeeProfile(profileForm);
      setProfile(data.employee);
      toast('Profile updated');
    } catch (err) {
      toast(err.response?.data?.message || 'Profile update failed', 'error');
    }
  };

  const handleLeave = async event => {
    event.preventDefault();
    const today = new Date().toISOString().slice(0, 10);
    if (leaveForm.fromDate < today || leaveForm.toDate < today) {
      toast('Leave dates cannot be in the past', 'error');
      return;
    }
    if (leaveForm.fromDate > leaveForm.toDate) {
      toast('From date cannot be after to date', 'error');
      return;
    }
    try {
      await applyEmployeeLeave(leaveForm);
      setLeaveForm({ fromDate: '', toDate: '', type: 'Casual', reason: '' });
      const { data } = await getEmployeeLeaves();
      setLeaves(data.leaves || []);
      toast('Leave request submitted');
    } catch (err) {
      toast(err.response?.data?.message || 'Leave request failed', 'error');
    }
  };

  const handleDownload = async month => {
    try {
      const response = await downloadEmployeePayslip(month);
      triggerDownload(response.data, `Payslip_${month}.pdf`);
    } catch (err) {
      toast(err.response?.data?.message || 'Payslip download failed', 'error');
    }
  };

  const handleRequest = async event => {
    event.preventDefault();
    const today = new Date().toISOString().slice(0, 10);
    if (['Shift Change', 'Work From Home', 'Resignation'].includes(requestForm.type) && requestForm.requestDate < today) {
      toast('Request date cannot be in the past', 'error');
      return;
    }
    try {
      await createEmployeeRequest(requestForm);
      setRequestForm({ type: 'Attendance Correction', requestDate: today, details: '' });
      const { data } = await getMyEmployeeRequests();
      setRequests(data.requests || []);
      toast('Request submitted');
    } catch (err) {
      toast(err.response?.data?.message || 'Request failed', 'error');
    }
  };

  const handleReimbursement = async event => {
    event.preventDefault();
    if (Number(reimbursementForm.amount) <= 0) {
      toast('Amount must be greater than zero', 'error');
      return;
    }
    if (!reimbursementForm.bill) {
      toast('Bill file is required', 'error');
      return;
    }
    const formData = new FormData();
    formData.append('category', reimbursementForm.category);
    formData.append('amount', reimbursementForm.amount);
    formData.append('expenseDate', reimbursementForm.expenseDate);
    formData.append('description', reimbursementForm.description);
    formData.append('bill', reimbursementForm.bill);
    try {
      await createEmployeeReimbursement(formData);
      setReimbursementForm({ category: 'Travel', amount: '', expenseDate: new Date().toISOString().slice(0, 10), description: '', bill: null });
      const { data } = await getMyReimbursements();
      setReimbursements(data.reimbursements || []);
      toast('Reimbursement submitted');
    } catch (err) {
      toast(err.response?.data?.message || 'Reimbursement failed', 'error');
    }
  };

  const fmtMoney = value => `INR ${Number(value || 0).toLocaleString('en-IN')}`;
  const pendingLeaves = leaves.filter(item => item.status === 'Pending').length;
  const pendingRequests = requests.filter(item => item.status === 'Pending').length;
  const pendingClaims = reimbursements.filter(item => item.status === 'Pending').length;
  const latestPayslip = payslips[0];
  const displayEmployee = {
    name: profile?.name || user?.name,
    email: profile?.email || user?.email,
    employeeCode: profile?.employeeCode || user?.employeeCode,
    companyName: profile?.companyId?.name || user?.companyName,
    department: profile?.department,
    position: profile?.position,
    dateOfJoining: profile?.dateOfJoining,
  };

  if (loading) return <div style={S.loading}>Loading employee portal...</div>;

  return (
    <div style={S.page}>
      <aside style={S.sidebar}>
        <div>
          <div style={S.brandRow}>
            <div style={S.brandMark}>MC</div>
            <div>
              <div style={S.logo}>MCPCMS</div>
              <div style={S.company}>{user?.companyName || profile?.companyId?.name || 'Employee Portal'}</div>
            </div>
          </div>
          <div style={S.identity}>
            <div style={S.avatar}>{String(displayEmployee.name || 'E').slice(0, 2).toUpperCase()}</div>
            <div>
              <strong>{displayEmployee.name}</strong>
              <span>{displayEmployee.employeeCode || 'Employee'}</span>
            </div>
          </div>
          <nav style={S.nav}>
            {tabs.map(tab => (
              <button key={tab.id} style={{ ...S.navItem, ...(activeTab === tab.id ? S.navActive : {}) }} onClick={() => setActiveTab(tab.id)}>
                <span style={S.navIcon}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        <button type="button" style={S.passwordBtn} onClick={() => setAccountOpen(true)}>Login email</button>
        <button type="button" style={S.passwordBtn} onClick={() => setPasswordOpen(true)}>Change password</button>
        <button style={S.logoutBtn} onClick={handleLogout}>Logout</button>
        {passwordOpen && <ChangePasswordModal onClose={() => setPasswordOpen(false)} />}
        {accountOpen && <ProfileModal onClose={() => { setAccountOpen(false); load(); }} />}
      </aside>

      <main style={S.main}>
        <div style={S.header}>
          <div>
            <p style={S.kicker}>Employee Dashboard</p>
            <h1 style={S.heading}>{tabs.find(tab => tab.id === activeTab)?.label}</h1>
          </div>
          <div style={S.headerMeta}>
            <span style={S.roleBadge}>{displayEmployee.department || 'Employee'}</span>
            <button style={S.refreshBtn} onClick={load}>Refresh</button>
          </div>
        </div>

        {msg.text && <div style={{ ...S.toast, ...(msg.type === 'error' ? S.toastError : {}) }}>{msg.text}</div>}

        {activeTab === 'profile' && (
          <>
          <section style={S.summaryGrid}>
            <div style={S.summaryCard}><span>Attendance records</span><strong>{attendance.length}</strong></div>
            <div style={S.summaryCard}><span>Latest payslip</span><strong>{latestPayslip?.payrollMonth || '-'}</strong></div>
            <div style={S.summaryCard}><span>Pending leave</span><strong>{pendingLeaves}</strong></div>
            <div style={S.summaryCard}><span>Pending requests</span><strong>{pendingRequests + pendingClaims}</strong></div>
          </section>
          <section style={S.grid}>
            <div style={S.card}>
              <h2 style={S.cardTitle}>My Details</h2>
              {[
                ['Name', displayEmployee.name],
                ['Email', displayEmployee.email],
                ['Employee ID', displayEmployee.employeeCode],
                ['Company', displayEmployee.companyName],
                ['Department', displayEmployee.department],
                ['Position', displayEmployee.position],
                ['Joining Date', displayEmployee.dateOfJoining ? new Date(displayEmployee.dateOfJoining).toLocaleDateString('en-IN') : ''],
              ].map(([label, value]) => (
                <div key={label} style={S.row}><span>{label}</span><strong>{value || '-'}</strong></div>
              ))}
            </div>

            <form style={S.card} onSubmit={handleProfileSave}>
              <h2 style={S.cardTitle}>Update Profile</h2>
              {[
                ['phone', 'Phone'],
                ['bankAccount', 'Bank Account'],
                ['ifscCode', 'IFSC Code'],
                ['panNumber', 'PAN Number'],
              ].map(([field, label]) => (
                <label key={field} style={S.label}>{label}
                  <input style={S.input} value={profileForm[field]} onChange={e => setProfileForm({ ...profileForm, [field]: e.target.value })} />
                </label>
              ))}
              <button style={S.primaryBtn}>Save Changes</button>
            </form>
          </section>
          </>
        )}

        {activeTab === 'attendance' && (
          <section style={S.card}>
            <h2 style={S.cardTitle}>My Attendance</h2>
            {attendance.length === 0 ? <p style={S.empty}>No attendance records found.</p> : attendance.map(record => (
              <div key={record._id} style={S.row}>
                <span>{new Date(record.date).toLocaleDateString('en-IN')}</span>
                <strong style={{ ...S.status, ...(record.status === 'Present' || record.status === 'WFH' ? S.good : S.warn) }}>{record.status}</strong>
              </div>
            ))}
          </section>
        )}

        {activeTab === 'payslips' && (
          <section style={S.card}>
            <h2 style={S.cardTitle}>My Payslips</h2>
            {payslips.length === 0 ? <p style={S.empty}>No payslips found.</p> : payslips.map(item => (
              <div key={item._id} style={S.row}>
                <span>{item.payrollMonth}</span>
                <strong>{fmtMoney(item.netSalary)}</strong>
                <button style={S.smallBtn} onClick={() => handleDownload(item.payrollMonth)}>Download</button>
              </div>
            ))}
          </section>
        )}

        {activeTab === 'leave' && (
          <section style={S.grid}>
            <form style={S.card} onSubmit={handleLeave}>
              <h2 style={S.cardTitle}>Apply Leave</h2>
              <label style={S.label}>From Date
                <input style={S.input} type="date" min={new Date().toISOString().slice(0, 10)} value={leaveForm.fromDate} onChange={e => setLeaveForm({ ...leaveForm, fromDate: e.target.value })} required />
              </label>
              <label style={S.label}>To Date
                <input style={S.input} type="date" min={leaveForm.fromDate || new Date().toISOString().slice(0, 10)} value={leaveForm.toDate} onChange={e => setLeaveForm({ ...leaveForm, toDate: e.target.value })} required />
              </label>
              <label style={S.label}>Leave Type
                <select style={S.input} value={leaveForm.type} onChange={e => setLeaveForm({ ...leaveForm, type: e.target.value })}>
                  {['Casual', 'Sick', 'Earned', 'Unpaid'].map(type => <option key={type}>{type}</option>)}
                </select>
              </label>
              <label style={S.label}>Reason
                <textarea style={{ ...S.input, minHeight: '90px', resize: 'vertical' }} value={leaveForm.reason} onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })} required />
              </label>
              <button style={S.primaryBtn}>Submit Request</button>
            </form>

            <div style={S.card}>
              <h2 style={S.cardTitle}>Leave History</h2>
              {leaves.length === 0 ? <p style={S.empty}>No leave requests yet.</p> : leaves.map(leave => (
                <div key={leave._id} style={S.row}>
                  <span>{leave.fromDate} to {leave.toDate}</span>
                  <strong style={S.status}>{leave.status}</strong>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'requests' && (
          <section style={S.grid}>
            <form style={S.card} onSubmit={handleRequest}>
              <h2 style={S.cardTitle}>Submit Request</h2>
              <label style={S.label}>Request Type
                <select style={S.input} value={requestForm.type} onChange={e => setRequestForm({ ...requestForm, type: e.target.value })}>
                  {['Attendance Correction', 'Shift Change', 'Work From Home', 'Resignation'].map(type => <option key={type}>{type}</option>)}
                </select>
              </label>
              <label style={S.label}>Request Date
                <input style={S.input} type="date" value={requestForm.requestDate} onChange={e => setRequestForm({ ...requestForm, requestDate: e.target.value })} required />
              </label>
              <label style={S.label}>Details
                <textarea style={{ ...S.input, minHeight: '110px', resize: 'vertical' }} value={requestForm.details} onChange={e => setRequestForm({ ...requestForm, details: e.target.value })} required />
              </label>
              <button style={S.primaryBtn}>Submit Request</button>
            </form>

            <div style={S.card}>
              <h2 style={S.cardTitle}>Request History</h2>
              {requests.length === 0 ? <p style={S.empty}>No requests submitted.</p> : requests.map(item => (
                <div key={item._id} style={S.note}>
                  <strong>{item.type} - {item.status}</strong>
                  <span>{item.requestDate}</span>
                  <span>{item.details}</span>
                  {item.adminRemarks && <span>Admin: {item.adminRemarks}</span>}
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'reimbursements' && (
          <section style={S.grid}>
            <form style={S.card} onSubmit={handleReimbursement}>
              <h2 style={S.cardTitle}>Claim Reimbursement</h2>
              <label style={S.label}>Category
                <select style={S.input} value={reimbursementForm.category} onChange={e => setReimbursementForm({ ...reimbursementForm, category: e.target.value })}>
                  {['Travel', 'Food', 'Internet', 'Equipment'].map(type => <option key={type}>{type}</option>)}
                </select>
              </label>
              <label style={S.label}>Amount
                <input style={S.input} type="number" min="1" value={reimbursementForm.amount} onChange={e => setReimbursementForm({ ...reimbursementForm, amount: e.target.value })} required />
              </label>
              <label style={S.label}>Expense Date
                <input style={S.input} type="date" value={reimbursementForm.expenseDate} onChange={e => setReimbursementForm({ ...reimbursementForm, expenseDate: e.target.value })} required />
              </label>
              <label style={S.label}>Bill Upload
                <input style={S.input} type="file" accept="application/pdf,image/png,image/jpeg,image/webp" onChange={e => setReimbursementForm({ ...reimbursementForm, bill: e.target.files[0] })} required />
              </label>
              <label style={S.label}>Description
                <textarea style={{ ...S.input, minHeight: '90px', resize: 'vertical' }} value={reimbursementForm.description} onChange={e => setReimbursementForm({ ...reimbursementForm, description: e.target.value })} required />
              </label>
              <button style={S.primaryBtn}>Submit Claim</button>
            </form>

            <div style={S.card}>
              <h2 style={S.cardTitle}>Claim History</h2>
              {reimbursements.length === 0 ? <p style={S.empty}>No reimbursement claims submitted.</p> : reimbursements.map(item => (
                <div key={item._id} style={S.note}>
                  <strong>{item.category} - {item.status}</strong>
                  <span>{fmtMoney(item.amount)} on {item.expenseDate}</span>
                  <span>{item.description}</span>
                  {item.adminRemarks && <span>Admin: {item.adminRemarks}</span>}
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'notifications' && (
          <section style={S.card}>
            <h2 style={S.cardTitle}>Notifications</h2>
            {notifications.length === 0 ? <p style={S.empty}>No notifications available.</p> : notifications.map(note => (
              <div key={note._id} style={S.note}>
                <strong>{note.title}</strong>
                <span>{note.message}</span>
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

const S = {
  page: { display: 'flex', minHeight: '100vh', background: '#eef2f7', color: '#172033' },
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#0f172a', fontWeight: '700', background: '#eef2f7' },
  sidebar: { width: '280px', background: '#111827', color: '#fff', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box', borderRight: '1px solid rgba(255,255,255,0.08)' },
  brandRow: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' },
  brandMark: { width: '38px', height: '38px', borderRadius: '8px', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.8rem' },
  logo: { color: '#f8fafc', fontSize: '1rem', fontWeight: '800' },
  company: { color: '#94a3b8', fontSize: '0.78rem', marginTop: '0.15rem' },
  identity: { display: 'flex', alignItems: 'center', gap: '0.8rem', background: 'rgba(255,255,255,0.06)', padding: '0.9rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.08)' },
  avatar: { width: '42px', height: '42px', borderRadius: '50%', background: '#334155', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', flexShrink: 0 },
  nav: { display: 'flex', flexDirection: 'column', gap: '0.25rem' },
  navItem: { display: 'flex', alignItems: 'center', gap: '0.65rem', textAlign: 'left', padding: '0.72rem 0.75rem', borderRadius: '8px', border: 'none', background: 'transparent', color: '#cbd5e1', cursor: 'pointer', fontWeight: '650', fontSize: '0.9rem' },
  navIcon: { width: '28px', height: '24px', borderRadius: '6px', background: 'rgba(255,255,255,0.07)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.66rem', fontWeight: '800' },
  navActive: { background: '#2563eb', color: '#fff' },
  passwordBtn: { padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.08)', color: '#e2e8f0', cursor: 'pointer', fontWeight: '700', marginBottom: '0.5rem' },
  logoutBtn: { padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(248,113,113,0.35)', background: 'rgba(239,68,68,0.12)', color: '#fecaca', cursor: 'pointer', fontWeight: '700' },
  main: { flex: 1, padding: '1.6rem 2rem', minWidth: 0, maxWidth: '1280px', margin: '0 auto' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' },
  headerMeta: { display: 'flex', alignItems: 'center', gap: '0.7rem' },
  kicker: { margin: 0, color: '#475569', fontWeight: '700', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' },
  heading: { margin: '0.2rem 0 0', color: '#0f172a', fontSize: '1.75rem' },
  roleBadge: { color: '#1e40af', background: '#dbeafe', padding: '0.45rem 0.7rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: '700' },
  refreshBtn: { background: '#fff', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.48rem 0.75rem', cursor: 'pointer', fontWeight: '700' },
  toast: { background: '#dcfce7', color: '#166534', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontWeight: '600', border: '1px solid #bbf7d0' },
  toastError: { background: '#ffebee', color: '#c62828' },
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '0.9rem', marginBottom: '1rem' },
  summaryCard: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', boxShadow: '0 8px 24px rgba(15,23,42,0.05)', display: 'flex', flexDirection: 'column', gap: '0.35rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' },
  card: { background: '#fff', borderRadius: '8px', padding: '1.25rem', boxShadow: '0 8px 24px rgba(15,23,42,0.06)', border: '1px solid #e2e8f0' },
  cardTitle: { color: '#0f172a', margin: '0 0 1rem', fontSize: '1.05rem' },
  row: { display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '0.8rem', alignItems: 'center', padding: '0.78rem 0', borderBottom: '1px solid #eef2f7', color: '#475569' },
  label: { display: 'block', color: '#334155', fontSize: '0.84rem', fontWeight: '700', marginBottom: '0.75rem' },
  input: { width: '100%', boxSizing: 'border-box', padding: '0.72rem', marginTop: '0.3rem', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '0.92rem', background: '#fff' },
  primaryBtn: { background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.78rem 1rem', cursor: 'pointer', fontWeight: '700' },
  smallBtn: { background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.45rem 0.7rem', cursor: 'pointer', fontWeight: '700' },
  status: { background: '#e0e7ff', color: '#3730a3', borderRadius: '999px', padding: '0.35rem 0.6rem', fontSize: '0.8rem', fontWeight: '700' },
  good: { background: '#dcfce7', color: '#166534' },
  warn: { background: '#ffedd5', color: '#9a3412' },
  note: { display: 'flex', flexDirection: 'column', gap: '0.35rem', padding: '0.9rem 0', borderBottom: '1px solid #eef2f7', color: '#475569' },
  empty: { color: '#64748b', margin: 0, background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '8px', padding: '1rem' },
};
