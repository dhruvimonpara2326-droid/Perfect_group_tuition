import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getMarks, addMarks, getStudents, getBatches } from '../../services/api';
import { Search, Award, Plus, X, CheckCircle, ChevronLeft, ChevronRight, Download, TrendingUp, TrendingDown } from 'lucide-react';

const STANDARDS = ['1','2','3','4','5','6','7','8','9','10','11 Commerce','12 Commerce'];
const EXAM_TYPES = [
  { value: 'unit_test', label: 'Unit Test' }
];

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

const FacultyMarks = () => {
  const { user } = useAuth();
  const [marks, setMarks] = useState([]);
  const [students, setStudents] = useState([]);
  const [filterStd, setFilterStd] = useState('1');
  const [filterBatch, setFilterBatch] = useState('');
  const [availableBatches, setAvailableBatches] = useState([]);
  const [filterSubject, setFilterSubject] = useState('');
  const [filterExam, setFilterExam] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [success, setSuccess] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 15;

  const [addData, setAddData] = useState({
    standard: '', studentId: '', subject: '', examType: 'unit_test',
    totalMarks: 100, obtainedMarks: 0, batch: ''
  });

  useEffect(() => {
    if (filterStd) getBatches({ standard: filterStd }).then(res => setAvailableBatches(res.data)).catch(console.error);
    else setAvailableBatches([]);
    setFilterBatch('');
  }, [filterStd]);

  useEffect(() => { loadMarks(); }, [filterStd, filterSubject, filterExam, filterBatch]);

  const loadMarks = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStd) params.standard = filterStd;
      if (filterBatch) params.batch = filterBatch;
      if (filterSubject) params.subject = filterSubject;
      if (filterExam) params.examType = filterExam;
      const res = await getMarks(params);
      setMarks(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadStudents = async (std) => {
    try {
      const res = await getStudents({ standard: std });
      setStudents(res.data);
    } catch (err) { console.error(err); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (Number(addData.obtainedMarks) > Number(addData.totalMarks)) {
      alert('Obtained marks cannot exceed total marks'); return;
    }
    try {
      const student = students.find(s => s._id === addData.studentId);
      await addMarks({
        ...addData,
        batch: student?.batch || ''
      });
      setShowAdd(false);
      setAddData({ standard: '', studentId: '', subject: '', examType: 'unit_test', totalMarks: 100, obtainedMarks: 0, batch: '' });
      setStudents([]);
      setSuccess('Marks added successfully!');
      setTimeout(() => setSuccess(''), 3000);
      loadMarks();
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const handleExport = () => {
    const headers = ['Student', 'Roll No', 'Standard', 'Subject', 'Exam', 'Obtained', 'Total', '%'];
    const rows = filtered.map(m => [
      m.studentId?.name || '', m.studentId?.rollNo || '', m.standard, m.subject,
      m.examType?.replace('_', ' '), m.obtainedMarks, m.totalMarks,
      Math.round((m.obtainedMarks / m.totalMarks) * 100)
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `marks_${filterStd || 'all'}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // Filter
  const filtered = marks.filter(m => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (m.studentId?.name?.toLowerCase().includes(q) || m.subject?.toLowerCase().includes(q));
  });

  // Stats
  const avgScore = marks.length > 0 ? Math.round(marks.reduce((s, m) => s + (m.obtainedMarks / m.totalMarks) * 100, 0) / marks.length) : 0;
  const above70 = marks.filter(m => (m.obtainedMarks / m.totalMarks) * 100 >= 70).length;
  const below40 = marks.filter(m => (m.obtainedMarks / m.totalMarks) * 100 < 40).length;

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);
  useEffect(() => { setCurrentPage(1); }, [search, filterStd, filterSubject, filterExam, filterBatch]);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-actions">
          <div>
            <h1>📝 Student Marks</h1>
            <p>View and add student marks • {marks.length} records</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={handleExport} disabled={marks.length === 0}>
              <Download size={16} /> Export
            </button>
          </div>
        </div>
      </div>

      {success && <div className="alert alert-success"><CheckCircle size={18} /> {success}</div>}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
        <div style={{ padding: '14px 18px', borderRadius: 10, background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', border: '1px solid #bfdbfe' }}>
          <div style={{ fontSize: 10, color: '#1e40af', fontWeight: 700, textTransform: 'uppercase' }}>Total Records</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#1e3a8a' }}>{marks.length}</div>
        </div>
        <div style={{ padding: '14px 18px', borderRadius: 10, background: 'linear-gradient(135deg, #ede9fe, #e0e7ff)', border: '1px solid #c4b5fd' }}>
          <div style={{ fontSize: 10, color: '#5b21b6', fontWeight: 700, textTransform: 'uppercase' }}>Avg Score</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#5b21b6' }}>{avgScore}%</div>
        </div>
        <div style={{ padding: '14px 18px', borderRadius: 10, background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1px solid #a7f3d0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#065f46', fontWeight: 700, textTransform: 'uppercase' }}>
            <TrendingUp size={12} /> Above 70%
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#065f46' }}>{above70}</div>
        </div>
        <div style={{ padding: '14px 18px', borderRadius: 10, background: 'linear-gradient(135deg, #fef2f2, #fee2e2)', border: '1px solid #fca5a5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#991b1b', fontWeight: 700, textTransform: 'uppercase' }}>
            <TrendingDown size={12} /> Below 40%
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#991b1b' }}>{below40}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input className="form-input" placeholder="Search student or subject..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
        </div>
        <select className="form-select" value={filterStd} onChange={e => setFilterStd(e.target.value)}>
          {STANDARDS.map(s => <option key={s} value={s}>Std {s}</option>)}
        </select>
        <select className="form-select" value={filterBatch} onChange={e => setFilterBatch(e.target.value)}>
          <option value="">All Batches</option>
          {availableBatches.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
        </select>
        <select className="form-select" value={filterExam} onChange={e => setFilterExam(e.target.value)}>
          <option value="">All Exams</option>
          {EXAM_TYPES.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
        </select>
        {(filterStd || filterBatch || filterExam || search) && (
          <button className="btn btn-secondary btn-sm" onClick={() => { setFilterStd(''); setFilterBatch(''); setFilterExam(''); setSearch(''); }}>
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="loading-container"><div className="spinner"></div></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state"><Award size={48} /><h3>No marks found</h3></div>
      ) : (
        <>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th><th>Standard</th><th>Subject</th><th>Exam</th>
                  <th>Obtained</th><th>Total</th><th>Score</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(m => {
                  const pct = Math.round((m.obtainedMarks / m.totalMarks) * 100);
                  return (
                    <tr key={m._id}>
                      <td style={{ fontWeight: 600 }}>{m.studentId?.name || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          <span className="badge badge-purple">Std {m.standard}</span>
                          {m.batch && <span className="badge badge-blue">Batch {m.batch}</span>}
                        </div>
                      </td>
                      <td>{m.subject}</td>
                      <td><span className="badge badge-blue">{m.examType?.replace('_', ' ')}</span></td>
                      <td style={{ fontWeight: 700 }}>{m.obtainedMarks}</td>
                      <td>{m.totalMarks}</td>
                      <td>
                        <span className={`badge ${pct >= 70 ? 'badge-green' : pct >= 40 ? 'badge-orange' : 'badge-red'}`}>
                          {pct}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginTop: 12, padding: '10px 16px', background: 'white', borderRadius: 8, border: '1px solid #e2e8f0'
            }}>
              <span style={{ fontSize: 13, color: '#64748b' }}>
                {(currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, filtered.length)} of {filtered.length}
              </span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="btn btn-secondary btn-sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><ChevronLeft size={14} /></button>
                <span style={{ padding: '4px 12px', fontSize: 13, fontWeight: 600 }}>{currentPage}/{totalPages}</span>
                <button className="btn btn-secondary btn-sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}><ChevronRight size={14} /></button>
              </div>
            </div>
          )}
        </>
      )}


    </div>
  );
};

export default FacultyMarks;
