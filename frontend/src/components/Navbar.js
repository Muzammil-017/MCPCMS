import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ChangePasswordModal from './ChangePasswordModal';
import ProfileModal from './ProfileModal';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: 'DB' },
  { to: '/companies', label: 'Companies', icon: 'CO' },
  { to: '/employees', label: 'Employees', icon: 'EM' },
  { to: '/attendance', label: 'Attendance', icon: 'AT' },
  { to: '/leaves', label: 'Leaves', icon: 'LV' },
  { to: '/requests', label: 'Requests', icon: 'RQ' },
  { to: '/reimbursements', label: 'Claims', icon: 'CL' },
  { to: '/payroll', label: 'Payroll', icon: 'PY' },
  { to: '/compliance', label: 'Compliance', icon: 'CP' },
  { to: '/analytics', label: 'Analytics', icon: 'AN' },
  { to: '/reports', label: 'Reports', icon: 'RP' },
  { to: '/team', label: 'Team', icon: 'TM', adminOnly: true },
];

export default function Navbar() {
  const { user, logout, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [profileEditOpen, setProfileEditOpen] = useState(false);

  const visibleItems = isSuperAdmin
    ? NAV_ITEMS.filter(item => item.to === '/companies')
    : NAV_ITEMS.filter(item => item.to !== '/companies' && (!item.adminOnly || user?.role === 'Admin'));
  const initials = user?.name
    ? user.name.split(' ').map(part => part[0]).join('').toUpperCase().slice(0, 2)
    : 'AD';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .admin-nav {
          position: sticky;
          top: 0;
          z-index: 1000;
          background: rgba(15, 18, 32, 0.82);
          border-bottom: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(18px);
          font-family: Inter, system-ui, sans-serif;
        }
        .admin-nav-inner {
          height: 64px;
          display: flex;
          align-items: center;
          gap: 18px;
          padding: 0 24px;
          max-width: 100%;
          margin: 0 auto;
        }
        .admin-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          color: #fff;
          flex-shrink: 0;
        }
        .admin-brand-mark {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #7c3aed, #2563eb);
          box-shadow: 0 12px 26px rgba(37,99,235,0.3);
          font-size: 12px;
          font-weight: 800;
        }
        .admin-brand-name {
          font-size: 14px;
          font-weight: 800;
          letter-spacing: -0.01em;
        }
        .admin-nav-links {
          display: flex;
          align-items: center;
          gap: 4px;
          flex: 1;
          overflow-x: auto;
          scrollbar-width: none;
          white-space: nowrap;
        }
        .admin-nav-links::-webkit-scrollbar { display: none; }
        .admin-nav-link {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 7px 8px;
          border-radius: 10px;
          color: #9ca3af;
          font-size: 13px;
          font-weight: 650;
          text-decoration: none;
          white-space: nowrap;
          transition: background 0.18s ease, color 0.18s ease, transform 0.18s ease;
        }
        .admin-nav-link:hover {
          color: #fff;
          background: rgba(255,255,255,0.08);
          transform: translateY(-1px);
          text-decoration: none;
        }
        .admin-nav-link.active {
          color: #fff;
          background: rgba(99,102,241,0.2);
          box-shadow: inset 0 0 0 1px rgba(129,140,248,0.18);
        }
        .admin-nav-icon {
          width: 22px;
          height: 22px;
          border-radius: 7px;
          display: grid;
          place-items: center;
          background: rgba(255,255,255,0.07);
          font-size: 9px;
          font-weight: 800;
        }
        .admin-nav-right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }
        .admin-role {
          padding: 5px 11px;
          border-radius: 999px;
          color: #c7d2fe;
          background: rgba(99,102,241,0.16);
          border: 1px solid rgba(129,140,248,0.22);
          font-size: 11px;
          font-weight: 750;
        }
        .admin-user-wrap { position: relative; }
        .admin-user-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 8px 6px 6px;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          background: rgba(255,255,255,0.06);
          color: #f8fafc;
          cursor: pointer;
          transition: background 0.18s ease, border-color 0.18s ease;
        }
        .admin-user-button:hover {
          background: rgba(255,255,255,0.1);
          border-color: rgba(255,255,255,0.14);
        }
        .admin-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #8b5cf6, #2563eb);
          font-size: 12px;
          font-weight: 800;
        }
        .admin-user-name {
          max-width: 100px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 13px;
          font-weight: 700;
        }
        .admin-profile-menu {
          position: absolute;
          right: 0;
          top: calc(100% + 10px);
          width: 236px;
          padding: 10px;
          border-radius: 16px;
          background: rgba(21, 24, 38, 0.96);
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 24px 70px rgba(0,0,0,0.35);
          backdrop-filter: blur(16px);
          animation: adminDrop 0.16s ease both;
        }
        @keyframes adminDrop {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .admin-profile-label {
          color: #64748b;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .admin-profile-name {
          color: #f8fafc;
          font-size: 14px;
          font-weight: 800;
          margin-top: 6px;
        }
        .admin-profile-email {
          color: #94a3b8;
          font-size: 12px;
          margin-top: 2px;
          word-break: break-all;
        }
        .admin-menu-sep {
          height: 1px;
          background: rgba(255,255,255,0.08);
          margin: 10px 0;
        }
        .admin-menu-item {
          width: 100%;
          border: none;
          border-radius: 10px;
          background: rgba(255,255,255,0.06);
          color: #e2e8f0;
          padding: 10px 12px;
          cursor: pointer;
          font-weight: 650;
          text-align: left;
          margin-bottom: 6px;
        }
        .admin-menu-item:hover { background: rgba(255,255,255,0.12); }
        .admin-signout {
          width: 100%;
          border: none;
          border-radius: 10px;
          background: rgba(248,113,113,0.1);
          color: #fca5a5;
          padding: 10px 12px;
          cursor: pointer;
          font-weight: 750;
          text-align: left;
        }
        .admin-mobile-toggle {
          display: none;
          width: 38px;
          height: 38px;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          background: rgba(255,255,255,0.06);
          color: #fff;
          cursor: pointer;
        }
        .admin-mobile-menu {
          display: none;
          padding: 10px 16px 16px;
          background: rgba(15,18,32,0.98);
          border-top: 1px solid rgba(255,255,255,0.08);
        }
        .admin-mobile-menu.open { display: grid; gap: 6px; }
        .admin-mobile-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 12px;
          border-radius: 12px;
          color: #cbd5e1;
          text-decoration: none;
          font-weight: 700;
          font-size: 14px;
        }
        .admin-mobile-link.active { background: rgba(99,102,241,0.2); color: #fff; }
        @media (max-width: 1100px) {
          .admin-nav-links { display: none; }
          .admin-mobile-toggle { display: grid; place-items: center; }
          .admin-nav-inner { padding: 0 16px; }
          .admin-user-name { display: none; }
        }
      `}</style>

      <nav className="admin-nav">
        <div className="admin-nav-inner">
          <a href={isSuperAdmin ? '/companies' : '/dashboard'} className="admin-brand">
            <span className="admin-brand-mark">MC</span>
            <span className="admin-brand-name">MCPCMS</span>
          </a>

          <div className="admin-nav-links">
            {visibleItems.map(item => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}>
                <span className="admin-nav-icon">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="admin-nav-right">
           
            <div className="admin-user-wrap">
              <button type="button" className="admin-user-button" onClick={() => setProfileOpen(open => !open)}>
                <span className="admin-avatar">{initials}</span>
                <span className="admin-user-name">{user?.name || 'Admin'}</span>
                <span aria-hidden="true" style={{ color: '#94a3b8', fontSize: 10 }}>{profileOpen ? '▲' : '▼'}</span>
              </button>

              {profileOpen && (
                <div className="admin-profile-menu" onClick={event => event.stopPropagation()}>
                  <div className="admin-profile-label">Signed in as</div>
                  <div className="admin-profile-name">{user?.name || 'Admin'}</div>
                  <div className="admin-profile-email">{user?.email}</div>
                  <div className="admin-profile-email" style={{ marginTop: 2 }}>{user?.role === 'SuperAdmin' || isSuperAdmin ? 'Super Admin' : user?.role}</div>
                  <div className="admin-menu-sep" />
                  <button type="button" className="admin-menu-item" onClick={() => { setProfileEditOpen(true); setProfileOpen(false); }}>My profile</button>
                  <button type="button" className="admin-menu-item" onClick={() => { setPasswordOpen(true); setProfileOpen(false); }}>Change password</button>
                  <button className="admin-signout" onClick={handleLogout}>Sign out</button>
                </div>
              )}
            </div>

            <button type="button" className="admin-mobile-toggle" aria-label={mobileOpen ? 'Close menu' : 'Open menu'} onClick={() => setMobileOpen(open => !open)}>
              {mobileOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        <div className={`admin-mobile-menu${mobileOpen ? ' open' : ''}`}>
          {visibleItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `admin-mobile-link${isActive ? ' active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
      {passwordOpen && <ChangePasswordModal onClose={() => setPasswordOpen(false)} />}
      {profileEditOpen && <ProfileModal onClose={() => setProfileEditOpen(false)} />}
    </>
  );
}
