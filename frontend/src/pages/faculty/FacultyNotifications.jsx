import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getNotifications, markNotificationRead } from '../../services/api';
import { Bell, CheckCircle } from 'lucide-react';

const FacultyNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadNotifications(); }, []);

  const loadNotifications = async () => {
    try {
      const res = await getNotifications({ userId: user._id, role: 'faculty' });
      setNotifications(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) { console.error(err); }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'fee_due': return 'badge-red';
      case 'result': return 'badge-green';
      case 'timetable': return 'badge-blue';
      case 'classwork': return 'badge-purple';
      default: return 'badge-gray';
    }
  };

  const getTypeEmoji = (type) => {
    const map = { general: '📢', fee_due: '💰', result: '📊', timetable: '📅', classwork: '📚' };
    return map[type] || '📢';
  };

  const formatDate = (d) => {
    if (!d) return '—';
    const dt = new Date(d);
    return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}, ${dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
  };

  if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-actions">
          <div>
            <h1>🔔 Notifications</h1>
            <p>Stay updated with important announcements • {notifications.length} notifications{unreadCount > 0 ? ` • ${unreadCount} unread` : ''}</p>
          </div>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state">
          <Bell size={48} />
          <h3>No notifications</h3>
          <p>You're all caught up!</p>
        </div>
      ) : (
        <div style={{ maxWidth: 700 }}>
          {notifications.map(n => (
            <div key={n._id} className="card" style={{
              marginBottom: 12,
              borderLeft: !n.isRead ? '4px solid #2563eb' : '4px solid transparent',
              transition: 'all 0.15s ease'
            }}>
              <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ display: 'flex', gap: 12, flex: 1 }}>
                  <span style={{ fontSize: 24 }}>{getTypeEmoji(n.type)}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>{n.title}</span>
                      <span className={`badge ${getTypeColor(n.type)}`}>{(n.type || 'general').replace('_', ' ')}</span>
                      {!n.isRead && <span className="badge badge-blue" style={{ fontSize: 10 }}>NEW</span>}
                    </div>
                    <p style={{ fontSize: 14, color: '#475569', marginBottom: 6, lineHeight: 1.5 }}>{n.message}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>{formatDate(n.createdAt)}</span>
                      {n.forRole && (
                        <span className="badge badge-gray" style={{ fontSize: 10 }}>
                          To: {n.forRole === 'all' ? 'Everyone' : n.forRole}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {!n.isRead && (
                  <button className="btn btn-secondary btn-sm" onClick={() => handleMarkRead(n._id)} style={{ whiteSpace: 'nowrap' }}>
                    <CheckCircle size={14} /> Mark Read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FacultyNotifications;
