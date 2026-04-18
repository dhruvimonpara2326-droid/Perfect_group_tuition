import { useState, useEffect } from 'react';
import { getTimetable, getBatches } from '../../services/api';
import { Calendar, Clock, BookOpen, FileText, Search, X, Eye, Users } from 'lucide-react';

const STANDARDS = ['1','2','3','4','5','6','7','8','9','10','11 Commerce','12 Commerce'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const EXAM_TYPES = [
  { value: 'unit_test', label: 'Unit Test', color: '#2563eb', bg: '#eff6ff' },
];

const getExamLabel = (val) => EXAM_TYPES.find(e => e.value === val)?.label || val || 'Test';
const getExamStyle = (val) => EXAM_TYPES.find(e => e.value === val) || EXAM_TYPES[0];

const parseMetadata = (roomStr) => {
  try { if (roomStr && roomStr.startsWith('{')) return JSON.parse(roomStr); } catch {}
  return { actualRoom: roomStr || '' };
};

const FacultyTestTimetable = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStd, setFilterStd] = useState('');
  const [filterBatch, setFilterBatch] = useState('');
  const [availableBatches, setAvailableBatches] = useState([]);
  const [filterExam, setFilterExam] = useState('');
  const [search, setSearch] = useState('');
  const [viewDetail, setViewDetail] = useState(null);

  const todayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];

  useEffect(() => {
    if (filterStd) getBatches({ standard: filterStd }).then(res => setAvailableBatches(res.data)).catch(console.error);
    else setAvailableBatches([]);
    setFilterBatch('');
  }, [filterStd]);

  useEffect(() => { loadTimetable(); }, [filterStd, filterBatch]);

  const loadTimetable = async () => {
    setLoading(true);
    try {
      const params = { type: 'test' };
      if (filterStd) params.standard = filterStd;
      if (filterBatch) params.batch = filterBatch;
      const res = await getTimetable(params);
      let data = res.data;
      setEntries(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  // Filter
  let filtered = entries;
  if (filterExam) filtered = filtered.filter(e => { const m = parseMetadata(e.room); return m.examType === filterExam; });
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(e => e.subject?.toLowerCase().includes(q) || e.day?.toLowerCase().includes(q) || e.standard?.toLowerCase().includes(q));
  }

  // Sort
  const dayOrder = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };
  const sorted = [...filtered].sort((a, b) => (dayOrder[a.day] || 7) - (dayOrder[b.day] || 7));

  // Stats
  const todayTests = entries.filter(e => e.day === todayName);
  const uniqueSubjects = [...new Set(entries.map(e => e.subject))];

  return (
    <div>
      <div className="page-header">
        <h1>📝 Test / Exam Schedule</h1>
        <p>Upcoming tests and examinations • {entries.length} tests scheduled</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 20 }}>
        <div style={{ padding: '14px 18px', borderRadius: 10, background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', border: '1px solid #bfdbfe' }}>
          <div style={{ fontSize: 10, color: '#1e40af', fontWeight: 700, textTransform: 'uppercase' }}>Total Tests</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#1e3a8a' }}>{entries.length}</div>
          <div style={{ fontSize: 10, color: '#3b82f6' }}>{uniqueSubjects.length} subjects</div>
        </div>
        <div style={{ padding: '14px 18px', borderRadius: 10, background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1px solid #a7f3d0' }}>
          <div style={{ fontSize: 10, color: '#065f46', fontWeight: 700, textTransform: 'uppercase' }}>Today ({todayName.slice(0,3)})</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#065f46' }}>{todayTests.length}</div>
        </div>
        {EXAM_TYPES.slice(0, 4).map(et => {
          const count = entries.filter(e => parseMetadata(e.room).examType === et.value).length;
          return (
            <div key={et.value} style={{
              padding: '14px 18px', borderRadius: 10, background: et.bg,
              border: `1px solid ${et.color}25`, cursor: 'pointer',
              outline: filterExam === et.value ? `2px solid ${et.color}` : 'none'
            }} onClick={() => setFilterExam(filterExam === et.value ? '' : et.value)}>
              <div style={{ fontSize: 10, color: et.color, fontWeight: 700, textTransform: 'uppercase' }}>{et.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: et.color }}>{count}</div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input className="form-input" placeholder="Search subject, day..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
        </div>
        <select className="form-select" value={filterStd} onChange={e => setFilterStd(e.target.value)}>
          <option value="">All Standards</option>
          {STANDARDS.map(s => <option key={s} value={s}>Std {s}</option>)}
        </select>
        <select className="form-select" value={filterBatch} onChange={e => setFilterBatch(e.target.value)}>
          <option value="">All Batches</option>
          {availableBatches.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
        </select>
        <select className="form-select" value={filterExam} onChange={e => setFilterExam(e.target.value)}>
          <option value="">All Types</option>
          {EXAM_TYPES.map(et => <option key={et.value} value={et.value}>{et.label}</option>)}
        </select>
        {(filterStd || filterBatch || filterExam || search) && (
          <button className="btn btn-secondary btn-sm" onClick={() => { setFilterStd(''); setFilterBatch(''); setFilterExam(''); setSearch(''); }}>
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* Test Cards */}
      {loading ? (
        <div className="loading-container"><div className="spinner"></div></div>
      ) : sorted.length === 0 ? (
        <div className="empty-state"><FileText size={48} /><h3>No tests scheduled</h3><p>No tests match your current filters</p></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
          {sorted.map(entry => {
            const meta = parseMetadata(entry.room);
            const examStyle = getExamStyle(meta.examType);
            const isToday = entry.day === todayName;
            return (
              <div key={entry._id} className="card" style={{
                borderLeft: `4px solid ${examStyle.color}`,
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                background: isToday ? `${examStyle.color}05` : 'white'
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}
              >
                <div className="card-body" style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 5,
                      background: examStyle.bg, color: examStyle.color, textTransform: 'uppercase'
                    }}>{getExamLabel(meta.examType)}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {isToday && <span className="badge badge-blue" style={{ fontSize: 10 }}>TODAY</span>}
                      <span style={{ fontSize: 11, color: '#64748b' }}><Calendar size={11} style={{ verticalAlign: 'middle', marginRight: 3 }} />{entry.day}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>{entry.subject}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>
                    <Clock size={12} style={{ verticalAlign: 'middle', marginRight: 3 }} />{entry.time}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    <div style={{ padding: '6px 10px', borderRadius: 6, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Standard</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#5b21b6' }}>Std {entry.standard}</div>
                    </div>
                    <div style={{ padding: '6px 10px', borderRadius: 6, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Marks</div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{meta.totalMarks || '—'}</div>
                    </div>
                    <div style={{ padding: '6px 10px', borderRadius: 6, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Duration</div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{meta.duration || '—'}</div>
                    </div>
                    <div style={{ padding: '6px 10px', borderRadius: 6, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Faculty</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {entry.facultyName || entry.facultyId?.name || '—'}
                      </div>
                    </div>
                  </div>
                  {meta.syllabus && (
                    <div style={{ marginTop: 8, padding: '6px 10px', borderRadius: 6, background: '#fef3c7', border: '1px solid #fde68a', fontSize: 11, color: '#92400e' }}>
                      📖 {meta.syllabus}
                    </div>
                  )}
                  <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => setViewDetail(entry)}><Eye size={14} /> Details</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {viewDetail && (() => {
        const meta = parseMetadata(viewDetail.room);
        const examStyle = getExamStyle(meta.examType);
        return (
          <div className="modal-overlay" onClick={() => setViewDetail(null)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
              <div className="modal-header"><h3>Test Details</h3><button className="modal-close" onClick={() => setViewDetail(null)}><X size={18} /></button></div>
              <div className="modal-body">
                <div style={{ textAlign: 'center', padding: 20, borderRadius: 10, background: examStyle.bg, borderLeft: `4px solid ${examStyle.color}`, marginBottom: 16 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5, background: 'white', color: examStyle.color, textTransform: 'uppercase' }}>{getExamLabel(meta.examType)}</span>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', marginTop: 8 }}>{viewDetail.subject}</div>
                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                    {viewDetail.day} • {viewDetail.time}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { l: 'Standard', v: `Std ${viewDetail.standard}` },
                    { l: 'Batch', v: viewDetail.batch ? `Batch ${viewDetail.batch}` : 'All' },
                    { l: 'Total Marks', v: meta.totalMarks || '—' },
                    { l: 'Duration', v: meta.duration || '—' },
                    { l: 'Faculty', v: viewDetail.facultyName || viewDetail.facultyId?.name || '—' },
                    { l: 'Room', v: meta.actualRoom || '—' },
                  ].map((item, i) => (
                    <div key={i} style={{ padding: '8px 12px', borderRadius: 6, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>{item.l}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{item.v}</div>
                    </div>
                  ))}
                </div>
                {meta.syllabus && (
                  <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: '#fef3c7', border: '1px solid #fde68a' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', marginBottom: 4 }}>📖 Syllabus</div>
                    <div style={{ fontSize: 13, color: '#78350f', lineHeight: 1.5 }}>{meta.syllabus}</div>
                  </div>
                )}
              </div>
              <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setViewDetail(null)}>Close</button></div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default FacultyTestTimetable;
