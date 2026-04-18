import { useState, useEffect } from 'react';
import { getStudents, deleteUser, updateUser, getBatches } from '../../services/api';
import { Search, Edit2, Trash2, X, Download, Users, Filter, ChevronLeft, ChevronRight, Eye, Phone, Hash, GraduationCap } from 'lucide-react';

const STANDARDS = ['1','2','3','4','5','6','7','8','9','10','11 Commerce','12 Commerce'];

const ManageStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStd, setFilterStd] = useState('');
  const [filterBatch, setFilterBatch] = useState('');
  const [search, setSearch] = useState('');
  const [editModal, setEditModal] = useState(null);
  const [viewModal, setViewModal] = useState(null);
  const [editData, setEditData] = useState({});
  const [success, setSuccess] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 15;

  const [availableBatches, setAvailableBatches] = useState([]);
  const [editBatches, setEditBatches] = useState([]);

  useEffect(() => {
    if (filterStd) {
      getBatches({ standard: filterStd }).then(res => setAvailableBatches(res.data)).catch(console.error);
    } else {
      setAvailableBatches([]);
    }
  }, [filterStd]);

  useEffect(() => {
    if (editData.standard) {
      getBatches({ standard: editData.standard }).then(res => setEditBatches(res.data)).catch(console.error);
    } else {
      setEditBatches([]);
    }
  }, [editData.standard]);

  useEffect(() => { loadStudents(); }, [filterStd, filterBatch]);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStd) params.standard = filterStd;
      if (filterBatch) params.batch = filterBatch;
      const res = await getStudents(params);
      setStudents(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student? This action cannot be undone.')) return;
    try {
      await deleteUser(id);
      setStudents(prev => prev.filter(s => s._id !== id));
      setSuccess('Student deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { alert(err.response?.data?.message || 'Delete failed'); }
  };

  const handleEdit = (student) => {
    setEditData({
      name: student.name,
      mobile: student.mobile,
      batch: student.batch,
      standard: student.standard,
      rollNo: student.rollNo
    });
    setEditModal(student);
  };

  const handleSaveEdit = async () => {
    try {
      await updateUser(editModal._id, editData);
      setEditModal(null);
      setSuccess('Student updated successfully');
      setTimeout(() => setSuccess(''), 3000);
      loadStudents();
    } catch (err) { alert(err.response?.data?.message || 'Update failed'); }
  };

  const handleExportCSV = () => {
    const headers = ['Roll No', 'Name', 'Username', 'Mobile', 'Standard', 'Batch'];
    const rows = filtered.map(s => [s.rollNo, s.name, s.username, s.mobile, s.standard, s.batch]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students_${filterStd || 'all'}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = students.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.username?.toLowerCase().includes(search.toLowerCase()) ||
    (s.rollNo && s.rollNo.includes(search)) ||
    (s.mobile && s.mobile.includes(search))
  );

  // Pagination
  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  useEffect(() => { setCurrentPage(1); }, [search, filterStd, filterBatch]);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-actions">
          <div>
            <h1>Manage Students</h1>
            <p>View and manage all student records ({filtered.length} students)</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={handleExportCSV} disabled={filtered.length === 0}>
              <Download size={16} /> Export CSV
            </button>
          </div>
        </div>
      </div>

      {success && (
        <div className="alert alert-success" style={{ animation: 'fadeIn 0.3s ease' }}>
          ✓ {success}
        </div>
      )}

      <div className="filters-bar">
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            className="form-input"
            placeholder="Search by name, username, roll no, or mobile..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 36 }}
          />
        </div>
        <select className="form-select" value={filterStd} onChange={e => setFilterStd(e.target.value)}>
          <option value="">All Standards</option>
          {STANDARDS.map(s => <option key={s} value={s}>Std {s}</option>)}
        </select>
        <select className="form-select" value={filterBatch} onChange={e => setFilterBatch(e.target.value)}>
          <option value="">All Batches</option>
          {availableBatches.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
        </select>
        {(filterStd || filterBatch || search) && (
          <button className="btn btn-secondary btn-sm" onClick={() => { setFilterStd(''); setFilterBatch(''); setSearch(''); }}>
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner"></div></div>
      ) : (
        <>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Roll No</th>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Mobile</th>
                  <th>Standard</th>
                  <th>Batch</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
                      <Users size={40} style={{ marginBottom: 8, opacity: 0.3 }} /><br />
                      No students found matching your filters
                    </td>
                  </tr>
                ) : (
                  paginated.map((s, idx) => (
                    <tr key={s._id}>
                      <td style={{ color: '#94a3b8', fontSize: 12 }}>{(currentPage - 1) * perPage + idx + 1}</td>
                      <td>
                        <span style={{ fontWeight: 700, color: '#1e3a8a', background: '#eff6ff', padding: '2px 8px', borderRadius: 4, fontSize: 13 }}>
                          {s.rollNo}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{s.name}</td>
                      <td><span className="badge badge-blue">{s.username}</span></td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                          <Phone size={12} color="#94a3b8" /> {s.mobile || '—'}
                        </span>
                      </td>
                      <td><span className="badge badge-purple">Std {s.standard}</span></td>
                      <td><span className="badge badge-gray">Batch {s.batch}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => setViewModal(s)} title="View Details">
                            <Eye size={14} />
                          </button>
                          <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(s)} title="Edit">
                            <Edit2 size={14} />
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s._id)} title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginTop: 16, padding: '12px 16px', background: 'white',
              borderRadius: 8, border: '1px solid #e2e8f0'
            }}>
              <span style={{ fontSize: 13, color: '#64748b' }}>
                Showing {(currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, filtered.length)} of {filtered.length}
              </span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  <ChevronLeft size={14} /> Prev
                </button>
                {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                  let page;
                  if (totalPages <= 5) page = i + 1;
                  else if (currentPage <= 3) page = i + 1;
                  else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                  else page = currentPage - 2 + i;
                  return (
                    <button
                      key={page}
                      className={`btn btn-sm ${currentPage === page ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setCurrentPage(page)}
                      style={{ minWidth: 32 }}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* View Modal */}
      {viewModal && (
        <div className="modal-overlay" onClick={() => setViewModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Student Details</h3>
              <button className="modal-close" onClick={() => setViewModal(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div style={{
                textAlign: 'center', marginBottom: 24, padding: 20,
                background: 'linear-gradient(135deg, #eff6ff, #e0e7ff)', borderRadius: 12
              }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%', margin: '0 auto 12px',
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, fontWeight: 800
                }}>
                  {viewModal.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{viewModal.name}</h3>
                <span className="badge badge-blue">{viewModal.username}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { label: 'Roll No', value: viewModal.rollNo, icon: <Hash size={14} /> },
                  { label: 'Mobile', value: viewModal.mobile || '—', icon: <Phone size={14} /> },
                  { label: 'Standard', value: `Std ${viewModal.standard}`, icon: <GraduationCap size={14} /> },
                  { label: 'Batch', value: `Batch ${viewModal.batch}`, icon: <Users size={14} /> },
                ].map((item, i) => (
                  <div key={i} style={{ padding: 12, borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                      {item.icon} {item.label}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setViewModal(null)}>Close</button>
              <button className="btn btn-primary" onClick={() => { setViewModal(null); handleEdit(viewModal); }}>
                <Edit2 size={14} /> Edit Student
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Student — {editModal.name}</h3>
              <button className="modal-close" onClick={() => setEditModal(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Roll No</label>
                  <input className="form-input" value={editData.rollNo} onChange={e => setEditData({...editData, rollNo: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Mobile</label>
                  <input className="form-input" value={editData.mobile} onChange={e => setEditData({...editData, mobile: e.target.value})} maxLength={10} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Standard *</label>
                  <select className="form-select" value={editData.standard} onChange={e => setEditData({...editData, standard: e.target.value})}>
                    {STANDARDS.map(s => <option key={s} value={s}>Std {s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Batch *</label>
                  <select className="form-select" value={editData.batch} onChange={e => setEditData({...editData, batch: e.target.value})}>
                    {editBatches.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
                  </select>
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

export default ManageStudents;


