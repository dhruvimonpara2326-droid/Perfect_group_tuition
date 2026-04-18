import { useState, useEffect } from 'react';
import { getFaculty, createFaculty, deleteUser, updateUser } from '../../services/api';
import { Plus, Edit2, Trash2, X, Search, Download, Eye, Phone, BookOpen, Users, CheckCircle } from 'lucide-react';

const ManageFaculty = () => {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [viewModal, setViewModal] = useState(null);
  const [addData, setAddData] = useState({ username: '', password: '', name: '', email: '', mobile: '', subject: '' });
  const [editData, setEditData] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { loadFaculty(); }, []);

  const loadFaculty = async () => {
    try {
      const res = await getFaculty();
      setFaculty(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createFaculty(addData);
      setShowAdd(false);
      setAddData({ username: '', password: '', name: '', email: '', mobile: '', subject: '' });
      setSuccess('Faculty member created successfully! Credentials emailed.');
      setTimeout(() => setSuccess(''), 3000);
      loadFaculty();
    } catch (err) { setError(err.response?.data?.message || 'Failed to create faculty'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this faculty member? This action cannot be undone.')) return;
    try {
      await deleteUser(id);
      setFaculty(prev => prev.filter(f => f._id !== id));
      setSuccess('Faculty member deleted');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { alert('Delete failed'); }
  };

  const handleEdit = (f) => {
    setEditData({ name: f.name, mobile: f.mobile, subject: f.subject });
    setEditModal(f);
  };

  const handleSaveEdit = async () => {
    try {
      await updateUser(editModal._id, editData);
      setEditModal(null);
      setSuccess('Faculty updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
      loadFaculty();
    } catch (err) { alert('Update failed'); }
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Username', 'Mobile', 'Subject'];
    const rows = filtered.map(f => [f.name, f.username, f.mobile || '', f.subject || '']);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `faculty_list_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = faculty.filter(f =>
    f.name?.toLowerCase().includes(search.toLowerCase()) ||
    f.username?.toLowerCase().includes(search.toLowerCase()) ||
    (f.subject && f.subject.toLowerCase().includes(search.toLowerCase())) ||
    (f.mobile && f.mobile.includes(search))
  );

  return (
    <div>
      <div className="page-header">
        <div className="page-header-actions">
          <div>
            <h1>Manage Faculty</h1>
            <p>Add and manage faculty members ({filtered.length} faculty)</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={handleExportCSV} disabled={filtered.length === 0}>
              <Download size={16} /> Export
            </button>
            <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
              <Plus size={18} /> Add Faculty
            </button>
          </div>
        </div>
      </div>

      {success && <div className="alert alert-success"><CheckCircle size={18} /> {success}</div>}

      <div className="filters-bar">
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            className="form-input"
            placeholder="Search by name, username, subject or mobile..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 36 }}
          />
        </div>
        {search && (
          <button className="btn btn-secondary btn-sm" onClick={() => setSearch('')}>
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner"></div></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Users size={48} />
          <h3>No faculty found</h3>
          <p>{search ? 'Try a different search term' : 'Click "Add Faculty" to add your first faculty member'}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {filtered.map(f => (
            <div className="card" key={f._id} style={{ transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div className="card-body" style={{ padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 800, flexShrink: 0
                  }}>
                    {f.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b', marginBottom: 2 }}>{f.name}</div>
                    <span className="badge badge-blue" style={{ fontSize: 11 }}>{f.username}</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                  <div style={{ padding: '8px 12px', borderRadius: 8, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Subject</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <BookOpen size={12} /> {f.subject || '—'}
                    </div>
                  </div>
                  <div style={{ padding: '8px 12px', borderRadius: 8, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Mobile</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Phone size={12} /> {f.mobile || '—'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setViewModal(f)}><Eye size={14} /></button>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(f)}><Edit2 size={14} /></button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(f._id)}><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Modal */}
      {viewModal && (
        <div className="modal-overlay" onClick={() => setViewModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Faculty Details</h3>
              <button className="modal-close" onClick={() => setViewModal(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div style={{
                textAlign: 'center', marginBottom: 24, padding: 24,
                background: 'linear-gradient(135deg, #ede9fe, #e0e7ff)', borderRadius: 12
              }}>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%', margin: '0 auto 12px',
                  background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, fontWeight: 800
                }}>
                  {viewModal.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700 }}>{viewModal.name}</h3>
                <span className="badge badge-purple">Faculty</span>
              </div>

              <div style={{ display: 'grid', gap: 12 }}>
                {[
                  { label: 'Username', value: viewModal.username },
                  { label: 'Subject', value: viewModal.subject || '—' },
                  { label: 'Mobile', value: viewModal.mobile || '—' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>{item.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setViewModal(null)}>Close</button>
              <button className="btn btn-primary" onClick={() => { setViewModal(null); handleEdit(viewModal); }}>
                <Edit2 size={14} /> Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Faculty Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Faculty</h3>
              <button className="modal-close" onClick={() => { setShowAdd(false); setError(''); }}><X size={18} /></button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="modal-body">
                {error && <div className="alert alert-error">{error}</div>}
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" value={addData.name} onChange={e => setAddData({...addData, name: e.target.value})} required placeholder="Enter full name" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input className="form-input" type="email" value={addData.email} onChange={e => setAddData({...addData, email: e.target.value})} required placeholder="Faculty email for notifications" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Username *</label>
                    <input className="form-input" value={addData.username} onChange={e => setAddData({...addData, username: e.target.value})} required placeholder="Login username" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Password *</label>
                    <input className="form-input" type="password" value={addData.password} onChange={e => setAddData({...addData, password: e.target.value})} required placeholder="Set password" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Mobile</label>
                    <input className="form-input" value={addData.mobile} onChange={e => setAddData({...addData, mobile: e.target.value})} maxLength={10} placeholder="10 digit mobile" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Subject *</label>
                    <input className="form-input" value={addData.subject} onChange={e => setAddData({...addData, subject: e.target.value})} placeholder="e.g. Mathematics" required />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowAdd(false); setError(''); }}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Faculty</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Faculty Modal */}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Faculty — {editModal.name}</h3>
              <button className="modal-close" onClick={() => setEditModal(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input className="form-input" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Mobile</label>
                  <input className="form-input" value={editData.mobile} onChange={e => setEditData({...editData, mobile: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <input className="form-input" value={editData.subject} onChange={e => setEditData({...editData, subject: e.target.value})} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setEditModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageFaculty;


