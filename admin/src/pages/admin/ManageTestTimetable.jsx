import { useState, useEffect } from 'react';
import { getTimetable, createTimetableEntry, updateTimetableEntry, deleteTimetableEntry, getFaculty, getBatches } from '../../services/api';
import {
  Plus, Trash2, Edit2, X, CheckCircle, Calendar, Clock,
  Download, Search, Users, BookOpen, FileText, Eye,
  ChevronLeft, ChevronRight, AlertCircle
} from 'lucide-react';

const STANDARDS = ['1','2','3','4','5','6','7','8','9','10','11 Commerce','12 Commerce'];

const SUBJECTS_BY_STD = {
  '1': ['Gujarati', 'Hindi', 'English', 'Mathematics', 'EVS (Paryavaran)', 'Drawing'],
  '2': ['Gujarati', 'Hindi', 'English', 'Mathematics', 'EVS (Paryavaran)', 'Drawing'],
  '3': ['Gujarati', 'Hindi', 'English', 'Mathematics', 'EVS (Paryavaran)', 'Drawing', 'Computer'],
  '4': ['Gujarati', 'Hindi', 'English', 'Mathematics', 'EVS (Paryavaran)', 'Drawing', 'Computer'],
  '5': ['Gujarati', 'Hindi', 'English', 'Mathematics', 'EVS (Paryavaran)', 'Drawing', 'Computer'],
  '6': ['Gujarati', 'Hindi', 'English', 'Mathematics', 'Science', 'Social Science', 'Sanskrit', 'Computer', 'Drawing'],
  '7': ['Gujarati', 'Hindi', 'English', 'Mathematics', 'Science', 'Social Science', 'Sanskrit', 'Computer', 'Drawing'],
  '8': ['Gujarati', 'Hindi', 'English', 'Mathematics', 'Science', 'Social Science', 'Sanskrit', 'Computer', 'Drawing'],
  '9': ['Gujarati', 'Hindi', 'English', 'Mathematics', 'Science', 'Social Science', 'Sanskrit', 'Computer', 'Drawing'],
  '10': ['Gujarati', 'Hindi', 'English', 'Mathematics', 'Science', 'Social Science', 'Sanskrit', 'Computer', 'Drawing'],
  '11 Commerce': ['Accounts', 'Commerce (OC)', 'Economics', 'Statistics', 'S.P.', 'English', 'Gujarati', 'Computer'],
  '12 Commerce': ['Accounts', 'Commerce (OC)', 'Economics', 'Statistics', 'S.P.', 'English', 'Gujarati', 'Computer'],
};

const getSubjectsForStandard = (std) => {
  if (!std) {
    const all = new Set();
    Object.values(SUBJECTS_BY_STD).forEach(arr => arr.forEach(s => all.add(s)));
    return [...all].sort();
  }
  return SUBJECTS_BY_STD[std] || getSubjectsForStandard('');
};

const EXAM_TYPES = [
  { value: 'unit_test', label: 'Unit Test', color: '#2563eb', bg: '#eff6ff' },
];

const ManageTestTimetable = () => {
  const formatDate = (d) => { if (!d) return ''; const parts = d.split('-'); return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : d; };
  const today = new Date().toISOString().split('T')[0];
  const [entries, setEntries] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [filterStd, setFilterStd] = useState('');
  const [filterExam, setFilterExam] = useState('');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('upcoming');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [viewDetail, setViewDetail] = useState(null);
  const [success, setSuccess] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 12;

  const [addData, setAddData] = useState({
    day: '', date: '', time: '', subject: '', facultyId: '', standard: '',
    batch: '', examType: 'unit_test', totalMarks: '100',
    duration: '1 Hour', syllabus: ''
  });

  const [editData, setEditData] = useState({
    day: '', date: '', time: '', subject: '', facultyId: '', standard: '',
    batch: '', examType: '', totalMarks: '',
    duration: '', syllabus: ''
  });

  const [addBatches, setAddBatches] = useState([]);
  const [editBatches, setEditBatches] = useState([]);

  useEffect(() => {
    if (addData.standard) getBatches({ standard: addData.standard }).then(res => setAddBatches(res.data)).catch(console.error);
    else setAddBatches([]);
  }, [addData.standard]);

  useEffect(() => {
    if (editData.standard) getBatches({ standard: editData.standard }).then(res => setEditBatches(res.data)).catch(console.error);
    else setEditBatches([]);
  }, [editData.standard]);

  useEffect(() => { loadEntries(); loadFaculty(); }, [filterStd, filterExam]);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const params = { type: 'test' };
      if (filterStd) params.standard = filterStd;
      const res = await getTimetable(params);
      let data = res.data;
      if (filterExam) data = data.filter(e => e.examType === filterExam);
      setEntries(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadFaculty = async () => {
    try {
      const res = await getFaculty();
      setFaculty(res.data);
    } catch (err) { console.error(err); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const facultyMember = faculty.find(f => f._id === addData.facultyId);
      // Store test-specific data in the room field as JSON metadata
      const metadata = JSON.stringify({
        examType: addData.examType,
        totalMarks: addData.totalMarks,
        duration: addData.duration,
        syllabus: addData.syllabus,
        date: addData.date
      });
      await createTimetableEntry({
        day: addData.day,
        time: addData.time,
        subject: addData.subject,
        facultyId: addData.facultyId,
        standard: addData.standard,
        batch: addData.batch,
        type: 'test',
        room: metadata,
        facultyName: facultyMember?.name || ''
      });
      setShowAdd(false);
      setAddData({
        day: '', date: '', time: '', subject: '', facultyId: '', standard: '',
        batch: '', examType: 'unit_test', totalMarks: '100',
        duration: '1 Hour', syllabus: ''
      });
      setSuccess('Test entry added successfully!');
      setTimeout(() => setSuccess(''), 3000);
      loadEntries();
    } catch (err) { alert(err.response?.data?.message || 'Failed to add entry'); }
  };

  const handleEdit = (entry) => {
    const meta = parseMetadata(entry.room);
    setEditData({
      day: entry.day,
      time: entry.time,
      subject: entry.subject,
      facultyId: entry.facultyId?._id || entry.facultyId || '',
      standard: entry.standard,
      batch: entry.batch || '',
      date: meta.date || '',
      examType: meta.examType || 'unit_test',
      totalMarks: meta.totalMarks || '100',
      duration: meta.duration || '1 Hour',
      syllabus: meta.syllabus || ''
    });
    setEditModal(entry);
  };

  const handleSaveEdit = async () => {
    try {
      const facultyMember = faculty.find(f => f._id === editData.facultyId);
      const metadata = JSON.stringify({
        examType: editData.examType,
        totalMarks: editData.totalMarks,
        duration: editData.duration,
        syllabus: editData.syllabus,
        date: editData.date
      });
      await updateTimetableEntry(editModal._id, {
        day: editData.day,
        time: editData.time,
        subject: editData.subject,
        facultyId: editData.facultyId,
        standard: editData.standard,
        batch: editData.batch,
        room: metadata,
        facultyName: facultyMember?.name || editModal.facultyName
      });
      setEditModal(null);
      setSuccess('Test entry updated!');
      setTimeout(() => setSuccess(''), 3000);
      loadEntries();
    } catch (err) { alert(err.response?.data?.message || 'Update failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this test entry?')) return;
    try {
      await deleteTimetableEntry(id);
      setEntries(prev => prev.filter(e => e._id !== id));
      setSuccess('Entry deleted');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { alert('Delete failed'); }
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Day', 'Time', 'Subject', 'Exam Type', 'Total Marks', 'Duration', 'Faculty', 'Standard', 'Batch', 'Syllabus'];
    const rows = filtered.map(e => {
      const meta = parseMetadata(e.room);
      return [meta.date || '', e.day, e.time, e.subject, getExamLabel(meta.examType), meta.totalMarks || '', meta.duration || '',
        e.facultyName || e.facultyId?.name || '', e.standard, e.batch || '', (meta.syllabus || '').replace(/,/g, ';')];
    });
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test_timetable_${filterStd || 'all'}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Parse metadata stored in room field
  const parseMetadata = (roomStr) => {
    try {
      if (roomStr && roomStr.startsWith('{')) return JSON.parse(roomStr);
    } catch {}
    return { actualRoom: roomStr || '' };
  };

  const getExamLabel = (val) => EXAM_TYPES.find(e => e.value === val)?.label || val || 'Test';
  const getExamStyle = (val) => EXAM_TYPES.find(e => e.value === val) || EXAM_TYPES[0];

  // Search & filter
  const filtered = entries.filter(e => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (e.subject?.toLowerCase().includes(q) ||
            e.facultyName?.toLowerCase().includes(q) ||
            e.standard?.toLowerCase().includes(q) ||
            e.day?.toLowerCase().includes(q) ||
            (parseMetadata(e.room).date || '').includes(q));
  });

  // Stats
  const totalTests = entries.length;
  const examTypeCounts = {};
  entries.forEach(e => {
    const meta = parseMetadata(e.room);
    const type = meta.examType || 'unit_test';
    examTypeCounts[type] = (examTypeCounts[type] || 0) + 1;
  });
  const uniqueSubjects = [...new Set(entries.map(e => e.subject))];
  const uniqueStandards = [...new Set(entries.map(e => e.standard))];

  // Sort by day order then time
  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const sorted = [...filtered].sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day) || (a.time || '').localeCompare(b.time || ''));

  const categorized = { expired: [], today: [], upcoming: [] };
  const todayDateObj = new Date(today);
  todayDateObj.setHours(0,0,0,0);

  sorted.forEach(e => {
    const dStr = parseMetadata(e.room).date;
    if (!dStr) {
      categorized.upcoming.push(e);
      return;
    }
    const d = new Date(dStr);
    d.setHours(0,0,0,0);
    if (d < todayDateObj) categorized.expired.push(e);
    else if (d.getTime() === todayDateObj.getTime()) categorized.today.push(e);
    else categorized.upcoming.push(e);
  });

  const tabEntries = categorized[activeTab];

  // Pagination
  const totalPages = Math.ceil(tabEntries.length / perPage);
  const paginated = tabEntries.slice((currentPage - 1) * perPage, currentPage * perPage);

  useEffect(() => { setCurrentPage(1); }, [search, filterStd, filterExam, activeTab]);

  return (
    <div>
      {/* ====== HEADER ====== */}
      <div className="page-header">
        <div className="page-header-actions">
          <div>
            <h1>ðŸ“ Test / Exam Timetable</h1>
            <p>Schedule and manage tests, exams & assessments • {totalTests} tests across {uniqueStandards.length} standards</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={handleExportCSV} disabled={entries.length === 0}>
              <Download size={16} /> Export
            </button>
            <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
              <Plus size={18} /> Schedule Test
            </button>
          </div>
        </div>
      </div>

      {success && <div className="alert alert-success"><CheckCircle size={18} /> {success}</div>}

      {/* ====== STATS ====== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 20 }}>
        <div style={{ padding: '14px 18px', borderRadius: 12, background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', border: '1px solid #bfdbfe' }}>
          <div style={{ fontSize: 10, color: '#1e40af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Tests</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#1e3a8a', marginTop: 2 }}>{totalTests}</div>
          <div style={{ fontSize: 11, color: '#3b82f6' }}>{uniqueSubjects.length} subjects</div>
        </div>
        {EXAM_TYPES.slice(0, 5).map(et => (
          <div key={et.value} style={{
            padding: '14px 18px', borderRadius: 12, background: et.bg,
            border: `1px solid ${et.color}30`, cursor: 'pointer',
            outline: filterExam === et.value ? `2px solid ${et.color}` : 'none',
            transition: 'all 0.15s ease'
          }}
            onClick={() => setFilterExam(filterExam === et.value ? '' : et.value)}
          >
            <div style={{ fontSize: 10, color: et.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{et.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: et.color, marginTop: 2 }}>{examTypeCounts[et.value] || 0}</div>
            <div style={{ fontSize: 11, color: et.color, opacity: 0.7 }}>scheduled</div>
          </div>
        ))}
      </div>

      {/* ====== FILTERS ====== */}
      <div className="filters-bar">
        <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input className="form-input" placeholder="Search subject, faculty, day..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
        </div>
        <select className="form-select" value={filterStd} onChange={e => setFilterStd(e.target.value)}>
          <option value="">All Standards</option>
          {STANDARDS.map(s => <option key={s} value={s}>Std {s}</option>)}
        </select>
        <select className="form-select" value={filterExam} onChange={e => setFilterExam(e.target.value)}>
          <option value="">All Exam Types</option>
          {EXAM_TYPES.map(et => <option key={et.value} value={et.value}>{et.label}</option>)}
        </select>
        {(filterStd || filterExam || search) && (
          <button className="btn btn-secondary btn-sm" onClick={() => { setFilterStd(''); setFilterExam(''); setSearch(''); }}>
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* ====== TABS ====== */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        <button className={`tab-btn ${activeTab === 'expired' ? 'active' : ''}`} onClick={() => setActiveTab('expired')}>
          Expired Tests ({categorized.expired.length})
        </button>
        <button className={`tab-btn ${activeTab === 'today' ? 'active' : ''}`} onClick={() => setActiveTab('today')}>
          Today's Tests ({categorized.today.length})
        </button>
        <button className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`} onClick={() => setActiveTab('upcoming')}>
          Upcoming Tests ({categorized.upcoming.length})
        </button>
      </div>

      {/* ====== TEST CARDS ====== */}
      {loading ? (
        <div className="loading-container"><div className="spinner"></div></div>
      ) : tabEntries.length === 0 ? (
        <div className="empty-state">
          <FileText size={48} />
          <h3>No {activeTab} tests found</h3>
          <p>{filterStd || filterExam || search ? 'No tests match your filters' : `There are no ${activeTab} tests at the moment`}</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
            {paginated.map(entry => {
              const meta = parseMetadata(entry.room);
              const examStyle = getExamStyle(meta.examType);
              return (
                <div key={entry._id} className="card" style={{
                  borderLeft: `4px solid ${examStyle.color}`,
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}
                >
                  <div className="card-body" style={{ padding: '16px 20px' }}>
                    {/* Top row: exam type badge + day */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6,
                        background: examStyle.bg, color: examStyle.color, textTransform: 'uppercase',
                        letterSpacing: '0.03em'
                      }}>
                        {getExamLabel(meta.examType)}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={12} /> {entry.day}
                      </span>
                    </div>

                    {/* Subject */}
                    <div style={{ fontSize: 17, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>{entry.subject}</div>

                    {/* Time / Date */}
                    <div style={{ fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12 }}>
                      <Clock size={13} /> {meta.date ? `${formatDate(meta.date)} • ` : ''}{entry.time}
                    </div>

                    {/* Info grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                      <div style={{ padding: '8px 10px', borderRadius: 8, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                        <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Standard</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#5b21b6' }}>Std {entry.standard}</div>
                      </div>
                      <div style={{ padding: '8px 10px', borderRadius: 8, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                        <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Total Marks</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{meta.totalMarks || '—'}</div>
                      </div>
                      <div style={{ padding: '8px 10px', borderRadius: 8, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                        <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Duration</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{meta.duration || '—'}</div>
                      </div>
                      <div style={{ padding: '8px 10px', borderRadius: 8, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                        <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Faculty</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {entry.facultyName || entry.facultyId?.name || '—'}
                        </div>
                      </div>
                    </div>

                    {/* Badges row */}
                    {entry.batch && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                        <span className="badge badge-blue">Batch {entry.batch}</span>
                      </div>
                    )}

                    {/* Syllabus if present */}
                    {meta.syllabus && (
                      <div style={{
                        padding: '8px 12px', borderRadius: 8, background: '#fef3c7',
                        border: '1px solid #fde68a', marginBottom: 10, fontSize: 12, color: '#92400e'
                      }}>
                        <strong>ðŸ“– Syllabus:</strong> {meta.syllabus}
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: 10 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => setViewDetail(entry)} title="View Details"><Eye size={14} /></button>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(entry)} title="Edit"><Edit2 size={14} /></button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(entry._id)} title="Delete"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginTop: 16, padding: '12px 16px', background: 'white', borderRadius: 8, border: '1px solid #e2e8f0'
            }}>
              <span style={{ fontSize: 13, color: '#64748b' }}>
                Showing {(currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, tabEntries.length)} of {tabEntries.length}
              </span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="btn btn-secondary btn-sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                  <ChevronLeft size={14} />
                </button>
                <span style={{ padding: '4px 12px', fontSize: 13, fontWeight: 600 }}>{currentPage} / {totalPages}</span>
                <button className="btn btn-secondary btn-sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ====== VIEW DETAIL MODAL ====== */}
      {viewDetail && (() => {
        const meta = parseMetadata(viewDetail.room);
        const examStyle = getExamStyle(meta.examType);
        return (
          <div className="modal-overlay" onClick={() => setViewDetail(null)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
              <div className="modal-header">
                <h3>Test Details</h3>
                <button className="modal-close" onClick={() => setViewDetail(null)}><X size={18} /></button>
              </div>
              <div className="modal-body">
                <div style={{
                  textAlign: 'center', marginBottom: 20, padding: 24, borderRadius: 12,
                  background: examStyle.bg, borderLeft: `4px solid ${examStyle.color}`
                }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6,
                    background: 'white', color: examStyle.color, textTransform: 'uppercase', marginBottom: 8, display: 'inline-block'
                  }}>{getExamLabel(meta.examType)}</span>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', marginTop: 8 }}>{viewDetail.subject}</div>
                  <div style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>
                    <Calendar size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />{meta.date ? `${formatDate(meta.date)} (${viewDetail.day})` : viewDetail.day}
                    <span style={{ margin: '0 8px' }}>•</span>
                    <Clock size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />{viewDetail.time}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { label: 'Standard', value: `Std ${viewDetail.standard}`, icon: <BookOpen size={13} /> },
                    { label: 'Batch', value: viewDetail.batch ? `Batch ${viewDetail.batch}` : 'All', icon: <Users size={13} /> },
                    { label: 'Total Marks', value: meta.totalMarks || '—', icon: <FileText size={13} /> },
                    { label: 'Duration', value: meta.duration || '—', icon: <Clock size={13} /> },
                    { label: 'Faculty', value: viewDetail.facultyName || viewDetail.facultyId?.name || '—', icon: <Users size={13} /> },
                  ].map((item, i) => (
                    <div key={i} style={{ padding: '10px 14px', borderRadius: 8, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                        {item.icon} {item.label}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{item.value}</div>
                    </div>
                  ))}
                </div>

                {meta.syllabus && (
                  <div style={{
                    marginTop: 14, padding: '12px 16px', borderRadius: 8,
                    background: '#fef3c7', border: '1px solid #fde68a'
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', marginBottom: 4 }}>ðŸ“– Syllabus / Chapters</div>
                    <div style={{ fontSize: 13, color: '#78350f', lineHeight: 1.5 }}>{meta.syllabus}</div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setViewDetail(null)}>Close</button>
                <button className="btn btn-primary" onClick={() => { setViewDetail(null); handleEdit(viewDetail); }}>
                  <Edit2 size={14} /> Edit
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ====== ADD TEST MODAL ====== */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h3><Plus size={18} style={{ marginRight: 8 }} /> Schedule New Test</h3>
              <button className="modal-close" onClick={() => setShowAdd(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="modal-body">
                {/* Exam Type Selection */}
                <div className="form-group">
                  <label className="form-label">Exam Type *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {EXAM_TYPES.map(et => (
                      <button type="button" key={et.value}
                        onClick={() => setAddData({...addData, examType: et.value})}
                        style={{
                          padding: '10px 8px', borderRadius: 8, border: '2px solid',
                          borderColor: addData.examType === et.value ? et.color : '#e2e8f0',
                          background: addData.examType === et.value ? et.bg : 'white',
                          color: addData.examType === et.value ? et.color : '#64748b',
                          fontWeight: 600, fontSize: 12, cursor: 'pointer',
                          transition: 'all 0.15s ease', textAlign: 'center'
                        }}
                      >{et.label}</button>
                    ))}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Date</label>
                    <input type="date" className="form-input" value={addData.date} min={today} onChange={e => setAddData({...addData, date: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Day *</label>
                    <select className="form-select" value={addData.day} onChange={e => setAddData({...addData, day: e.target.value})} required>
                      <option value="">Select Day</option>
                      {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Time *</label>
                    <input className="form-input" value={addData.time} onChange={e => setAddData({...addData, time: e.target.value})} required placeholder="e.g. 10:00 AM" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Standard *</label>
                    <select className="form-select" value={addData.standard} onChange={e => {
                      const newStd = e.target.value;
                      const subjects = getSubjectsForStandard(newStd);
                      setAddData(prev => ({
                        ...prev, standard: newStd,
                        subject: subjects.includes(prev.subject) ? prev.subject : ''
                      }));
                    }} required>
                      <option value="">Select Standard</option>
                      {STANDARDS.map(s => <option key={s} value={s}>Std {s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      Subject *{addData.standard && <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: 11 }}> — Std {addData.standard}</span>}
                    </label>
                    <select className="form-select" value={addData.subject} onChange={e => setAddData({...addData, subject: e.target.value})} required
                      style={{ borderColor: !addData.standard ? '#fcd34d' : undefined }}
                    >
                      <option value="">{addData.standard ? 'Select Subject' : '← Select Standard first'}</option>
                      {getSubjectsForStandard(addData.standard).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Total Marks *</label>
                    <select className="form-select" value={addData.totalMarks} onChange={e => setAddData({...addData, totalMarks: e.target.value})}>
                      <option value="10">10 Marks</option>
                      <option value="20">20 Marks</option>
                      <option value="25">25 Marks</option>
                      <option value="30">30 Marks</option>
                      <option value="40">40 Marks</option>
                      <option value="50">50 Marks</option>
                      <option value="80">80 Marks</option>
                      <option value="100">100 Marks</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Duration *</label>
                    <select className="form-select" value={addData.duration} onChange={e => setAddData({...addData, duration: e.target.value})}>
                      <option value="15 Min">15 Minutes</option>
                      <option value="30 Min">30 Minutes</option>
                      <option value="45 Min">45 Minutes</option>
                      <option value="1 Hour">1 Hour</option>
                      <option value="1.5 Hours">1.5 Hours</option>
                      <option value="2 Hours">2 Hours</option>
                      <option value="3 Hours">3 Hours</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Faculty (Invigilator)</label>
                    <select className="form-select" value={addData.facultyId} onChange={e => setAddData({...addData, facultyId: e.target.value})}>
                      <option value="">Select Faculty</option>
                      {faculty.map(f => <option key={f._id} value={f._id}>{f.name} ({f.subject || 'N/A'})</option>)}
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
                  <label className="form-label">Syllabus / Chapters</label>
                  <textarea className="form-textarea" value={addData.syllabus} onChange={e => setAddData({...addData, syllabus: e.target.value})}
                    placeholder="e.g. Chapter 1-5, Trigonometry, Algebra..." rows={3} />
                </div>

                {/* Preview */}
                {addData.subject && addData.day && (
                  <div style={{
                    padding: 14, borderRadius: 10, background: getExamStyle(addData.examType).bg,
                    borderLeft: `4px solid ${getExamStyle(addData.examType).color}`
                  }}>
                    <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Preview</div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>{addData.subject} — {getExamLabel(addData.examType)}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                      {addData.date ? `${formatDate(addData.date)} • ` : ''}{addData.day} • {addData.time || 'Time TBD'} • Std {addData.standard} • {addData.totalMarks} Marks • {addData.duration}
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><Plus size={14} /> Schedule Test</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====== EDIT TEST MODAL ====== */}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h3><Edit2 size={18} style={{ marginRight: 8 }} /> Edit Test</h3>
              <button className="modal-close" onClick={() => setEditModal(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              {/* Exam Type Selection */}
              <div className="form-group">
                <label className="form-label">Exam Type</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {EXAM_TYPES.map(et => (
                    <button type="button" key={et.value}
                      onClick={() => setEditData({...editData, examType: et.value})}
                      style={{
                        padding: '10px 8px', borderRadius: 8, border: '2px solid',
                        borderColor: editData.examType === et.value ? et.color : '#e2e8f0',
                        background: editData.examType === et.value ? et.bg : 'white',
                        color: editData.examType === et.value ? et.color : '#64748b',
                        fontWeight: 600, fontSize: 12, cursor: 'pointer',
                        transition: 'all 0.15s ease', textAlign: 'center'
                      }}
                    >{et.label}</button>
                  ))}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input type="date" className="form-input" value={editData.date} min={today} onChange={e => setEditData({...editData, date: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Day</label>
                  <select className="form-select" value={editData.day} onChange={e => setEditData({...editData, day: e.target.value})}>
                    <option value="">Select Day</option>
                    {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Time</label>
                  <input className="form-input" value={editData.time} onChange={e => setEditData({...editData, time: e.target.value})} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Standard</label>
                  <select className="form-select" value={editData.standard} onChange={e => {
                    const newStd = e.target.value;
                    const subjects = getSubjectsForStandard(newStd);
                    setEditData(prev => ({
                      ...prev, standard: newStd,
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
                    <option value="">Select Subject</option>
                    {getSubjectsForStandard(editData.standard).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Total Marks</label>
                  <select className="form-select" value={editData.totalMarks} onChange={e => setEditData({...editData, totalMarks: e.target.value})}>
                    <option value="10">10 Marks</option>
                    <option value="20">20 Marks</option>
                    <option value="25">25 Marks</option>
                    <option value="30">30 Marks</option>
                    <option value="40">40 Marks</option>
                    <option value="50">50 Marks</option>
                    <option value="80">80 Marks</option>
                    <option value="100">100 Marks</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Duration</label>
                  <select className="form-select" value={editData.duration} onChange={e => setEditData({...editData, duration: e.target.value})}>
                    <option value="15 Min">15 Minutes</option>
                    <option value="30 Min">30 Minutes</option>
                    <option value="45 Min">45 Minutes</option>
                    <option value="1 Hour">1 Hour</option>
                    <option value="1.5 Hours">1.5 Hours</option>
                    <option value="2 Hours">2 Hours</option>
                    <option value="3 Hours">3 Hours</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Faculty (Invigilator)</label>
                  <select className="form-select" value={editData.facultyId} onChange={e => setEditData({...editData, facultyId: e.target.value})}>
                    <option value="">Select Faculty</option>
                    {faculty.map(f => <option key={f._id} value={f._id}>{f.name} ({f.subject || 'N/A'})</option>)}
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
                <label className="form-label">Syllabus / Chapters</label>
                <textarea className="form-textarea" value={editData.syllabus} onChange={e => setEditData({...editData, syllabus: e.target.value})} rows={3} />
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

export default ManageTestTimetable;


