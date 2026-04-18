import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../utils/translations';
import { getNotifications, markNotificationRead } from '../services/api';
import { Bell, LogOut, Menu, Globe } from 'lucide-react';

const Header = ({ onToggleSidebar, pageTitle }) => {
  const { user, logoutUser } = useAuth();
  const { language, switchLanguage } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await getNotifications({ userId: user._id });
      setNotifications(res.data);
    } catch {
      // Silently fail
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
    } catch {
      // Silently fail
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <button className="hamburger-btn" onClick={onToggleSidebar}>
          <Menu size={20} />
        </button>
        <div>
          <div className="header-title">{t(language, pageTitle) || t(language, 'Dashboard')}</div>
          <div className="header-subtitle">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>

      <div className="header-right">
        {user?.role === 'student' && (
          <div className="language-selector" style={{ marginRight: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Globe size={16} color="#64748b" />
            <select 
              value={language} 
              onChange={(e) => switchLanguage(e.target.value)}
              style={{
                padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e8f0', 
                background: '#f8fafc', color: '#334155', fontSize: 13, cursor: 'pointer', outline: 'none'
              }}
            >
              <option value="en">English</option>
              <option value="gu">ગુજરાતી (Gujarati)</option>
            </select>
          </div>
        )}
        {user?.role === 'student' && (
          <div className="notification-bell" ref={notifRef}>
            <button onClick={() => setShowNotifs(!showNotifs)} style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}>
              <Bell size={20} color="#64748b" />
              {unreadCount > 0 && (
                <span className="notification-count">{unreadCount}</span>
              )}
            </button>

            {showNotifs && (
              <div className="notifications-dropdown">
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', fontWeight: 700, fontSize: '14px' }}>
                  {t(language, 'Notifications')}
                </div>
                {notifications.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                    {t(language, 'NoNotifications')}
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n._id}
                      className={`notif-item ${!n.isRead ? 'unread' : ''}`}
                      onClick={() => handleMarkRead(n._id)}
                    >
                      <div className="notif-title">{n.title}</div>
                      <div className="notif-msg">{n.message}</div>
                      <div className="notif-time">{formatTime(n.createdAt)}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        <div className="header-user-info">
          <div className="header-user-avatar">{getInitials(user?.name)}</div>
          <div>
            <div className="header-user-name">{user?.name}</div>
            <div className="header-user-role">{user?.role}</div>
          </div>
        </div>

        <button className="logout-btn" onClick={logoutUser}>
          <LogOut size={16} />
          {t(language, 'Logout')}
        </button>
      </div>
    </header>
  );
};

export default Header;
