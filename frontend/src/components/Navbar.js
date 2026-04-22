import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/companies', label: 'Companies' },
  { to: '/employees', label: 'Employees' },
  { to: '/attendance', label: 'Attendance' },
  { to: '/payroll', label: 'Payroll' },
  { to: '/compliance', label: 'Compliance' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/reports', label: 'Reports' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav style={S.nav}>
      <div style={S.brand}>MCPCMS</div>
      <div style={S.links}>
        {links.map(link => (
          <Link key={link.to} to={link.to} style={{ ...S.link, ...(pathname === link.to ? S.active : {}) }}>
            {link.label}
          </Link>
        ))}
      </div>
      <div style={S.user}>
        <span style={S.badge}>{user?.role}</span>
        <span style={{ fontSize: '0.85rem' }}>{user?.name}</span>
        <button style={S.logout} onClick={() => { logout(); navigate('/'); }}>Logout</button>
      </div>
    </nav>
  );
}

const S = {
  nav: { display: 'flex', alignItems: 'center', padding: '0 1.5rem', background: '#0d1b4b', color: '#fff', height: '56px', gap: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', position: 'sticky', top: 0, zIndex: 1000 },
  brand: { fontSize: '1.15rem', fontWeight: 'bold', color: '#9fb3ff', whiteSpace: 'nowrap', marginRight: '1rem' },
  links: { display: 'flex', gap: '0.15rem', flex: 1, flexWrap: 'nowrap', overflowX: 'auto' },
  link: { color: '#b0bec5', textDecoration: 'none', fontSize: '0.78rem', padding: '0.4rem 0.6rem', borderRadius: '6px', whiteSpace: 'nowrap', transition: 'all 0.2s' },
  active: { background: '#1a237e', color: '#fff' },
  user: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: 'auto' },
  badge: { background: '#7986cb', color: '#fff', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 'bold' },
  logout: { background: '#c62828', color: '#fff', border: 'none', padding: '0.35rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' },
};
