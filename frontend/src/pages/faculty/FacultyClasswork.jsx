import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getClasswork, uploadClasswork, updateClasswork, deleteClasswork, getBatches } from '../../services/api';
import { Plus, Trash2, Edit2, X, FileText, Download, CheckCircle, Search, BookOpen, Eye, Calendar } from 'lucide-react';

const STANDARDS = ['1','2','3','4','5','6','7','8','9','10','11 Commerce','12 Commerce'];

const SUBJECTS_BY_STD = {
  '1': ['Gujarati', 'Hindi', 'English', 'Mathematics', 'EVS (Paryavaran)', 'Drawing', 'PT'],
  '2': ['Gujarati', 'Hindi', 'English', 'Mathematics', 'EVS (Paryavaran)', 'Drawing', 'PT'],
  '3': ['Gujarati', 'Hindi', 'English', 'Mathematics', 'EVS (Paryavaran)', 'Drawing', 'PT', 'Computer'],
  '4': ['Gujarati', 'Hindi', 'English', 'Mathematics', 'EVS (Paryavaran)', 'Drawing', 'PT', 'Computer'],
  '5': ['Gujarati', 'Hindi', 'English', 'Mathematics', 'EVS (Paryavaran)', 'Drawing', 'PT', 'Computer'],
  '6': ['Gujarati', 'Hindi', 'English', 'Mathematics', 'Science', 'Social Science', 'Sanskrit', 'Computer', 'Drawing', 'PT'],
  '7': ['Gujarati', 'Hindi', 'English', 'Mathematics', 'Science', 'Social Science', 'Sanskrit', 'Computer', 'Drawing', 'PT'],
  '8': ['Gujarati', 'Hindi', 'English', 'Mathematics', 'Science', 'Social Science', 'Sanskrit', 'Computer', 'Drawing', 'PT'],
  '9': ['Gujarati', 'Hindi', 'English', 'Mathematics', 'Science', 'Social Science', 'Sanskrit', 'Computer', 'Drawing', 'PT'],
  '10': ['Gujarati', 'Hindi', 'English', 'Mathematics', 'Science', 'Social Science', 'Sanskrit', 'Computer', 'Drawing', 'PT'],
  '11 Commerce': ['Accounts', 'Commerce (OC)', 'Economics', 'Statistics', 'S.P.', 'English', 'Gujarati', 'Computer', 'PT'],
  '12 Commerce': ['Accounts', 'Commerce (OC)', 'Economics', 'Statistics', 'S.P.', 'English', 'Gujarati', 'Computer', 'PT'],
};
const getSubjects = (std) => {
  if (!std) { const all = new Set(); Object.values(SUBJECTS_BY_STD).forEach(a => a.forEach(s => all.add(s))); return [...all].sort(); }
  return SUBJECTS_BY_STD[std] || getSubjects('');
};

const FacultyClasswork = () => {
  const { user } = useAuth();
  const [classwork, setClasswork] = useState([]);
  const [filterStd, setFilterStd] = useState('');
  const [showMine, setShowMine] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [viewDetail, setViewDetail] = useState(null);
  const [success, setSuccess] = useState('');
  const [addData, setAddData] = useState({ title: '', description: '', subject: '', standard: '', batch: '', content: '' });
  const [editData, setEditData] = useState({});
  const [file, setFile] = useState(null);

  const [filterBatch, setFilterBatch] = useState('');
  const [availableBatches, setAvailableBatches] = useState([]);
  const [addBatches, setAddBatches] = useState([]);
  const [editBatches, setEditBatches] = useState([]);

  useEffect(() => {
    if (filterStd) getBatches({ standard: filterStd }).then(res => setAvailableBatches(res.data)).catch(console.error);
    else setAvailableBatches([]);
    setFilterBatch('');
  }, [filterStd]);

  useEffect(() => {
    if (addData.standard) getBatches({ standard: addData.standard }).then(res => setAddBatches(res.data)).catch(console.error);
    else setAddBatches([]);
  }, [addData.standard]);

  useEffect(() => {
    if (editData.standard) getBatches({ standard: editData.standard }).then(res => setEditBatches(res.data)).catch(console.error);
    else setEditBatches([]);
  }, [editData.standard]);

  useEffect(() => { loadClasswork(); }, [filterStd, filterBatch, showMine]);

  const loadClasswork = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStd) params.standard = filterStd;
      if (filterBatch) params.batch = filterBatch;
      if (showMine) params.uploadedBy = user._id;
      const res = await getClasswork(params);
      setClasswork(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.entries(addData).forEach(([key, val]) => formData.append(key, val));
      if (file) formData.append('file', file);
      await uploadClasswork(formData);
      setShowAdd(false);
      setAddData({ title: '', description: '', subject: '', standard: '', batch: '', content: '' });
      setFile(null);
      setSuccess('Classwork uploaded!');
      setTimeout(() => setSuccess(''), 3000);
      loadClasswork();
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const handleEdit = (item) => {
    setEditData({ title: item.title, description: item.description || '', subject: item.subject, standard: item.standard, batch: item.batch || '', content: item.content || '' });
    setEditModal(item);
  };

  const handleSaveEdit = async () => {
    try {
      const formData = new FormData();
      Object.entries(editData).forEach(([key, val]) => formData.append(key, val));
      if (file) formData.append('file', file);
      await updateClasswork(editModal._id, formData);
      setEditModal(null);
      setFile(null);
      setSuccess('Updated!');
      setTimeout(() => setSuccess(''), 3000);
      loadClasswork();
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this classwork?')) return;
    try {
      await deleteClasswork(id);
      setClasswork(prev => prev.filter(c => c._id !== id));
      setSuccess('Deleted!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { alert(err.response?.data?.message || 'Delete failed'); }
  };

  const canEditDelete = (item) => item.uploadedBy?._id === user._id || item.uploadedBy === user._id;

  // Search
  const filtered = classwork.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (c.title?.toLowerCase().includes(q) || c.subject?.toLowerCase().includes(q));
  });

  // Stats
  const myUploads = classwork.filter(c => c.uploadedBy?._id === user._id || c.uploadedBy === user._id).length;
  const uniqueSubjects = [...new Set(classwork.map(c => c.subject))];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-actions">
          <div>
            <h1>📚 Classwork & Notes</h1>
            <p>Upload and manage lecture notes • {classwork.length} total uploads</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            <Plus size={18} /> Upload Notes
          </button>
        </div>
      </div>

      {success && <div className="alert alert-success"><CheckCircle size={18} /> {success}</div>}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
        <div style={{ padding: '14px 18px', borderRadius: 10, background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', border: '1px solid #bfdbfe' }}>
          <div style={{ fontSize: 10, color: '#1e40af', fontWeight: 700, textTransform: 'uppercase' }}>Total Notes</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#1e3a8a' }}>{classwork.length}</div>
        </div>
        <div style={{ padding: '14px 18px', borderRadius: 10, background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1px solid #a7f3d0' }}>
          <div style={{ fontSize: 10, color: '#065f46', fontWeight: 700, textTransform: 'uppercase' }}>My Uploads</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#065f46' }}>{myUploads}</div>
        </div>
        <div style={{ padding: '14px 18px', borderRadius: 10, background: 'linear-gradient(135deg, #ede9fe, #e0e7ff)', border: '1px solid #c4b5fd' }}>
          <div style={{ fontSize: 10, color: '#5b21b6', fontWeight: 700, textTransform: 'uppercase' }}>Subjects</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#5b21b6' }}>{uniqueSubjects.length}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input className="form-input" placeholder="Search title or subject..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
        </div>
        <select className="form-select" value={filterStd} onChange={e => setFilterStd(e.target.value)}>
          <option value="">All Standards</option>
          {STANDARDS.map(s => <option key={s} value={s}>Std {s}</option>)}
        </select>
        <select className="form-select" value={filterBatch} onChange={e => setFilterBatch(e.target.value)}>
          <option value="">All Batches</option>
          {availableBatches.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          <input type="checkbox" checked={showMine} onChange={e => setShowMine(e.target.checked)} />
          My Uploads
        </label>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="loading-container"><div className="spinner"></div></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state"><FileText size={48} /><h3>No classwork found</h3><p>Upload your first lecture notes</p></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
          {filtered.map(item => (
            <div className="card" key={item._id} style={{
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              borderLeft: canEditDelete(item) ? '4px solid #2563eb' : '4px solid #e2e8f0'
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}
            >
              <div className="card-body" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', flex: 1 }}>{item.title}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span className="badge badge-purple" style={{ fontSize: 10, flexShrink: 0 }}>Std {item.standard}</span>
                    {item.batch && <span className="badge badge-blue" style={{ fontSize: 10, flexShrink: 0 }}>Batch {item.batch}</span>}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                  <span className="badge badge-blue"><BookOpen size={10} /> {item.subject}</span>
                  {canEditDelete(item) && <span className="badge badge-green" style={{ fontSize: 10 }}>My Upload</span>}
                </div>

                {item.description && (
                  <p style={{ fontSize: 12, color: '#64748b', marginBottom: 8, lineHeight: 1.4 }}>{item.description}</p>
                )}

                {item.content && (
                  <div style={{
                    fontSize: 12, background: '#f8fafc', padding: 10, borderRadius: 8,
                    marginBottom: 8, maxHeight: 80, overflow: 'hidden', color: '#475569',
                    position: 'relative'
                  }}>
                    {item.content}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 30, background: 'linear-gradient(transparent, #f8fafc)' }} />
                  </div>
                )}

                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  {item.fileUrl && (
                    <a href={`http://localhost:5000${item.fileUrl}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                      <Download size={12} /> {item.fileName || 'Download'}
                    </a>
                  )}
                  <button className="btn btn-secondary btn-sm" onClick={() => setViewDetail(item)}>
                    <Eye size={12} /> View
                  </button>
                  {canEditDelete(item) && (
                    <>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(item)}><Edit2 size={12} /></button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item._id)}><Trash2 size={12} /></button>
                    </>
                  )}
                </div>

                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>
                  <Calendar size={10} style={{ verticalAlign: 'middle', marginRight: 3 }} />
                  By: {item.uploaderName}
                  {item.createdAt && ` • ${new Date(item.createdAt).toLocaleDateString('en-IN')}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Detail Modal */}
      {viewDetail && (
        <div className="modal-overlay" onClick={() => setViewDetail(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h3>📄 {viewDetail.title}</h3>
              <button className="modal-close" onClick={() => setViewDetail(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                <span className="badge badge-purple">Std {viewDetail.standard}</span>
                {viewDetail.batch && <span className="badge badge-blue">Batch {viewDetail.batch}</span>}
                <span className="badge badge-blue">{viewDetail.subject}</span>
                <span className="badge badge-gray">By {viewDetail.uploaderName}</span>
              </div>
              {viewDetail.description && <p style={{ fontSize: 13, color: '#475569', marginBottom: 12, lineHeight: 1.5 }}>{viewDetail.description}</p>}
              {viewDetail.content && (
                <div style={{ fontSize: 13, background: '#f8fafc', padding: 16, borderRadius: 8, marginBottom: 12, lineHeight: 1.6, whiteSpace: 'pre-wrap', maxHeight: 300, overflow: 'auto' }}>
                  {viewDetail.content}
                </div>
              )}
              {viewDetail.fileUrl && (
                <a href={`http://localhost:5000${viewDetail.fileUrl}`} target="_blank" rel="noreferrer" className="btn btn-primary">
                  <Download size={14} /> Download File
                </a>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setViewDetail(null)}>Close</button>
              {canEditDelete(viewDetail) && (
                <button className="btn btn-primary" onClick={() => { setViewDetail(null); handleEdit(viewDetail); }}>
                  <Edit2 size={14} /> Edit
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h3><Plus size={18} /> Upload Lecture Notes</h3>
              <button className="modal-close" onClick={() => setShowAdd(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Title *</label>
                    <input className="form-input" value={addData.title} onChange={e => setAddData({...addData, title: e.target.value})} required placeholder="e.g. Chapter 5 Notes" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Standard *</label>
                    <select className="form-select" value={addData.standard} onChange={e => {
                      const std = e.target.value;
                      const subjects = getSubjects(std);
                      setAddData(prev => ({
                        ...prev, standard: std,
                        subject: subjects.includes(prev.subject) ? prev.subject : ''
                      }));
                    }} required>
                      <option value="">Select</option>
                      {STANDARDS.map(s => <option key={s} value={s}>Std {s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Batch</label>
                    <select className="form-select" value={addData.batch} onChange={e => setAddData({...addData, batch: e.target.value})}>
                      <option value="">All Batches</option>
                      {addBatches.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Subject *{addData.standard && <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: 11 }}> — Std {addData.standard}</span>}</label>
                  <select className="form-select" value={addData.subject} onChange={e => setAddData({...addData, subject: e.target.value})} required>
                    <option value="">{addData.standard ? 'Select Subject' : '← Select Standard first'}</option>
                    {getSubjects(addData.standard).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <input className="form-input" value={addData.description} onChange={e => setAddData({...addData, description: e.target.value})} placeholder="Brief description (optional)" />
                </div>
                <div className="form-group">
                  <label className="form-label">Notes Content</label>
                  <textarea className="form-textarea" value={addData.content} onChange={e => setAddData({...addData, content: e.target.value})} rows={5} placeholder="Type or paste notes here..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Attach File (PDF, Doc, Image)</label>
                  <input type="file" className="form-input" onChange={e => setFile(e.target.files[0])} style={{ paddingTop: 8 }} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><Plus size={14} /> Upload</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h3><Edit2 size={18} /> Edit Classwork</h3>
              <button className="modal-close" onClick={() => setEditModal(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Title</label>
                <input className="form-input" value={editData.title} onChange={e => setEditData({...editData, title: e.target.value})} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Standard</label>
                  <select className="form-select" value={editData.standard} onChange={e => {
                    const std = e.target.value;
                    const subjects = getSubjects(std);
                    setEditData(prev => ({
                      ...prev, standard: std,
                      subject: subjects.includes(prev.subject) ? prev.subject : ''
                    }));
                  }}>
                    <option value="">Select</option>
                    {STANDARDS.map(s => <option key={s} value={s}>Std {s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Subject{editData.standard && <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: 11 }}> — Std {editData.standard}</span>}</label>
                  <select className="form-select" value={editData.subject} onChange={e => setEditData({...editData, subject: e.target.value})}>
                    <option value="">Select</option>
                    {getSubjects(editData.standard).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Batch</label>
                  <select className="form-select" value={editData.batch} onChange={e => setEditData({...editData, batch: e.target.value})}>
                    <option value="">All Batches</option>
                    {editBatches.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Content</label>
                <textarea className="form-textarea" value={editData.content} onChange={e => setEditData({...editData, content: e.target.value})} rows={5} />
              </div>
              <div className="form-group">
                <label className="form-label">Replace File</label>
                <input type="file" className="form-input" onChange={e => setFile(e.target.files[0])} style={{ paddingTop: 8 }} />
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

export default FacultyClasswork;
