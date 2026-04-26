import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function EmployeeDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'Employee') {
      navigate('/login');
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    const headers = { Authorization: `Bearer ${user.token}` };
    try {
      const [profileRes, attendanceRes, payslipsRes] = await Promise.all([
        fetch('http://localhost:5000/api/employee-portal/profile', { headers }),
        fetch('http://localhost:5000/api/employee-portal/attendance', { headers }),
        fetch('http://localhost:5000/api/employee-portal/payslips', { headers }),
      ]);
      const [p, a, ps] = await Promise.all([profileRes.json(), attendanceRes.json(), payslipsRes.json()]);
      if (p.success) setProfile(p.employee);
      if (a.success) setAttendance(a.attendance);
      if (ps.success) setPayslips(ps.payslips);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  if (loading) return <div style={S.loading}>Loading...</div>;

  return (
    <div style={S.page}>
      {/* Sidebar */}
      <div style={S.sidebar}>
        <h2 style={S.logo}>MCPCMS</h2>
        <p style={S.empName}>{user?.name}</p>
        <p style={S.empRole}>Employee Portal</p>
        <div style={S.nav}>
          {['profile', 'attendance', 'payslips'].map(tab => (
            <div key={tab} style={{ ...S.navItem, ...(activeTab === tab ? S.navActive : {}) }}
              onClick={() => setActiveTab(tab)}>
              {tab === 'profile' ? '👤' : tab === 'attendance' ? '📅' : '💰'} {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </div>
          ))}
        </div>
        <button style={S.logoutBtn} onClick={handleLogout}>Logout</button>
      </div>

      {/* Main Content */}
      <div style={S.main}>
        {activeTab === 'profile' && profile && (
          <div>
            <h2 style={S.heading}>My Profile</h2>
            <div style={S.card}>
              {[['Name', profile.name], ['Email', profile.email], ['Department', profile.department],
                ['Designation', profile.designation], ['Company', profile.companyId?.name],
                ['Phone', profile.phone]].map(([label, val]) => (
                <div key={label} style={S.row}>
                  <span style={S.rowLabel}>{label}</span>
                  <span style={S.rowVal}>{val || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div>
            <h2 style={S.heading}>My Attendance (Last 30 Days)</h2>
            <div style={S.card}>
              {attendance.length === 0 ? <p>No attendance records found.</p> :
                attendance.map((a, i) => (
                  <div key={i} style={S.row}>
                    <span style={S.rowLabel}>{new Date(a.date).toDateString()}</span>
                    <span style={{
                      ...S.badge,
                      background: a.status === 'Present' ? '#e8f5e9' : '#ffebee',
                      color: a.status === 'Present' ? '#2e7d32' : '#c62828'
                    }}>{a.status}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {activeTab === 'payslips' && (
          <div>
            <h2 style={S.heading}>My Payslips</h2>
            <div style={S.card}>
              {payslips.length === 0 ? <p>No payslips found.</p> :
                payslips.map((p, i) => (
                  <div key={i} style={S.row}>
                    <span style={S.rowLabel}>{p.month} {p.year}</span>
                    <span style={S.rowVal}>Net: ₹{p.netSalary?.toLocaleString()}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const S = {
  page: { display: 'flex', minHeight: '100vh', background: '#f5f6fa' },
  loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', fontSize: '1.2rem' },
  sidebar: { width: '220px', background: 'linear-gradient(135deg, #0d1b4b, #1a237e)', color: '#fff', padding: '2rem 1rem', display: 'flex', flexDirection: 'column' },
  logo: { color: '#7986cb', fontSize: '1.4rem', margin: '0 0 0.5rem' },
  empName: { fontWeight: 'bold', margin: 0, fontSize: '0.95rem' },
  empRole: { color: '#9fa8da', fontSize: '0.8rem', margin: '0.2rem 0 2rem' },
  nav: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  navItem: { padding: '0.7rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', color: '#c5cae9', textTransform: 'capitalize' },
  navActive: { background: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: '600' },
  logoutBtn: { marginTop: 'auto', padding: '0.7rem', background: '#c62828', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  main: { flex: 1, padding: '2rem' },
  heading: { color: '#1a237e', marginBottom: '1rem' },
  card: { background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.7rem 0', borderBottom: '1px solid #f0f0f0' },
  rowLabel: { color: '#666', fontSize: '0.9rem' },
  rowVal: { fontWeight: '600', color: '#1a237e' },
  badge: { padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600' },
};