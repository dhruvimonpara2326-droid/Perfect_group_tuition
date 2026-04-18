import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAttendance, markAttendance, getStudents, getAttendanceSummary, getBatches } from '../../services/api';
import {
  ClipboardCheck, Search, CheckCircle, X, Calendar, UserCheck, UserX,
  ChevronLeft, ChevronRight, Download
} from 'lucide-react';

const STANDARDS = ['1','2','3','4','5','6','7','8','9','10','11 Commerce','12 Commerce'];

const formatDate = (d) => { if (!d) return '—'; const parts = String(d).split('-'); return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : d; };

const FacultyAttendance = ({ mode = 'students' }) => {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [students, setStudents] = useState([]);
  const [summary, setSummary] = useState({ total: 0, present: 0, absent: 0, percentage: 0 });
  const [filterStd, setFilterStd] = useState('');
  const [filterBatch, setFilterBatch] = useState('');
  const [availableBatches, setAvailableBatches] = useState([]);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [markStd, setMarkStd] = useState('');
  const [markBatch, setMarkBatch] = useState('');
  const [markBatches, setMarkBatches] = useState([]);
  const [markDate, setMarkDate] = useState(new Date().toISOString().split('T')[0]);
  const [markStudents, setMarkStudents] = useState([]);
  const [pendingMarks, setPendingMarks] = useState({});
  const perPage = 20;

  useEffect(() => {
    if (filterStd) getBatches({ standard: filterStd }).then(res => setAvailableBatches(res.data)).catch(console.error);
    else setAvailableBatches([]);
    setFilterBatch('');
  }, [filterStd]);

  useEffect(() => {
    if (markStd) getBatches({ standard: markStd }).then(res => setMarkBatches(res.data)).catch(console.error);
    else setMarkBatches([]);
    setMarkBatch('');
  }, [markStd]);

  useEffect(() => { loadData(); }, [filterStd, filterBatch, filterDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (mode === 'self') {
        const [attRes, summRes] = await Promise.all([
          getAttendance({ userId: user._id }),
          getAttendanceSummary(user._id)
        ]);
        setAttendance(attRes.data);
        setSummary(summRes.data);
      } else {
        const params = { role: 'student' };
        if (filterStd) params.standard = filterStd;
        if (filterBatch) params.batch = filterBatch;
        if (filterDate) params.date = filterDate;
        const res = await getAttendance(params);
        setAttendance(res.data);
        // Calculate summary
        const total = res.data.length;
        const present = res.data.filter(a => a.status === 'present').length;
        setSummary({ total, present, absent: total - present, percentage: total > 0 ? Math.round((present / total) * 100) : 0 });
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const openMarkAttendance = async () => {
    setShowMarkModal(true);
    if (markStd) {
      try {
        const res = await getStudents({ standard: markStd });
        setMarkStudents(res.data);
        const init = {};
        res.data.forEach(s => { init[s._id] = 'present'; });
        setPendingMarks(init);
      } catch (err) { console.error(err); }
    }
  };

  const handleStdChangeForMark = async (std) => {
    setMarkStd(std);
    setMarkBatch('');
    setMarkStudents([]);
    setPendingMarks({});
  };

  const handleBatchChangeForMark = async (batch) => {
    setMarkBatch(batch);
    if (!markStd || !batch) { setMarkStudents([]); setPendingMarks({}); return; }
    try {
      const res = await getStudents({ standard: markStd, batch });
      setMarkStudents(res.data);
      const init = {};
      res.data.forEach(s => { init[s._id] = 'present'; });
      setPendingMarks(init);
    } catch (err) { console.error(err); }
  };

  const submitAttendance = async () => {
    try {
      const entries = Object.entries(pendingMarks).map(([studentId, status]) => ({
        userId: studentId, date: markDate, status, standard: markStd
      }));
      for (const entry of entries) {
        await markAttendance(entry);
      }
      setShowMarkModal(false);
      setSuccess(`Attendance marked for ${entries.length} students!`);
      setTimeout(() => setSuccess(''), 3000);
      loadData();
    } catch (err) { alert(err.response?.data?.message || 'Failed to mark attendance'); }
  };

  const toggleAll = (status) => {
    const updated = {};
    markStudents.forEach(s => { updated[s._id] = status; });
    setPendingMarks(updated);
  };

  // Filter & search
  const filtered = attendance.filter(a => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (a.userId?.name?.toLowerCase().includes(q) || a.standard?.toLowerCase().includes(q));
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);
  useEffect(() => { setCurrentPage(1); }, [search, filterStd, filterBatch, filterDate]);

  const isSelf = mode === 'self';

  return (
    <div>
      <div className="page-header">
        <div className="page-header-actions">
          <div>
            <h1>{isSelf ? '📋 My Attendance' : '✅ Student Attendance'}</h1>
            <p>{isSelf ? 'Your personal attendance records' : `Manage & view student attendance • ${attendance.length} records`}</p>
          </div>
          {!isSelf && (
            <button className="btn btn-primary" onClick={openMarkAttendance}>
              <ClipboardCheck size={18} /> Mark Attendance
            </button>
          )}
        </div>
      </div>

      {success && <div className="alert alert-success"><CheckCircle size={18} /> {success}</div>}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
        <div style={{ padding: '14px 18px', borderRadius: 10, background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', border: '1px solid #bfdbfe' }}>
          <div style={{ fontSize: 10, color: '#1e40af', fontWeight: 700, textTransform: 'uppercase' }}>Total Records</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#1e3a8a' }}>{summary.total}</div>
        </div>
        <div style={{ padding: '14px 18px', borderRadius: 10, background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1px solid #a7f3d0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#065f46', fontWeight: 700, textTransform: 'uppercase' }}>
            <UserCheck size={12} /> Present
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#065f46' }}>{summary.present}</div>
        </div>
        <div style={{ padding: '14px 18px', borderRadius: 10, background: 'linear-gradient(135deg, #fef2f2, #fee2e2)', border: '1px solid #fca5a5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#991b1b', fontWeight: 700, textTransform: 'uppercase' }}>
            <UserX size={12} /> Absent
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#991b1b' }}>{summary.absent}</div>
        </div>
        <div style={{ padding: '14px 18px', borderRadius: 10, background: summary.percentage >= 75 ? 'linear-gradient(135deg, #f0fdf4, #dcfce7)' : 'linear-gradient(135deg, #fef2f2, #fee2e2)', border: `1px solid ${summary.percentage >= 75 ? '#a7f3d0' : '#fca5a5'}` }}>
          <div style={{ fontSize: 10, color: summary.percentage >= 75 ? '#065f46' : '#991b1b', fontWeight: 700, textTransform: 'uppercase' }}>Percentage</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: summary.percentage >= 75 ? '#065f46' : '#991b1b' }}>{summary.percentage}%</div>
        </div>
      </div>

      {/* Attendance Progress */}
      {summary.total > 0 && (
        <div style={{ marginBottom: 16, padding: '10px 16px', borderRadius: 10, background: 'white', border: '1px solid #e2e8f0' }}>
          <div style={{ height: 8, borderRadius: 4, background: '#fee2e2', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 4,
              background: summary.percentage >= 75 ? 'linear-gradient(90deg, #059669, #34d399)' : 'linear-gradient(90deg, #dc2626, #f87171)',
              width: `${summary.percentage}%`, transition: 'width 0.6s ease'
            }} />
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters-bar">
        {!isSelf && (
          <>
            <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input className="form-input" placeholder="Search student..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
            </div>
            <select className="form-select" value={filterStd} onChange={e => setFilterStd(e.target.value)}>
              <option value="">All Standards</option>
              {STANDARDS.map(s => <option key={s} value={s}>Std {s}</option>)}
            </select>
            <select className="form-select" value={filterBatch} onChange={e => setFilterBatch(e.target.value)}>
              <option value="">All Batches</option>
              {availableBatches.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
            </select>
          </>
        )}
        <input type="date" className="form-input" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
        {(filterStd || filterBatch || search) && (
          <button className="btn btn-secondary btn-sm" onClick={() => { setFilterStd(''); setFilterBatch(''); setSearch(''); }}>
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="loading-container"><div className="spinner"></div></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state"><ClipboardCheck size={48} /><h3>No attendance records</h3></div>
      ) : (
        <>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  {!isSelf && <th>Student</th>}
                  {!isSelf && <th>Standard</th>}
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(a => (
                  <tr key={a._id}>
                    <td style={{ fontWeight: 600 }}>{formatDate(a.date)}</td>
                    {!isSelf && <td>{a.userId?.name || '—'}</td>}
                    {!isSelf && <td><span className="badge badge-purple">Std {a.standard || '—'}</span></td>}
                    <td>
                      <span className={`badge ${a.status === 'present' ? 'badge-green' : 'badge-red'}`}>
                        {a.status === 'present' ? '✓ Present' : '✗ Absent'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginTop: 12, padding: '10px 16px', background: 'white', borderRadius: 8, border: '1px solid #e2e8f0'
            }}>
              <span style={{ fontSize: 13, color: '#64748b' }}>{(currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, filtered.length)} of {filtered.length}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="btn btn-secondary btn-sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><ChevronLeft size={14} /></button>
                <span style={{ padding: '4px 12px', fontSize: 13, fontWeight: 600 }}>{currentPage}/{totalPages}</span>
                <button className="btn btn-secondary btn-sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}><ChevronRight size={14} /></button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Mark Attendance Modal */}
      {showMarkModal && (
        <div className="modal-overlay" onClick={() => setShowMarkModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h3><ClipboardCheck size={18} /> Mark Attendance</h3>
              <button className="modal-close" onClick={() => setShowMarkModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Standard *</label>
                  <select className="form-select" value={markStd} onChange={e => handleStdChangeForMark(e.target.value)}>
                    <option value="">Select Standard</option>
                    {STANDARDS.map(s => <option key={s} value={s}>Std {s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Batch *</label>
                  <select className="form-select" value={markBatch} onChange={e => handleBatchChangeForMark(e.target.value)}>
                    <option value="">Select Batch</option>
                    {markBatches.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row" style={{ marginTop: 12 }}>
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input type="date" className="form-input" value={markDate} onChange={e => setMarkDate(e.target.value)} />
                </div>
              </div>

              {markStudents.length > 0 && (
                <>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => toggleAll('present')} style={{ color: '#059669' }}>
                      <UserCheck size={14} /> Mark All Present
                    </button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => toggleAll('absent')} style={{ color: '#dc2626' }}>
                      <UserX size={14} /> Mark All Absent
                    </button>
                  </div>

                  <div style={{ maxHeight: 350, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                    {markStudents.map(s => (
                      <div key={s._id} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 14px', borderBottom: '1px solid #f1f5f9',
                        background: pendingMarks[s._id] === 'present' ? '#f0fdf4' : '#fef2f2'
                      }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{s.rollNo} - {s.name}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button type="button" className={`btn btn-sm ${pendingMarks[s._id] === 'present' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setPendingMarks(p => ({...p, [s._id]: 'present'}))} style={{ fontSize: 11, padding: '4px 10px' }}>
                            Present
                          </button>
                          <button type="button" className={`btn btn-sm ${pendingMarks[s._id] === 'absent' ? 'btn-danger' : 'btn-secondary'}`}
                            onClick={() => setPendingMarks(p => ({...p, [s._id]: 'absent'}))} style={{ fontSize: 11, padding: '4px 10px' }}>
                            Absent
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 8, background: '#f8fafc', display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: '#059669', fontWeight: 600 }}>
                      ✓ Present: {Object.values(pendingMarks).filter(v => v === 'present').length}
                    </span>
                    <span style={{ color: '#dc2626', fontWeight: 600 }}>
                      ✗ Absent: {Object.values(pendingMarks).filter(v => v === 'absent').length}
                    </span>
                    <span style={{ fontWeight: 600 }}>Total: {markStudents.length}</span>
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowMarkModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={submitAttendance} disabled={markStudents.length === 0}>
                <CheckCircle size={14} /> Submit Attendance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyAttendance;
