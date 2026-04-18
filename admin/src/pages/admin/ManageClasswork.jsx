import { useState, useEffect } from 'react';
import { getClasswork, uploadClasswork, updateClasswork, deleteClasswork, getBatches } from '../../services/api';
import { Plus, Trash2, Edit2, X, FileText, Download, CheckCircle } from 'lucide-react';

const STANDARDS = ['1','2','3','4','5','6','7','8','9','10','11 Commerce','12 Commerce'];

const ManageClasswork = ({ userRole = 'admin' }) => {
  const [classwork, setClasswork] = useState([]);
  const [filterStd, setFilterStd] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [success, setSuccess] = useState('');
  const [addData, setAddData] = useState({ title: '', description: '', subject: '', standard: '', batch: '', content: '' });
  const [editData, setEditData] = useState({ title: '', description: '', subject: '', standard: '', batch: '', content: '' });
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

  useEffect(() => { loadClasswork(); }, [filterStd, filterBatch]);

  const loadClasswork = async () => {
    try {
      const params = {};
      if (filterStd) params.standard = filterStd;
      if (filterBatch) params.batch = filterBatch;
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
    setEditData({ title: item.title, description: item.description || '', subject: item.subject, content: item.content || '', standard: item.standard, batch: item.batch || '' });
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
      setSuccess('Classwork updated!');
      setTimeout(() => setSuccess(''), 3000);
      loadClasswork();
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this classwork?')) return;
    try {
      await deleteClasswork(id);
      setClasswork(prev => prev.filter(c => c._id !== id));
    } catch (err) { alert(err.response?.data?.message || 'Delete failed'); }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-actions">
          <div>
            <h1>Classwork / Lecture Notes</h1>
            <p>Upload and manage standard-wise lecture notes</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus size={18} /> Upload Notes</button>
        </div>
      </div>

      {success && <div className="alert alert-success"><CheckCircle size={18} /> {success}</div>}

      <div className="filters-bar">
        <select className="form-select" value={filterStd} onChange={e => setFilterStd(e.target.value)}>
          <option value="">All Standards</option>
          {STANDARDS.map(s => <option key={s} value={s}>Std {s}</option>)}
        </select>
        <select className="form-select" value={filterBatch} onChange={e => setFilterBatch(e.target.value)}>
          <option value="">All Batches</option>
          {availableBatches.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner"></div></div>
      ) : classwork.length === 0 ? (
        <div className="empty-state">
          <FileText size={48} />
          <h3>No classwork found</h3>
          <p>Upload lecture notes to get started</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {classwork.map(item => (
            <div className="card" key={item._id}>
              <div className="card-header">
                <h3 style={{ fontSize: 16 }}>{item.title}</h3>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span className="badge badge-purple">Std {item.standard}</span>
                  {item.batch && <span className="badge badge-blue">Batch {item.batch}</span>}
                </div>
              </div>
              <div className="card-body" style={{ paddingTop: 12, paddingBottom: 12 }}>
                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>
                  <strong>Subject:</strong> {item.subject}
                </div>
                {item.description && (
                  <p style={{ fontSize: 13, color: '#475569', marginBottom: 8 }}>{item.description}</p>
                )}
                {item.content && (
                  <div style={{ fontSize: 13, background: '#f8fafc', padding: 12, borderRadius: 8, marginBottom: 8, maxHeight: 120, overflow: 'auto' }}>
                    {item.content}
                  </div>
                )}
                {item.fileUrl && (
                  <a href={`http://localhost:5000${item.fileUrl}`} target="_blank" rel="noreferrer"
                    className="btn btn-secondary btn-sm" style={{ marginBottom: 8 }}>
                    <Download size={14} /> {item.fileName || 'Download File'}
                  </a>
                )}
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                  By: {item.uploaderName} ({item.uploaderRole}) • {new Date(item.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="card-footer">
                <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(item)}><Edit2 size={14} /> Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item._id)}><Trash2 size={14} /> Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h3>Upload Lecture Notes</h3>
              <button className="modal-close" onClick={() => setShowAdd(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Title *</label>
                    <input className="form-input" value={addData.title} onChange={e => setAddData({...addData, title: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Standard *</label>
                    <select className="form-select" value={addData.standard} onChange={e => setAddData({...addData, standard: e.target.value})} required>
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
                  <label className="form-label">Subject *</label>
                  <input className="form-input" value={addData.subject} onChange={e => setAddData({...addData, subject: e.target.value})} required placeholder="e.g. Science" />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <input className="form-input" value={addData.description} onChange={e => setAddData({...addData, description: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Content / Notes</label>
                  <textarea className="form-textarea" value={addData.content} onChange={e => setAddData({...addData, content: e.target.value})} placeholder="Type lecture notes here..." rows={4}></textarea>
                </div>
                <div className="form-group">
                  <label className="form-label">Attach File (PDF, DOC, etc.)</label>
                  <input type="file" className="form-input" onChange={e => setFile(e.target.files[0])} style={{ paddingTop: 8 }} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Upload</button>
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
              <h3>Edit Classwork</h3>
              <button className="modal-close" onClick={() => setEditModal(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input className="form-input" value={editData.title} onChange={e => setEditData({...editData, title: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <input className="form-input" value={editData.subject} onChange={e => setEditData({...editData, subject: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Standard</label>
                  <select className="form-select" value={editData.standard} onChange={e => setEditData({...editData, standard: e.target.value})}>
                    <option value="">Select</option>
                    {STANDARDS.map(s => <option key={s} value={s}>Std {s}</option>)}
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
                <label className="form-label">Description</label>
                <input className="form-input" value={editData.description} onChange={e => setEditData({...editData, description: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Content</label>
                <textarea className="form-textarea" value={editData.content} onChange={e => setEditData({...editData, content: e.target.value})} rows={4}></textarea>
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

export default ManageClasswork;


