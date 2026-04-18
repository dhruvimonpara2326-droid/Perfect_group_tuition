import { useState, useEffect } from 'react';
import { getStudents, getFaculty, markAttendance, getAttendance, getBatches } from '../../services/api';
import { Save, CheckCircle, Search, Download, BarChart3, Calendar, Users, ClipboardCheck } from 'lucide-react';

const STANDARDS = ['1','2','3','4','5','6','7','8','9','10','11 Commerce','12 Commerce'];

const ManageAttendance = () => {
  const [tab, setTab] = useState('mark');
  const [personTab, setPersonTab] = useState('student');
  const [students, setStudents] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [filterStd, setFilterStd] = useState('1');
  const [filterBatch, setFilterBatch] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  // Report state
  const [reportData, setReportData] = useState([]);
  const [reportMonth, setReportMonth] = useState(String(new Date().getMonth() + 1));
  const [reportYear, setReportYear] = useState(String(new Date().getFullYear()));
  const [reportStd, setReportStd] = useState('1');
  const [reportRole, setReportRole] = useState('student');
  const [reportLoading, setReportLoading] = useState(false);

  const [availableBatches, setAvailableBatches] = useState([]);

  useEffect(() => {
    if (personTab === 'student' && filterStd) {
      getBatches({ standard: filterStd }).then(res => setAvailableBatches(res.data)).catch(err => console.error(err));
    } else {
      setAvailableBatches([]);
    }
  }, [filterStd, personTab]);

  useEffect(() => {
    if (tab === 'mark') {
      if (personTab === 'student') loadStudents();
      else loadFaculty();
    }
  }, [tab, personTab, filterStd, filterBatch]);

  useEffect(() => {
    if (tab === 'mark') loadExistingAttendance();
  }, [date, personTab, filterStd, filterBatch, tab]);

  useEffect(() => {
    if (tab === 'report') loadReport();
  }, [tab, reportMonth, reportYear, reportStd, reportRole]);

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

  const loadFaculty = async () => {
    setLoading(true);
    try {
      const res = await getFaculty();
      setFaculty(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadExistingAttendance = async () => {
    try {
      const params = { date, role: personTab };
      if (filterStd) params.standard = filterStd;
      if (filterBatch) params.batch = filterBatch;
      const res = await getAttendance(params);
      const existing = {};
      res.data.forEach(a => {
        if (a.date === date) {
          existing[a.userId?._id || a.userId] = a.status;
        }
      });
      setRecords(existing);
    } catch (err) { console.error(err); }
  };

  const loadReport = async () => {
    setReportLoading(true);
    try {
      const params = { month: reportMonth, year: reportYear, role: reportRole };
      if (reportRole === 'student' && reportStd) params.standard = reportStd;
      const res = await getAttendance(params);

      // Group by user
      const userMap = {};
      res.data.forEach(a => {
        const userId = a.userId?._id || a.userId;
        const name = a.userId?.name || 'Unknown';
        const designation = reportRole === 'student' ? (a.userId?.rollNo || '') : (a.userId?.subject || a.userId?.username || '');
        if (!userMap[userId]) {
          userMap[userId] = { name, designation, present: 0, absent: 0, total: 0 };
        }
        userMap[userId].total++;
        if (a.status === 'present') userMap[userId].present++;
        else userMap[userId].absent++;
      });

      setReportData(Object.values(userMap).sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err) { console.error(err); }
    finally { setReportLoading(false); }
  };

  const markAll = (status) => {
    const people = personTab === 'student' ? students : faculty;
    const newRecords = {};
    people.forEach(p => { newRecords[p._id] = status; });
    setRecords(newRecords);
  };

  const handleSubmit = async () => {
    setSuccess('');
    const recordsList = Object.entries(records).map(([userId, status]) => ({ userId, status }));
    if (recordsList.length === 0) {
      alert('Please mark attendance for at least one person');
      return;
    }
    try {
      await markAttendance({ records: recordsList, date });
      setSuccess('Attendance saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save attendance');
    }
  };

  const handleExportReport = () => {
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const idLabel = reportRole === 'student' ? 'Roll No' : 'Subject/Username';
    const headers = ['Name', idLabel, 'Present', 'Absent', 'Total', 'Percentage'];
    const rows = reportData.map(r => [r.name, r.designation, r.present, r.absent, r.total, r.total > 0 ? Math.round((r.present/r.total)*100)+'%' : '0%']);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_report_${monthNames[reportMonth-1]}_${reportYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const people = personTab === 'student' ? students : faculty;
  const markedCount = Object.keys(records).length;
  const presentCount = Object.values(records).filter(v => v === 'present').length;
  const absentCount = Object.values(records).filter(v => v === 'absent').length;

  return (
    <div>
      <div className="page-header">
        <h1>Attendance Management</h1>
        <p>Mark daily attendance and view attendance reports</p>
      </div>

      {/* Main tabs */}
      <div className="tabs">
        <button className={`tab-btn ${tab === 'mark' ? 'active' : ''}`} onClick={() => setTab('mark')}>
          <ClipboardCheck size={15} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Mark Attendance
        </button>
        <button className={`tab-btn ${tab === 'report' ? 'active' : ''}`} onClick={() => setTab('report')}>
          <BarChart3 size={15} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Attendance Report
        </button>
      </div>

      {success && <div className="alert alert-success"><CheckCircle size={18} /> {success}</div>}

      {tab === 'mark' && (
        <>
          {/* Sub-tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button
              className={`btn ${personTab === 'student' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setPersonTab('student')}
            >Students</button>
            <button
              className={`btn ${personTab === 'faculty' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setPersonTab('faculty')}
            >Faculty</button>
          </div>

          <div className="filters-bar">
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ marginBottom: 4, fontSize: 12 }}>Date</label>
              <input type="date" className="form-input" value={date} onChange={e => setDate(e.target.value)} style={{ minWidth: 160 }} />
            </div>
            {personTab === 'student' && (
              <>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ marginBottom: 4, fontSize: 12 }}>Standard</label>
                  <select className="form-select" value={filterStd} onChange={e => setFilterStd(e.target.value)}>
                    {STANDARDS.map(s => <option key={s} value={s}>Std {s}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ marginBottom: 4, fontSize: 12 }}>Batch</label>
                  <select className="form-select" value={filterBatch} onChange={e => setFilterBatch(e.target.value)}>
                    <option value="">All Batches</option>
                    {availableBatches.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
                  </select>
                </div>
              </>
            )}
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <button className="btn btn-success btn-sm" onClick={() => markAll('present')}>✓ All Present</button>
              <button className="btn btn-danger btn-sm" onClick={() => markAll('absent')}>✗ All Absent</button>
            </div>
          </div>

          {/* Summary bar */}
          {markedCount > 0 && (
            <div style={{
              display: 'flex', gap: 16, marginBottom: 16, padding: '12px 20px',
              background: 'white', borderRadius: 10, border: '1px solid #e2e8f0',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: 13, color: '#64748b' }}>Summary:</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#059669' }}>
                ✓ Present: {presentCount}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#dc2626' }}>
                ✗ Absent: {absentCount}
              </span>
              <span style={{ fontSize: 13, color: '#64748b' }}>
                Total: {people.length}
              </span>
              {markedCount < people.length && (
                <span style={{ fontSize: 12, color: '#d97706', background: '#fef3c7', padding: '2px 8px', borderRadius: 4 }}>
                  ⚠ {people.length - markedCount} unmarked
                </span>
              )}
            </div>
          )}

          {loading ? (
            <div className="loading-container"><div className="spinner"></div></div>
          ) : people.length === 0 ? (
            <div className="empty-state">
              <Users size={48} />
              <h3>No {personTab === 'student' ? 'students' : 'faculty'} found</h3>
              <p>{personTab === 'student' ? 'Select a standard and batch to view students' : 'No faculty members have been added yet'}</p>
            </div>
          ) : (
            <>
              <div className="attendance-grid">
                {people.map(p => (
                  <div className="attendance-item" key={p._id} style={{
                    borderColor: records[p._id] === 'present' ? '#a7f3d0' :
                                 records[p._id] === 'absent' ? '#fca5a5' : '#e2e8f0',
                    background: records[p._id] === 'present' ? '#f0fdf4' :
                                records[p._id] === 'absent' ? '#fef2f2' : 'white',
                    transition: 'all 0.2s ease'
                  }}>
                    <div>
                      <div className="student-name">{p.name}</div>
                      <div className="student-roll">{p.rollNo ? `Roll: ${p.rollNo}` : p.subject || p.username}</div>
                    </div>
                    <div className="attendance-toggle">
                      <button
                        className={records[p._id] === 'present' ? 'present' : ''}
                        onClick={() => { setRecords(prev => ({ ...prev, [p._id]: 'present' })); }}
                      >P</button>
                      <button
                        className={records[p._id] === 'absent' ? 'absent' : ''}
                        onClick={() => { setRecords(prev => ({ ...prev, [p._id]: 'absent' })); }}
                      >A</button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button className="btn btn-primary btn-lg" onClick={handleSubmit}>
                  <Save size={18} /> Save Attendance ({markedCount}/{people.length})
                </button>
              </div>
            </>
          )}
        </>
      )}

      {tab === 'report' && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button
              className={`btn ${reportRole === 'student' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setReportRole('student')}
            >Students Report</button>
            <button
              className={`btn ${reportRole === 'faculty' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setReportRole('faculty')}
            >Faculty Report</button>
          </div>

          <div className="filters-bar">
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ marginBottom: 4, fontSize: 12 }}>Month</label>
              <select className="form-select" value={reportMonth} onChange={e => setReportMonth(e.target.value)}>
                {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, i) => (
                  <option key={i} value={String(i + 1)}>{m}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ marginBottom: 4, fontSize: 12 }}>Year</label>
              <select className="form-select" value={reportYear} onChange={e => setReportYear(e.target.value)}>
                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={String(y)}>{y}</option>)}
              </select>
            </div>
            {reportRole === 'student' && (
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ marginBottom: 4, fontSize: 12 }}>Standard</label>
                <select className="form-select" value={reportStd} onChange={e => setReportStd(e.target.value)}>
                  {STANDARDS.map(s => <option key={s} value={s}>Std {s}</option>)}
                </select>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button className="btn btn-secondary btn-sm" onClick={handleExportReport} disabled={reportData.length === 0}>
                <Download size={14} /> Export CSV
              </button>
            </div>
          </div>

          {reportLoading ? (
            <div className="loading-container"><div className="spinner"></div></div>
          ) : reportData.length === 0 ? (
            <div className="empty-state">
              <BarChart3 size={48} />
              <h3>No attendance data</h3>
              <p>No attendance records found for the selected month and year</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>{reportRole === 'student' ? 'Roll No' : 'Subject'}</th>
                    <th>Present</th>
                    <th>Absent</th>
                    <th>Total Days</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((r, i) => {
                    const pct = r.total > 0 ? Math.round((r.present / r.total) * 100) : 0;
                    return (
                      <tr key={i}>
                        <td style={{ color: '#94a3b8', fontSize: 12 }}>{i + 1}</td>
                        <td style={{ fontWeight: 600 }}>{r.name}</td>
                        <td><span className="badge badge-blue">{r.designation || '—'}</span></td>
                        <td style={{ color: '#059669', fontWeight: 700 }}>{r.present}</td>
                        <td style={{ color: '#dc2626', fontWeight: 700 }}>{r.absent}</td>
                        <td>{r.total}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 60, height: 6, borderRadius: 3, background: '#f1f5f9', overflow: 'hidden' }}>
                              <div style={{
                                height: '100%', borderRadius: 3,
                                background: pct >= 75 ? '#059669' : pct >= 50 ? '#d97706' : '#dc2626',
                                width: `${pct}%`, transition: 'width 0.4s ease'
                              }} />
                            </div>
                            <span className={`badge ${pct >= 75 ? 'badge-green' : pct >= 50 ? 'badge-orange' : 'badge-red'}`}>
                              {pct}%
                            </span>
                          </div>
                        </td>
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
  );
};

export default ManageAttendance;
