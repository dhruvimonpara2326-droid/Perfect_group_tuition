import { useState, useEffect } from 'react';
import { createNotification, getNotifications, updateNotification, deleteNotification } from '../../services/api';
import { Send, CheckCircle, Bell, History, X, Plus, MessageSquare, Edit2, Trash2 } from 'lucide-react';

const STANDARDS = ['1','2','3','4','5','6','7','8','9','10','11 Commerce','12 Commerce'];

const ManageNotifications = () => {
  const [tab, setTab] = useState('send');
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'general',
    forRole: 'student',
    forStandard: ''
  });
  const [success, setSuccess] = useState('');
  const [sentNotifications, setSentNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState(null);

  useEffect(() => {
    if (tab === 'history') loadNotifications();
  }, [tab]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await getNotifications({});
      setSentNotifications(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createNotification(formData);
      setSuccess('Notification sent successfully!');
      setFormData({ title: '', message: '', type: 'general', forRole: 'student', forStandard: '' });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send notification');
    }
  };

  const handleEditClick = (n) => {
    setEditingId(n._id);
    setEditFormData({
      title: n.title,
      message: n.message,
      type: n.type || 'general',
      forRole: n.forRole || 'student',
      forStandard: n.forStandard || ''
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateNotification(editingId, editFormData);
      setSuccess('Notification updated successfully!');
      setEditingId(null);
      setEditFormData(null);
      loadNotifications();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update notification');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) return;
    try {
      await deleteNotification(id);
      setSuccess('Notification deleted successfully!');
      loadNotifications();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      alert('Failed to delete notification');
    }
  };

  const getTypeBadge = (type) => {
    const map = {
      general: { class: 'badge-blue', label: 'General' },
      fee_due: { class: 'badge-red', label: 'Fee Due' },
      result: { class: 'badge-green', label: 'Result' },
      timetable: { class: 'badge-purple', label: 'Timetable' },
      classwork: { class: 'badge-orange', label: 'Classwork' },
    };
    const info = map[type] || map.general;
    return <span className={`badge ${info.class}`}>{info.label}</span>;
  };

  const getTypeEmoji = (type) => {
    const map = { general: 'ðŸ“¢', fee_due: 'ðŸ’°', result: 'ðŸ“Š', timetable: 'ðŸ“…', classwork: 'ðŸ“š' };
    return map[type] || 'ðŸ“¢';
  };

  const templates = [
    { title: 'Exam Reminder', message: 'Important: Upcoming exams start next week. Please prepare well and check your timetable.', type: 'general' },
    { title: 'Fee Reminder', message: 'This is a reminder that your fee payment is pending. Please pay at the earliest to avoid late charges.', type: 'fee_due' },
    { title: 'Results Published', message: 'Results have been published. Please check your dashboard for detailed marks and performance report.', type: 'result' },
    { title: 'Timetable Updated', message: 'The timetable has been updated. Please check the timetable section for the latest schedule.', type: 'timetable' },
    { title: 'New Notes Uploaded', message: 'New classwork/lecture notes have been uploaded. Please download from the classwork section.', type: 'classwork' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Notifications</h1>
        <p>Send announcements and reminders to students and faculty</p>
      </div>

      <div className="tabs">
        <button className={`tab-btn ${tab === 'send' ? 'active' : ''}`} onClick={() => setTab('send')}>
          <Send size={15} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Send Notification
        </button>
        <button className={`tab-btn ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>
          <History size={15} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Sent History
        </button>
      </div>

      {success && <div className="alert alert-success"><CheckCircle size={18} /> {success}</div>}

      {tab === 'send' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
          {/* Main form */}
          <div className="card">
            <div className="card-header">
              <h3><MessageSquare size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Compose Notification</h3>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input className="form-input" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required placeholder="Notification title" />
                </div>
                <div className="form-group">
                  <label className="form-label">Message *</label>
                  <textarea className="form-textarea" value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} required placeholder="Type your notification message here..." rows={5}></textarea>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, textAlign: 'right' }}>
                    {formData.message.length} characters
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Type</label>
                    <select className="form-select" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                      <option value="general">ðŸ“¢ General</option>
                      <option value="fee_due">ðŸ’° Fee Due</option>
                      <option value="result">ðŸ“Š Result</option>
                      <option value="timetable">ðŸ“… Timetable Update</option>
                      <option value="classwork">ðŸ“š Classwork</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Send To</label>
                    <select className="form-select" value={formData.forRole} onChange={e => setFormData({...formData, forRole: e.target.value})}>
                      <option value="student">ðŸ‘¨ðŸŽ“ Students</option>
                      <option value="faculty">ðŸ‘¨ðŸ« Faculty</option>
                      <option value="all">ðŸ‘¥ All</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Standard (optional — leave empty for all)</label>
                  <select className="form-select" value={formData.forStandard} onChange={e => setFormData({...formData, forStandard: e.target.value})}>
                    <option value="">All Standards</option>
                    {STANDARDS.map(s => <option key={s} value={s}>Std {s}</option>)}
                  </select>
                </div>

                {/* Preview */}
                {formData.title && (
                  <div style={{
                    padding: 16, borderRadius: 10, background: '#f8fafc',
                    border: '1px solid #e2e8f0', marginBottom: 20
                  }}>
                    <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>Preview</div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 20 }}>{getTypeEmoji(formData.type)}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: '#1e293b' }}>{formData.title}</div>
                        <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{formData.message || 'Your message will appear here...'}</div>
                        <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
                          {getTypeBadge(formData.type)}
                          <span className="badge badge-gray">
                            To: {formData.forRole === 'all' ? 'Everyone' : formData.forRole === 'student' ? 'Students' : 'Faculty'}
                            {formData.forStandard ? ` • Std ${formData.forStandard}` : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                  <Send size={18} /> Send Notification
                </button>
              </form>
            </div>
          </div>

          {/* Quick templates */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ fontSize: 14 }}>⚡ Quick Templates</h3>
            </div>
            <div className="card-body" style={{ padding: 12 }}>
              {templates.map((t, i) => (
                <button
                  key={i}
                  onClick={() => setFormData({ ...formData, title: t.title, message: t.message, type: t.type })}
                  style={{
                    width: '100%', textAlign: 'left', padding: '10px 14px',
                    borderRadius: 8, border: '1px solid #e2e8f0', background: 'white',
                    cursor: 'pointer', marginBottom: 8, transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.background = '#eff6ff'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = 'white'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span>{getTypeEmoji(t.type)}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{t.title}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.4, paddingLeft: 28 }}>
                    {t.message.slice(0, 60)}...
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'history' && (
        <>
          {loading ? (
            <div className="loading-container"><div className="spinner"></div></div>
          ) : sentNotifications.length === 0 ? (
            <div className="empty-state">
              <Bell size={48} />
              <h3>No notifications sent yet</h3>
              <p>Switch to the "Send" tab to create your first notification</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {sentNotifications.map((n, i) => (
                <div key={n._id || i} className="card" style={{ transition: 'box-shadow 0.2s ease' }}>
                  <div className="card-body" style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', gap: 12, flex: 1 }}>
                        <span style={{ fontSize: 24 }}>{getTypeEmoji(n.type)}</span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b', marginBottom: 4 }}>{n.title}</div>
                          <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, marginBottom: 8 }}>{n.message}</div>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {getTypeBadge(n.type)}
                            {n.forRole && <span className="badge badge-gray">To: {n.forRole}</span>}
                            {n.forStandard && <span className="badge badge-purple">Std {n.forStandard}</span>}
                            {n.isRead !== undefined && (
                              <span className={`badge ${n.isRead ? 'badge-green' : 'badge-orange'}`}>
                                {n.isRead ? 'Read' : 'Unread'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                        {n.createdAt ? new Date(n.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        }) : '—'}
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => handleEditClick(n)} title="Edit">
                            <Edit2 size={14} />
                          </button>
                          <button className="btn btn-secondary btn-sm" onClick={() => handleDelete(n._id)} style={{ color: '#ef4444' }} title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      {/* Edit Notification Modal */}
      {editingId && editFormData && (
        <div className="modal-overlay" onClick={() => setEditingId(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h3><Edit2 size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Edit Notification</h3>
              <button className="modal-close" onClick={() => setEditingId(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleUpdate} id="edit-notification-form">
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input className="form-input" value={editFormData.title} onChange={e => setEditFormData({...editFormData, title: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Message *</label>
                  <textarea className="form-textarea" value={editFormData.message} onChange={e => setEditFormData({...editFormData, message: e.target.value})} required rows={5}></textarea>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Type</label>
                    <select className="form-select" value={editFormData.type} onChange={e => setEditFormData({...editFormData, type: e.target.value})}>
                      <option value="general">ðŸ“¢ General</option>
                      <option value="fee_due">ðŸ’° Fee Due</option>
                      <option value="result">ðŸ“Š Result</option>
                      <option value="timetable">ðŸ“… Timetable Update</option>
                      <option value="classwork">ðŸ“š Classwork</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Send To</label>
                    <select className="form-select" value={editFormData.forRole} onChange={e => setEditFormData({...editFormData, forRole: e.target.value})}>
                      <option value="student">ðŸ‘¨ðŸŽ“ Students</option>
                      <option value="faculty">ðŸ‘¨ðŸ« Faculty</option>
                      <option value="all">ðŸ‘¥ All</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Standard (optional)</label>
                  <select className="form-select" value={editFormData.forStandard} onChange={e => setEditFormData({...editFormData, forStandard: e.target.value})}>
                    <option value="">All Standards</option>
                    {STANDARDS.map(s => <option key={s} value={s}>Std {s}</option>)}
                  </select>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setEditingId(null)}>Cancel</button>
              <button type="submit" form="edit-notification-form" className="btn btn-primary">Update Notification</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageNotifications;


