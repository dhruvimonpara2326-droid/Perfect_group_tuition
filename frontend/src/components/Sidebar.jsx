import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../utils/translations';
import {
  LayoutDashboard, ClipboardCheck, Award, IndianRupee,
  Calendar, BookOpen, UserCheck, Clock,
  FileText, BarChart3, Bell
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const location = useLocation();

  const facultyLinks = [
    { label: 'Dashboard',         path: '/faculty',              icon: <LayoutDashboard size={18} /> },
    { label: 'My Schedule',       path: '/faculty/schedule',     icon: <Calendar size={18} /> },
    { label: 'Student Marks',     path: '/faculty/marks',        icon: <Award size={18} /> },
    { label: 'Student Attendance',path: '/faculty/attendance',   icon: <ClipboardCheck size={18} /> },
    { label: 'My Attendance',     path: '/faculty/my-attendance',icon: <UserCheck size={18} /> },
    { label: 'Test Timetable',    path: '/faculty/test-timetable',icon: <Clock size={18} /> },
    { label: 'Classwork',         path: '/faculty/classwork',    icon: <BookOpen size={18} /> },
    { label: 'Performance',       path: '/faculty/performance',  icon: <BarChart3 size={18} /> },
    { label: 'Notifications',     path: '/faculty/notifications',icon: <Bell size={18} /> },
  ];

  const studentLinks = [
    { label: t(language, 'Dashboard'),        path: '/student',                icon: <LayoutDashboard size={18} /> },
    { label: t(language, 'MyMarks'),          path: '/student/marks',          icon: <Award size={18} /> },
    { label: t(language, 'MyAttendance'),     path: '/student/attendance',     icon: <ClipboardCheck size={18} /> },
    { label: t(language, 'FeeStatus'),        path: '/student/fees',           icon: <IndianRupee size={18} /> },
    { label: t(language, 'LectureTimetable'),path: '/student/timetable',       icon: <Calendar size={18} /> },
    { label: t(language, 'TestTimetable'),    path: '/student/test-timetable', icon: <Clock size={18} /> },
    { label: t(language, 'Classwork'),        path: '/student/classwork',      icon: <BookOpen size={18} /> },
    { label: t(language, 'Notifications'),    path: '/student/notifications',  icon: <Bell size={18} /> },
  ];

  const links = user?.role === 'faculty' ? facultyLinks : studentLinks;
  const roleLabel = user?.role === 'faculty' ? 'Faculty Panel' : t(language, 'StudentPanel');

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 150, display: 'none'
      }} />}
      <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon"><img src="/pgt-logo.svg" alt="PGT" style={{ width: 40, height: 40, borderRadius: '50%' }} /></div>
          <div className="sidebar-brand-text">
            <h2 style={{ whiteSpace: 'nowrap', fontSize: '17px', fontWeight: 'bold' }}>Perfect Group Tuition</h2>
            <p style={{ fontStyle: 'italic', fontFamily: 'cursive' }}>"The name is enough"</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">{roleLabel}</div>
          {links.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.path === '/faculty' || link.path === '/student'}
              className={({ isActive: active }) => `sidebar-link ${active ? 'active' : ''}`}
              onClick={onClose}
            >
              {link.icon}
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>
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
