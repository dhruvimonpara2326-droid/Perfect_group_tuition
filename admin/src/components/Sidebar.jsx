import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, ClipboardCheck, Award, IndianRupee,
  Calendar, BookOpen, GraduationCap, Clock,
  Bell, Layers, LogOut
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logoutUser } = useAuth();
  const location = useLocation();

  const adminLinks = [
    { label: 'Dashboard',        path: '/admin',                icon: <LayoutDashboard size={18} /> },
    { label: 'Manage Students',  path: '/admin/students',       icon: <GraduationCap size={18} /> },
    { label: 'Manage Faculty',   path: '/admin/faculty',        icon: <Users size={18} /> },
    { label: 'Manage Batches',   path: '/admin/batches',        icon: <Layers size={18} /> },
    { label: 'Attendance',       path: '/admin/attendance',     icon: <ClipboardCheck size={18} /> },
    { label: 'Marks',            path: '/admin/marks',          icon: <Award size={18} /> },
    { label: 'Fees',             path: '/admin/fees',           icon: <IndianRupee size={18} /> },
    { label: 'Lecture Timetable',path: '/admin/timetable',      icon: <Calendar size={18} /> },
    { label: 'Test Timetable',   path: '/admin/test-timetable', icon: <Clock size={18} /> },
    { label: 'Classwork',        path: '/admin/classwork',      icon: <BookOpen size={18} /> },
    { label: 'Notifications',    path: '/admin/notifications',  icon: <Bell size={18} /> },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 150 }}
        />
      )}

      <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <img src="/pgt-logo.svg" alt="PGT" style={{ width: 40, height: 40, borderRadius: '50%' }} />
          </div>
          <div className="sidebar-brand-text">
            <h2 style={{ whiteSpace: 'nowrap', fontSize: '17px', fontWeight: 'bold' }}>Perfect Group Tuition</h2>
            <p style={{ fontStyle: 'italic', fontFamily: 'cursive' }}>"The name is enough"</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Admin Panel</div>
          {adminLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.path === '/admin'}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              {link.icon}
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer: user info + logout */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          marginTop: 'auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, color: 'white', flexShrink: 0
            }}>
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name || 'Administrator'}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Admin</div>
            </div>
          </div>
          <button
            onClick={logoutUser}
            style={{
              width: '100%', padding: '8px 12px',
              background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.25)',
              borderRadius: 8, color: '#fca5a5', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.25)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.15)'; }}
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </aside>

      <style>{`
        @media (max-width: 768px) {
          .sidebar-overlay { display: block !important; }
        }
      `}</style>
    </>
  );
};

export default Sidebar;
