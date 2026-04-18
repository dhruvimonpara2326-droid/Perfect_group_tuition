import { useState, useEffect } from 'react';
import { getMarks, getAttendance, getStudents, getAttendanceSummary, getBatches } from '../../services/api';
import { Search, X, BarChart3, Award, TrendingUp, TrendingDown, Users, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

const STANDARDS = ['1','2','3','4','5','6','7','8','9','10','11 Commerce','12 Commerce'];

const StudentPerformance = () => {
  const [students, setStudents] = useState([]);
  const [filterStd, setFilterStd] = useState('');
  const [filterBatch, setFilterBatch] = useState('');
  const [availableBatches, setAvailableBatches] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentMarks, setStudentMarks] = useState([]);
  const [studentAttendance, setStudentAttendance] = useState({ total: 0, present: 0, absent: 0, percentage: 0 });
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 15;

  useEffect(() => {
    if (filterStd) getBatches({ standard: filterStd }).then(res => setAvailableBatches(res.data)).catch(console.error);
    else setAvailableBatches([]);
    setFilterBatch('');
  }, [filterStd]);

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

  const viewStudentDetail = async (student) => {
    setSelectedStudent(student);
    setLoadingDetail(true);
    try {
      const [marksRes, attRes] = await Promise.allSettled([
        getMarks({ studentId: student._id }),
        getAttendanceSummary(student._id)
      ]);
      setStudentMarks(marksRes.status === 'fulfilled' ? marksRes.value.data : []);
      setStudentAttendance(attRes.status === 'fulfilled' ? attRes.value.data : { total: 0, present: 0, absent: 0, percentage: 0 });
    } catch (err) { console.error(err); }
    finally { setLoadingDetail(false); }
  };

  const filtered = students.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (s.name?.toLowerCase().includes(q) || s.rollNo?.includes(search));
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);
  useEffect(() => { setCurrentPage(1); }, [search, filterStd, filterBatch]);

  // Marks analysis
  const avgScore = studentMarks.length > 0 
    ? Math.round(studentMarks.reduce((s, m) => s + (m.obtainedMarks / m.totalMarks) * 100, 0) / studentMarks.length) 
    : 0;
  const bestSubject = studentMarks.length > 0 
    ? studentMarks.reduce((best, m) => (m.obtainedMarks / m.totalMarks) > (best.obtainedMarks / best.totalMarks) ? m : best, studentMarks[0]) 
    : null;
  const worstSubject = studentMarks.length > 0 
    ? studentMarks.reduce((worst, m) => (m.obtainedMarks / m.totalMarks) < (worst.obtainedMarks / worst.totalMarks) ? m : worst, studentMarks[0]) 
    : null;

  return (
    <div>
      <div className="page-header">
        <h1>📊 Student Performance</h1>
        <p>Monitor student marks, attendance & progress • {students.length} students</p>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input className="form-input" placeholder="Search student by name or roll no..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
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
        <div style={{ display: 'grid', gridTemplateColumns: selectedStudent ? '1fr 1.3fr' : '1fr', gap: 16 }}>
          {/* Students List */}
          <div>
            <div className="table-container">
              <table className="data-table">
                <thead><tr><th>Roll</th><th>Name</th><th>Standard</th><th>Action</th></tr></thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr><td colSpan="4" style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>No students found</td></tr>
                  ) : paginated.map(s => (
                    <tr key={s._id} style={{ background: selectedStudent?._id === s._id ? '#eff6ff' : '', cursor: 'pointer' }}
                      onClick={() => viewStudentDetail(s)}>
                      <td style={{ fontWeight: 700, color: '#2563eb' }}>{s.rollNo}</td>
                      <td style={{ fontWeight: 600 }}>{s.name}</td>
                      <td><span className="badge badge-purple">Std {s.standard}</span></td>
                      <td>
                        <button className={`btn btn-sm ${selectedStudent?._id === s._id ? 'btn-primary' : 'btn-secondary'}`}
                          onClick={(e) => { e.stopPropagation(); viewStudentDetail(s); }}>
                          <Eye size={13} /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginTop: 10, padding: '8px 12px', background: 'white', borderRadius: 8, border: '1px solid #e2e8f0'
              }}>
                <span style={{ fontSize: 12, color: '#64748b' }}>{(currentPage-1)*perPage+1}–{Math.min(currentPage*perPage, filtered.length)} of {filtered.length}</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn btn-secondary btn-sm" disabled={currentPage===1} onClick={() => setCurrentPage(p => p-1)}><ChevronLeft size={14} /></button>
                  <span style={{ padding: '2px 10px', fontSize: 12, fontWeight: 600 }}>{currentPage}/{totalPages}</span>
                  <button className="btn btn-secondary btn-sm" disabled={currentPage===totalPages} onClick={() => setCurrentPage(p => p+1)}><ChevronRight size={14} /></button>
                </div>
              </div>
            )}
          </div>

          {/* Student Detail Panel */}
          {selectedStudent && (
            <div className="card" style={{ position: 'sticky', top: 16, alignSelf: 'start' }}>
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>📋 {selectedStudent.name}</h3>
                <button className="btn btn-secondary btn-sm" onClick={() => setSelectedStudent(null)}><X size={14} /></button>
              </div>
              <div className="card-body">
                {loadingDetail ? (
                  <div className="loading-container"><div className="spinner"></div></div>
                ) : (
                  <>
                    {/* Student Info */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                      <span className="badge badge-purple">Std {selectedStudent.standard}</span>
                      <span className="badge badge-blue">Roll: {selectedStudent.rollNo}</span>
                      {selectedStudent.batch && <span className="badge badge-gray">Batch {selectedStudent.batch}</span>}
                    </div>

                    {/* Stats Mini Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
                      <div style={{ padding: '10px 12px', borderRadius: 8, background: '#eff6ff', textAlign: 'center' }}>
                        <div style={{ fontSize: 9, color: '#1e40af', fontWeight: 700, textTransform: 'uppercase' }}>Avg Score</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: avgScore >= 70 ? '#059669' : avgScore >= 40 ? '#d97706' : '#dc2626' }}>{avgScore}%</div>
                      </div>
                      <div style={{ padding: '10px 12px', borderRadius: 8, background: '#f0fdf4', textAlign: 'center' }}>
                        <div style={{ fontSize: 9, color: '#065f46', fontWeight: 700, textTransform: 'uppercase' }}>Attendance</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: studentAttendance.percentage >= 75 ? '#059669' : '#dc2626' }}>
                          {studentAttendance.percentage || 0}%
                        </div>
                      </div>
                      <div style={{ padding: '10px 12px', borderRadius: 8, background: '#ede9fe', textAlign: 'center' }}>
                        <div style={{ fontSize: 9, color: '#5b21b6', fontWeight: 700, textTransform: 'uppercase' }}>Exams</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: '#5b21b6' }}>{studentMarks.length}</div>
                      </div>
                    </div>

                    {/* Attendance Bar */}
                    {studentAttendance.total > 0 && (
                      <div style={{ marginBottom: 16, padding: '8px 12px', borderRadius: 8, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 6 }}>
                          <span style={{ fontWeight: 600 }}>Attendance</span>
                          <span style={{ color: '#059669', fontWeight: 600 }}>P: {studentAttendance.present} | A: {studentAttendance.absent}</span>
                        </div>
                        <div style={{ height: 6, borderRadius: 3, background: '#fee2e2', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', borderRadius: 3,
                            background: studentAttendance.percentage >= 75 ? '#059669' : '#dc2626',
                            width: `${studentAttendance.percentage}%`
                          }} />
                        </div>
                      </div>
                    )}

                    {/* Best & Worst */}
                    {bestSubject && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                        <div style={{ padding: '8px 12px', borderRadius: 8, background: '#f0fdf4', border: '1px solid #a7f3d0' }}>
                          <div style={{ fontSize: 9, color: '#065f46', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
                            <TrendingUp size={11} /> BEST
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#059669' }}>
                            {bestSubject.subject} ({Math.round((bestSubject.obtainedMarks / bestSubject.totalMarks) * 100)}%)
                          </div>
                        </div>
                        <div style={{ padding: '8px 12px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fca5a5' }}>
                          <div style={{ fontSize: 9, color: '#991b1b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
                            <TrendingDown size={11} /> NEEDS HELP
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#dc2626' }}>
                            {worstSubject.subject} ({Math.round((worstSubject.obtainedMarks / worstSubject.totalMarks) * 100)}%)
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Marks Table */}
                    <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: '#334155' }}>📝 Marks Records</h4>
                    {studentMarks.length === 0 ? (
                      <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No marks records found</div>
                    ) : (
                      <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                        <table className="data-table" style={{ fontSize: 12 }}>
                          <thead><tr><th>Subject</th><th>Exam</th><th>Score</th><th>%</th></tr></thead>
                          <tbody>
                            {studentMarks.map(m => {
                              const pct = Math.round((m.obtainedMarks / m.totalMarks) * 100);
                              return (
                                <tr key={m._id}>
                                  <td style={{ fontWeight: 600 }}>{m.subject}</td>
                                  <td><span className="badge badge-blue" style={{ fontSize: 10 }}>{m.examType?.replace('_',' ')}</span></td>
                                  <td style={{ fontWeight: 700 }}>{m.obtainedMarks}/{m.totalMarks}</td>
                                  <td><span className={`badge ${pct>=70?'badge-green':pct>=40?'badge-orange':'badge-red'}`}>{pct}%</span></td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentPerformance;
