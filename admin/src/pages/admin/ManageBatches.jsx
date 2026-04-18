import { useState, useEffect } from 'react';
import { getBatches, createBatch, updateBatch, deleteBatch } from '../../services/api';
import { Plus, Trash2, Edit2, X, CheckCircle, Save, Layers } from 'lucide-react';

const STANDARDS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11 Commerce', '12 Commerce'];

const ManageBatches = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [filterStd, setFilterStd] = useState('');

  const [addData, setAddData] = useState({ name: '', standard: '1' });
  const [editData, setEditData] = useState({ name: '', standard: '' });

  useEffect(() => { loadBatches(); }, [filterStd]);

  const loadBatches = async () => {
    setLoading(true);
    try {
      const params = filterStd ? { standard: filterStd } : {};
      const res = await getBatches(params);
      setBatches(res.data);
    } catch (err) { console.error('Failed to load batches', err); }
    finally { setLoading(false); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await createBatch(addData);
      setShowAdd(false);
      setSuccess('Batch created successfully!');
      setTimeout(() => setSuccess(''), 3000);
      setAddData({ name: '', standard: '1' });
      loadBatches();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create batch');
    }
  };

  const handleEdit = (b) => {
    setEditData({ name: b.name, standard: b.standard });
    setEditModal(b);
  };

  const handleSaveEdit = async () => {
    setError(''); setSuccess('');
    try {
      await updateBatch(editModal._id, editData);
      setEditModal(null);
      setSuccess('Batch renamed successfully!');
      setTimeout(() => setSuccess(''), 3000);
      loadBatches();
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this batch? Ensure no students are assigned to it first.')) return;
    try {
      await deleteBatch(id);
      setSuccess('Batch deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
      loadBatches();
    } catch (err) { alert('Delete failed'); }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-actions">
          <div>
            <h1>Manage Batches</h1>
            <p>Create and rename custom batches for your standards</p>
          </div>
          <button className="btn btn-primary" onClick={() => { setShowAdd(true); setError(''); }}>
            <Plus size={18} /> Create New Batch
          </button>
        </div>
      </div>

      {success && <div className="alert alert-success"><CheckCircle size={18} /> {success}</div>}

      <div className="filters-bar" style={{ marginBottom: 20 }}>
        <div className="form-group" style={{ margin: 0, minWidth: 200 }}>
          <label className="form-label" style={{ marginBottom: 4, fontSize: 12 }}>Filter by Standard</label>
          <select className="form-select" value={filterStd} onChange={e => setFilterStd(e.target.value)}>
            <option value="">All Standards</option>
            {STANDARDS.map(s => <option key={s} value={s}>Std {s}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner"></div></div>
      ) : batches.length === 0 ? (
        <div className="empty-state">
          <Layers size={48} />
          <h3>No batches found</h3>
          <p>There are no customized batches created yet. Click above to create one.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Standard</th>
                <th>Batch Name</th>
                <th>Created On</th>
                <th style={{ width: 120 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {batches.map(b => (
                <tr key={b._id}>
                  <td><span className="badge badge-blue">Std {b.standard}</span></td>
                  <td style={{ fontWeight: 600 }}>{b.name}</td>
                  <td style={{ color: '#64748b', fontSize: 13 }}>{new Date(b.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(b)}><Edit2 size={14} /></button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(b._id)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Batch Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3>Create Batch</h3>
              <button className="modal-close" onClick={() => setShowAdd(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="modal-body">
                {error && <div className="alert alert-error" style={{ padding: 10, marginBottom: 15 }}>{error}</div>}
                <div className="form-group">
                  <label className="form-label">Select Standard *</label>
                  <select className="form-select" value={addData.standard} onChange={e => setAddData({ ...addData, standard: e.target.value })} required>
                    {STANDARDS.map(s => <option key={s} value={s}>Std {s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Batch Name *</label>
                  <input type="text" className="form-input" placeholder="E.g. A1, Morning Batch, Group X" value={addData.name} onChange={e => setAddData({ ...addData, name: e.target.value })} required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><Save size={16} /> Create Batch</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Batch Modal */}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3>Rename Batch</h3>
              <button className="modal-close" onClick={() => setEditModal(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-error" style={{ padding: 10, marginBottom: 15 }}>{error}</div>}
              <div className="form-group">
                <label className="form-label">Standard *</label>
                <select className="form-select" value={editData.standard} onChange={e => setEditData({ ...editData, standard: e.target.value })} required>
                  {STANDARDS.map(s => <option key={s} value={s}>Std {s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Batch Name *</label>
                <input type="text" className="form-input" value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} required />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setEditModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveEdit}><Save size={16} /> Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageBatches;


