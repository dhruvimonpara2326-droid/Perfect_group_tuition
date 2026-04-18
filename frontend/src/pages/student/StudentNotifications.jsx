import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { t } from '../../utils/translations';
import { getNotifications, markNotificationRead } from '../../services/api';
import { Bell, CheckCircle } from 'lucide-react';

const StudentNotifications = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadNotifications(); }, []);

  const loadNotifications = async () => {
    try {
      const res = await getNotifications({ userId: user._id, role: user.role, standard: user.standard });
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

  if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <h1>{t(language, 'Notifications')}</h1>
        <p>{t(language, 'ImportantAnnouncements')}</p>
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state">
          <Bell size={48} />
          <h3>{t(language, 'NoNotifications')}</h3>
          <p>{t(language, 'CaughtUp')}</p>
        </div>
      ) : (
        <div style={{ maxWidth: 700 }}>
          {notifications.map(n => (
            <div key={n._id} className="card" style={{ marginBottom: 12, borderLeft: !n.isRead ? '4px solid #2563eb' : '4px solid transparent' }}>
              <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span className="notif-title" style={{ fontWeight: 700, fontSize: 15 }}>{n.title}</span>
                    <span className={`badge ${getTypeColor(n.type)}`}>{n.type.replace('_', ' ')}</span>
                  </div>
                  <p style={{ fontSize: 14, color: '#475569', marginBottom: 4 }}>{n.message}</p>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>{new Date(n.createdAt).toLocaleString()}</span>
                </div>
                {!n.isRead && (
                  <button className="btn btn-secondary btn-sm" onClick={() => handleMarkRead(n._id)}>
                    <CheckCircle size={14} /> {t(language, 'MarkRead')}
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

export default StudentNotifications;
