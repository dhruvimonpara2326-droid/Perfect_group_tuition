import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getNotifications, markNotificationRead } from '../services/api';
import { Bell, LogOut, Menu, Shield } from 'lucide-react';

const Header = ({ onToggleSidebar, pageTitle }) => {
  const { user, logoutUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    if (user) loadNotifications();
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
      const res = await getNotifications({});
      setNotifications(res.data.slice(0, 10));
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
    if (!name) return 'A';
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
          <div className="header-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Shield size={16} style={{ color: '#6366f1' }} />
            {pageTitle || 'Admin Panel'}
          </div>
          <div className="header-subtitle">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>

      <div className="header-right">
        {/* Notification Bell */}
        <div className="notification-bell" ref={notifRef}>
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}
          >
            <Bell size={20} color="#64748b" />
            {unreadCount > 0 && (
              <span className="notification-count">{unreadCount}</span>
            )}
          </button>

          {showNotifs && (
            <div className="notifications-dropdown">
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', fontWeight: 700, fontSize: '14px' }}>
                Notifications {unreadCount > 0 && <span style={{ color: '#6366f1' }}>({unreadCount} new)</span>}
              </div>
              {notifications.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                  No notifications
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

        {/* User Info */}
        <div className="header-user-info">
          <div className="header-user-avatar" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            {getInitials(user?.name)}
          </div>
          <div>
            <div className="header-user-name">{user?.name || 'Administrator'}</div>
            <div className="header-user-role" style={{ color: '#6366f1', fontWeight: 600 }}>Admin</div>
          </div>
        </div>

        <button className="logout-btn" onClick={logoutUser}>
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;
