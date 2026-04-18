import { useState, useEffect } from 'react';
import { getTimetable, createTimetableEntry, updateTimetableEntry, deleteTimetableEntry, getFaculty, getBatches } from '../../services/api';
import {
  Plus, Trash2, Edit2, X, CheckCircle, Calendar, Clock, Copy,
  Download, Search, List, LayoutGrid, Users, BookOpen,
  ChevronRight, AlertTriangle, Eye
} from 'lucide-react';

const STANDARDS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11 Commerce', '12 Commerce'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = [
  '7:00 AM - 8:00 AM', '8:00 AM - 9:00 AM', '9:00 AM - 10:00 AM',
  '10:00 AM - 11:00 AM', '11:00 AM - 12:00 PM', '12:00 PM - 1:00 PM',
  '1:00 PM - 2:00 PM', '2:00 PM - 3:00 PM', '3:00 PM - 4:00 PM',
  '4:00 PM - 5:00 PM', '5:00 PM - 6:00 PM', '6:00 PM - 7:00 PM',
  '7:00 PM - 8:00 PM', '8:00 PM - 9:00 PM'
];
// Standard-wise subjects (Gujarat Board curriculum)
const SUBJECTS_BY_STD = {
  '1': ['English', 'Mathematics', 'EVS (Paryavaran)'],
  '2': ['English', 'Mathematics', 'EVS (Paryavaran)'],
  '3': ['English', 'Mathematics', 'EVS (Paryavaran)'],
  '4': ['English', 'Mathematics', 'EVS (Paryavaran)'],
  '5': ['English', 'Mathematics', 'EVS (Paryavaran)'],
  '6': ['English', 'Mathematics', 'Science', 'Social Science'],
  '7': ['English', 'Mathematics', 'Science', 'Social Science'],
  '8': ['English', 'Mathematics', 'Science', 'Social Science'],
  '9': ['English', 'Mathematics', 'Science', 'Social Science'],
  '10': ['English', 'Mathematics', 'Science', 'Social Science'],
  '11': ['Accounts', 'Business Administration', 'Economics', 'Statistics', 'English'],
  '12': ['Accounts', 'Business Administration', 'Economics', 'Statistics', 'English'],
};

// Get subjects for a given standard, fallback to all
const getSubjectsForStandard = (std) => {
  if (!std) {
    // Return all unique subjects when no standard selected
    const all = new Set();
    Object.values(SUBJECTS_BY_STD).forEach(arr => arr.forEach(s => all.add(s)));
    return [...all].sort();
  }
  return SUBJECTS_BY_STD[std] || getSubjectsForStandard('');
};

const ManageTimetable = () => {
  const [entries, setEntries] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [filterStd, setFilterStd] = useState('');
  const [filterBatch, setFilterBatch] = useState('');
  const [filterDay, setFilterDay] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [showAdd, setShowAdd] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [viewDetail, setViewDetail] = useState(null);
  const [copyModal, setCopyModal] = useState(null); // { sourceDay, entries }
  const [copyTargetDay, setCopyTargetDay] = useState('');
  const [success, setSuccess] = useState('');
  const [addData, setAddData] = useState({
    day: 'Monday', time: '', subject: '', facultyId: '', standard: '', batch: ''
  });
  const [editData, setEditData] = useState({
    day: '', time: '', subject: '', facultyId: '', standard: '', batch: ''
  });

  const [availableBatches, setAvailableBatches] = useState([]);
  const [addBatches, setAddBatches] = useState([]);
  const [editBatches, setEditBatches] = useState([]);

  useEffect(() => {
    if (filterStd) getBatches({ standard: filterStd }).then(res => setAvailableBatches(res.data)).catch(console.error);
    else setAvailableBatches([]);
  }, [filterStd]);

  useEffect(() => {
    if (addData.standard) getBatches({ standard: addData.standard }).then(res => setAddBatches(res.data)).catch(console.error);
    else setAddBatches([]);
  }, [addData.standard]);

  useEffect(() => {
    if (editData.standard) getBatches({ standard: editData.standard }).then(res => setEditBatches(res.data)).catch(console.error);
    else setEditBatches([]);
  }, [editData.standard]);

  useEffect(() => { loadEntries(); loadFaculty(); }, [filterStd, filterBatch]);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const params = { type: 'lecture' };
      if (filterStd) params.standard = filterStd;
      if (filterBatch) params.batch = filterBatch;
      const res = await getTimetable(params);
      setEntries(res.data);
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
      await createTimetableEntry({
        ...addData,
        type: 'lecture',
        facultyName: facultyMember?.name || ''
      });
      setShowAdd(false);
      setAddData({ day: 'Monday', time: '', subject: '', facultyId: '', standard: '', batch: '' });
      setSuccess('Entry added successfully!');
      setTimeout(() => setSuccess(''), 3000);
      loadEntries();
    } catch (err) { alert(err.response?.data?.message || 'Failed to add entry'); }
  };

  const handleEdit = (entry) => {
    setEditData({
      day: entry.day,
      time: entry.time,
      subject: entry.subject,
      facultyId: entry.facultyId?._id || entry.facultyId || '',
      standard: entry.standard,
      batch: entry.batch || ''
    });
    setEditModal(entry);
  };

  const handleSaveEdit = async () => {
    try {
      const facultyMember = faculty.find(f => f._id === editData.facultyId);
      await updateTimetableEntry(editModal._id, {
        ...editData,
        facultyName: facultyMember?.name || editModal.facultyName
      });
      setEditModal(null);
      setSuccess('Entry updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
      loadEntries();
    } catch (err) { alert(err.response?.data?.message || 'Update failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this timetable entry?')) return;
    try {
      await deleteTimetableEntry(id);
      setEntries(prev => prev.filter(e => e._id !== id));
      setSuccess('Entry deleted');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { alert('Delete failed'); }
  };

  const handleCopyDay = async () => {
    if (!copyModal || !copyTargetDay) return;
    if (copyTargetDay === copyModal.sourceDay) {
      alert('Cannot copy to the same day');
      return;
    }
    try {
      let count = 0;
      for (const entry of copyModal.entries) {
        const facultyMember = faculty.find(f => f._id === (entry.facultyId?._id || entry.facultyId));
        await createTimetableEntry({
          day: copyTargetDay,
          time: entry.time,
          subject: entry.subject,
          facultyId: entry.facultyId?._id || entry.facultyId || '',
          standard: entry.standard,
          batch: entry.batch || '',
          type: 'lecture',
          facultyName: facultyMember?.name || entry.facultyName || ''
        });
        count++;
      }
      setCopyModal(null);
      setCopyTargetDay('');
      setSuccess(`Copied ${count} entries to ${copyTargetDay}!`);
      setTimeout(() => setSuccess(''), 3000);
      loadEntries();
    } catch (err) { alert('Copy failed: ' + (err.response?.data?.message || err.message)); }
  };

  const handleBulkDeleteDay = async (day) => {
    const dayEntries = entries.filter(e => e.day === day);
    if (dayEntries.length === 0) return;
    if (!window.confirm(`Delete ALL ${dayEntries.length} entries for ${day}?`)) return;
    try {
      for (const entry of dayEntries) {
        await deleteTimetableEntry(entry._id);
      }
      setSuccess(`Deleted ${dayEntries.length} entries from ${day}`);
      setTimeout(() => setSuccess(''), 3000);
      loadEntries();
    } catch (err) { alert('Delete failed'); }
  };

  const handleExportCSV = () => {
    const headers = ['Day', 'Time', 'Subject', 'Faculty', 'Standard', 'Batch'];
    const rows = filteredEntries.map(e => [
      e.day, e.time, e.subject, e.facultyName || e.facultyId?.name || '',
      e.standard, e.batch || ''
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lecture_timetable_${filterStd || 'all'}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Group entries by day
  const grouped = {};
  DAYS.forEach(d => { grouped[d] = []; });
  entries.forEach(e => {
    if (grouped[e.day]) grouped[e.day].push(e);
  });

  // Search & filter
  const filteredEntries = entries.filter(e => {
    if (filterDay && e.day !== filterDay) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (e.subject?.toLowerCase().includes(q) ||
      e.facultyName?.toLowerCase().includes(q) ||
      e.standard?.toLowerCase().includes(q));
  });

  // ====== STAT CALCULATIONS ======
  const totalEntries = entries.length;
  const todayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
  const todaysEntries = entries.filter(e => e.day === todayName);
  const uniqueSubjects = [...new Set(entries.map(e => e.subject))];
  const uniqueFaculty = [...new Set(entries.filter(e => e.facultyName || e.facultyId?.name).map(e => e.facultyName || e.facultyId?.name))];

  const uniqueStandards = [...new Set(entries.map(e => e.standard))];
  const busiestDay = DAYS.reduce((best, day) =>
    grouped[day].length > (grouped[best]?.length || 0) ? day : best, DAYS[0]);

  const dayColors = {
    'Monday': '#2563eb', 'Tuesday': '#7c3aed', 'Wednesday': '#059669',
    'Thursday': '#d97706', 'Friday': '#dc2626', 'Saturday': '#0891b2'
  };

  return (
    <div>
      {/* ====== HEADER ====== */}
      <div className="page-header">
        <div className="page-header-actions">
          <div>
            <h1>📅 Lecture Timetable</h1>
            <p>Manage weekly lecture schedule • {totalEntries} entries across {uniqueStandards.length} standards</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={handleExportCSV} disabled={entries.length === 0}>
              <Download size={16} /> Export
            </button>
            <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
              <Plus size={18} /> Add Lecture
            </button>
          </div>
        </div>
      </div>

      {success && <div className="alert alert-success"><CheckCircle size={18} /> {success}</div>}

      {/* ====== STATS OVERVIEW PANEL ====== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 24 }}>
        <div style={{ padding: '16px 20px', borderRadius: 12, background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', border: '1px solid #bfdbfe' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#2563eb15', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={18} />
            </div>
            <div style={{ fontSize: 11, color: '#1e40af', fontWeight: 600, textTransform: 'uppercase' }}>Total Lectures</div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#1e3a8a' }}>{totalEntries}</div>
          <div style={{ fontSize: 11, color: '#3b82f6', marginTop: 2 }}>{DAYS.length} days/week</div>
        </div>

        <div style={{ padding: '16px 20px', borderRadius: 12, background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1px solid #a7f3d0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#05966915', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={18} />
            </div>
            <div style={{ fontSize: 11, color: '#065f46', fontWeight: 600, textTransform: 'uppercase' }}>Today ({todayName.slice(0, 3)})</div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#065f46' }}>{todaysEntries.length}</div>
          <div style={{ fontSize: 11, color: '#059669', marginTop: 2 }}>lectures scheduled</div>
        </div>

        <div style={{ padding: '16px 20px', borderRadius: 12, background: 'linear-gradient(135deg, #ede9fe, #e0e7ff)', border: '1px solid #c4b5fd' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#7c3aed15', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={18} />
            </div>
            <div style={{ fontSize: 11, color: '#5b21b6', fontWeight: 600, textTransform: 'uppercase' }}>Subjects</div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#5b21b6' }}>{uniqueSubjects.length}</div>
          <div style={{ fontSize: 11, color: '#7c3aed', marginTop: 2 }}>{uniqueSubjects.slice(0, 3).join(', ')}{uniqueSubjects.length > 3 ? '...' : ''}</div>
        </div>

        <div style={{ padding: '16px 20px', borderRadius: 12, background: 'linear-gradient(135deg, #fef3c7, #fde68a)', border: '1px solid #fcd34d' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#d9770615', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={18} />
            </div>
            <div style={{ fontSize: 11, color: '#92400e', fontWeight: 600, textTransform: 'uppercase' }}>Faculty Assigned</div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#92400e' }}>{uniqueFaculty.length}</div>
          <div style={{ fontSize: 11, color: '#d97706', marginTop: 2 }}>teaching staff</div>
        </div>

      </div>

      {/* ====== DAY DISTRIBUTION BAR ====== */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ padding: '14px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>Schedule Distribution</span>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>Busiest: <strong style={{ color: dayColors[busiestDay] }}>{busiestDay} ({grouped[busiestDay]?.length})</strong></span>
          </div>
          <div style={{ display: 'flex', gap: 6, height: 36 }}>
            {DAYS.map(day => {
              const count = grouped[day]?.length || 0;
              const maxCount = Math.max(...DAYS.map(d => grouped[d]?.length || 0), 1);
              const heightPct = (count / maxCount) * 100;
              return (
                <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'flex-end' }}>
                    <div style={{
                      width: '100%', borderRadius: '4px 4px 0 0',
                      height: `${Math.max(heightPct, 8)}%`,
                      background: `linear-gradient(180deg, ${dayColors[day]}, ${dayColors[day]}88)`,
                      transition: 'height 0.4s ease',
                      position: 'relative',
                      cursor: 'pointer'
                    }}
                      title={`${day}: ${count} entries`}
                      onClick={() => setFilterDay(filterDay === day ? '' : day)}
                    >
                      {count > 0 && (
                        <span style={{
                          position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)',
                          fontSize: 10, fontWeight: 700, color: dayColors[day]
                        }}>{count}</span>
                      )}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 9, fontWeight: 600, color: filterDay === day ? dayColors[day] : '#94a3b8',
                    textTransform: 'uppercase', letterSpacing: '0.03em'
                  }}>{day.slice(0, 3)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ====== FILTERS & VIEW TOGGLE ====== */}
      <div className="filters-bar">
        <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input className="form-input" placeholder="Search subject, faculty..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
        </div>
        <select className="form-select" value={filterStd} onChange={e => setFilterStd(e.target.value)}>
          <option value="">All Standards</option>
          {STANDARDS.map(s => <option key={s} value={s}>Std {s}</option>)}
        </select>
        <select className="form-select" value={filterBatch} onChange={e => setFilterBatch(e.target.value)}>
          <option value="">All Batches</option>
          {availableBatches.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
        </select>
        <select className="form-select" value={filterDay} onChange={e => setFilterDay(e.target.value)}>
          <option value="">All Days</option>
          {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        {/* View toggle */}
        <div style={{ display: 'flex', gap: 2, background: '#f1f5f9', borderRadius: 8, padding: 2 }}>
          <button
            onClick={() => setViewMode('grid')}
            style={{
              padding: '6px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: viewMode === 'grid' ? 'white' : 'transparent',
              color: viewMode === 'grid' ? '#2563eb' : '#94a3b8',
              boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease'
            }}
            title="Grid View"
          ><LayoutGrid size={16} /></button>
          <button
            onClick={() => setViewMode('table')}
            style={{
              padding: '6px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: viewMode === 'table' ? 'white' : 'transparent',
              color: viewMode === 'table' ? '#2563eb' : '#94a3b8',
              boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease'
            }}
            title="Table View"
          ><List size={16} /></button>
        </div>

        {(filterStd || filterBatch || filterDay || search) && (
          <button className="btn btn-secondary btn-sm" onClick={() => { setFilterStd(''); setFilterBatch(''); setFilterDay(''); setSearch(''); }}>
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* ====== MAIN CONTENT ====== */}
      {loading ? (
        <div className="loading-container"><div className="spinner"></div></div>
      ) : entries.length === 0 && !filterStd && !filterDay ? (
        <div className="empty-state">
          <Calendar size={48} />
          <h3>No lecture schedule found</h3>
          <p>Click "Add Lecture" to create your first entry</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* ====== GRID VIEW ====== */
        <div className="timetable-grid">
          {(filterDay ? [filterDay] : DAYS).map(day => (
            <div className="timetable-day" key={day}>
              <div className="timetable-day-header" style={{
                background: `linear-gradient(135deg, ${dayColors[day]}, ${dayColors[day]}cc)`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px'
              }}>
                <span>{day} <span style={{ opacity: 0.7, fontSize: 11 }}>({grouped[day]?.length || 0})</span></span>
                {grouped[day]?.length > 0 && (
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      onClick={() => setCopyModal({ sourceDay: day, entries: grouped[day] })}
                      style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', cursor: 'pointer', padding: '2px 5px', borderRadius: 4, fontSize: 10 }}
                      title={`Copy ${day}'s schedule`}
                    ><Copy size={11} /></button>
                    <button
                      onClick={() => handleBulkDeleteDay(day)}
                      style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', cursor: 'pointer', padding: '2px 5px', borderRadius: 4, fontSize: 10 }}
                      title={`Delete all ${day} entries`}
                    ><Trash2 size={11} /></button>
                  </div>
                )}
              </div>
              {(grouped[day]?.length || 0) === 0 ? (
                <div className="timetable-slot" style={{ color: '#94a3b8', textAlign: 'center', padding: 24, fontSize: 13 }}>
                  No entries
                  <br />
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ marginTop: 8, fontSize: 11 }}
                    onClick={() => { setAddData(prev => ({ ...prev, day })); setShowAdd(true); }}
                  ><Plus size={12} /> Add</button>
                </div>
              ) : (
                grouped[day].sort((a, b) => (a.time || '').localeCompare(b.time || '')).map(entry => (
                  <div className="timetable-slot" key={entry._id} style={{
                    position: 'relative', transition: 'all 0.15s ease', cursor: 'pointer'
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}
                  >
                    <div className="slot-time">
                      <Clock size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                      {entry.time}
                    </div>
                    <div className="slot-subject">{entry.subject}</div>
                    <div className="slot-faculty">{entry.facultyName || entry.facultyId?.name || '—'}</div>
                    <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: 10, fontWeight: 600, background: '#ede9fe', color: '#5b21b6',
                        padding: '1px 6px', borderRadius: 4
                      }}>Std {entry.standard}</span>
                        <span style={{
                          fontSize: 10, fontWeight: 600, background: '#dbeafe', color: '#1e40af',
                          padding: '1px 6px', borderRadius: 4
                        }}>{entry.batch}</span>

                    </div>
                    <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                      <button onClick={(ev) => { ev.stopPropagation(); setViewDetail(entry); }}
                        style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 2 }} title="View">
                        <Eye size={12} />
                      </button>
                      <button onClick={(ev) => { ev.stopPropagation(); handleEdit(entry); }}
                        style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', padding: 2 }} title="Edit">
                        <Edit2 size={12} />
                      </button>
                      <button onClick={(ev) => { ev.stopPropagation(); handleDelete(entry._id); }}
                        style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: 2 }} title="Delete">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      ) : (
        /* ====== TABLE VIEW ====== */
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Day</th>
                <th>Time</th>
                <th>Subject</th>
                <th>Faculty</th>
                <th>Standard</th>
                <th>Batch</th>

                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.length === 0 ? (
                <tr><td colSpan="8" style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
                  <Calendar size={36} style={{ marginBottom: 8, opacity: 0.3 }} /><br />No entries found
                </td></tr>
              ) : (
                filteredEntries
                  .sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || (a.time || '').localeCompare(b.time || ''))
                  .map((entry, idx) => (
                    <tr key={entry._id}>
                      <td style={{ color: '#94a3b8', fontSize: 12 }}>{idx + 1}</td>
                      <td>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          fontSize: 12, fontWeight: 700, color: dayColors[entry.day],
                          background: `${dayColors[entry.day]}12`, padding: '3px 8px', borderRadius: 6
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: dayColors[entry.day] }} />
                          {entry.day}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: '#1e293b', fontSize: 13 }}>
                        <Clock size={12} style={{ marginRight: 4, verticalAlign: 'middle', color: '#94a3b8' }} />
                        {entry.time}
                      </td>
                      <td style={{ fontWeight: 600 }}>{entry.subject}</td>
                      <td style={{ color: '#475569' }}>{entry.facultyName || entry.facultyId?.name || '—'}</td>
                      <td><span className="badge badge-purple">Std {entry.standard}</span></td>
                      <td>{entry.batch ? <span className="badge badge-blue">{entry.batch}</span> : <span style={{ color: '#cbd5e1' }}>—</span>}</td>

                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => setViewDetail(entry)} title="View"><Eye size={14} /></button>
                          <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(entry)} title="Edit"><Edit2 size={14} /></button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(entry._id)} title="Delete"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ====== VIEW DETAIL MODAL ====== */}
      {viewDetail && (
        <div className="modal-overlay" onClick={() => setViewDetail(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3>Lecture Details</h3>
              <button className="modal-close" onClick={() => setViewDetail(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div style={{
                textAlign: 'center', marginBottom: 20, padding: 20, borderRadius: 12,
                background: `linear-gradient(135deg, ${dayColors[viewDetail.day]}15, ${dayColors[viewDetail.day]}08)`
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: dayColors[viewDetail.day], textTransform: 'uppercase', marginBottom: 4 }}>{viewDetail.day}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>{viewDetail.subject}</div>
                <div style={{ fontSize: 14, color: '#64748b' }}><Clock size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />{viewDetail.time}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Faculty', value: viewDetail.facultyName || viewDetail.facultyId?.name || '—', icon: <Users size={13} /> },
                  { label: 'Standard', value: `Std ${viewDetail.standard}`, icon: <BookOpen size={13} /> },
                  { label: 'Batch', value: viewDetail.batch ? `Batch ${viewDetail.batch}` : 'All', icon: <Copy size={13} /> },
                ].map((item, i) => (
                  <div key={i} style={{ padding: '10px 14px', borderRadius: 8, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                      {item.icon} {item.label}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setViewDetail(null)}>Close</button>
              <button className="btn btn-primary" onClick={() => { setViewDetail(null); handleEdit(viewDetail); }}>
                <Edit2 size={14} /> Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== COPY DAY MODAL ====== */}
      {copyModal && (
        <div className="modal-overlay" onClick={() => setCopyModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h3><Copy size={18} style={{ marginRight: 8 }} /> Copy {copyModal.sourceDay}'s Schedule</h3>
              <button className="modal-close" onClick={() => setCopyModal(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="alert alert-info">
                Copying {copyModal.entries.length} entries from <strong>{copyModal.sourceDay}</strong> to another day.
              </div>
              <div className="form-group">
                <label className="form-label">Copy To Day *</label>
                <select className="form-select" value={copyTargetDay} onChange={e => setCopyTargetDay(e.target.value)} required>
                  <option value="">Select Target Day</option>
                  {DAYS.filter(d => d !== copyModal.sourceDay).map(d => (
                    <option key={d} value={d}>{d} ({grouped[d]?.length || 0} existing)</option>
                  ))}
                </select>
              </div>
              {copyTargetDay && grouped[copyTargetDay]?.length > 0 && (
                <div className="alert alert-warning" style={{ fontSize: 13 }}>
                  <AlertTriangle size={16} /> {copyTargetDay} already has {grouped[copyTargetDay].length} entries. New entries will be added alongside existing ones.
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setCopyModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCopyDay} disabled={!copyTargetDay}>
                <Copy size={14} /> Copy {copyModal.entries.length} Entries
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== ADD MODAL ====== */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h3><Plus size={18} style={{ marginRight: 8 }} /> Add Lecture Entry</h3>
              <button className="modal-close" onClick={() => setShowAdd(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Day *</label>
                    <select className="form-select" value={addData.day} onChange={e => setAddData({ ...addData, day: e.target.value })} required>
                      {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Time Slot *</label>
                    <select className="form-select" value={addData.time} onChange={e => setAddData({ ...addData, time: e.target.value })} required>
                      <option value="">Select Time</option>
                      {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                      <option value="__custom">Custom Time...</option>
                    </select>
                  </div>
                </div>
                {addData.time === '__custom' && (
                  <div className="form-group">
                    <label className="form-label">Custom Time *</label>
                    <input className="form-input" placeholder="e.g. 10:30 AM - 11:30 AM"
                      onChange={e => setAddData({ ...addData, time: e.target.value })} required />
                  </div>
                )}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Standard *</label>
                    <select className="form-select" value={addData.standard} onChange={e => {
                      const newStd = e.target.value;
                      const availableSubjects = getSubjectsForStandard(newStd);
                      setAddData(prev => ({
                        ...prev,
                        standard: newStd,
                        subject: availableSubjects.includes(prev.subject) ? prev.subject : ''
                      }));
                    }} required>
                      <option value="">Select Standard</option>
                      {STANDARDS.map(s => <option key={s} value={s}>Std {s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Subject *{addData.standard && <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: 11 }}> — Std {addData.standard}</span>}</label>
                    <select className="form-select" value={addData.subject} onChange={e => setAddData({ ...addData, subject: e.target.value })} required
                      style={{ borderColor: !addData.standard ? '#fcd34d' : undefined }}
                    >
                      <option value="">{addData.standard ? 'Select Subject' : '← Select Standard first'}</option>
                      {getSubjectsForStandard(addData.standard).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {!addData.standard && <div className="form-help" style={{ color: '#d97706' }}>Choose a standard first to see its subjects</div>}
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Faculty</label>
                    <select className="form-select" value={addData.facultyId} onChange={e => setAddData({ ...addData, facultyId: e.target.value })}>
                      <option value="">Select Faculty</option>
                      {faculty.map(f => <option key={f._id} value={f._id}>{f.name} ({f.subject || 'N/A'})</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Batch</label>
                    <select className="form-select" value={addData.batch} onChange={e => setAddData({ ...addData, batch: e.target.value })}>
                      <option value="">All Batches</option>
                      {addBatches.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
                    </select>
                  </div>
                </div>


                {/* Preview */}
                {addData.subject && addData.time && addData.standard && (
                  <div style={{
                    padding: 14, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0',
                    marginTop: 4
                  }}>
                    <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Preview</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <div style={{
                        width: 4, height: 40, borderRadius: 2,
                        background: dayColors[addData.day]
                      }} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>{addData.subject}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>
                          {addData.day} • {addData.time === '__custom' ? 'Custom' : addData.time} • Std {addData.standard}
                          {addData.batch ? ` • Batch ${addData.batch}` : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><Plus size={14} /> Add Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====== EDIT MODAL ====== */}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h3><Edit2 size={18} style={{ marginRight: 8 }} /> Edit Entry</h3>
              <button className="modal-close" onClick={() => setEditModal(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Day *</label>
                  <select className="form-select" value={editData.day} onChange={e => setEditData({ ...editData, day: e.target.value })}>
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Time Slot *</label>
                  <select className="form-select" value={TIME_SLOTS.includes(editData.time) ? editData.time : '__custom'} onChange={e => {
                    if (e.target.value === '__custom') return;
                    setEditData({ ...editData, time: e.target.value });
                  }}>
                    {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                    {!TIME_SLOTS.includes(editData.time) && (
                      <option value="__custom">{editData.time} (custom)</option>
                    )}
                  </select>
                  {!TIME_SLOTS.includes(editData.time) && (
                    <input className="form-input" value={editData.time} onChange={e => setEditData({ ...editData, time: e.target.value })} style={{ marginTop: 6 }} />
                  )}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Standard</label>
                  <select className="form-select" value={editData.standard} onChange={e => {
                    const newStd = e.target.value;
                    const availableSubjects = getSubjectsForStandard(newStd);
                    setEditData(prev => ({
                      ...prev,
                      standard: newStd,
                      subject: availableSubjects.includes(prev.subject) ? prev.subject : ''
                    }));
                  }}>
                    <option value="">Select</option>
                    {STANDARDS.map(s => <option key={s} value={s}>Std {s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Subject{editData.standard && <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: 11 }}> — Std {editData.standard}</span>}</label>
                  {(() => {
                    const stdSubjects = getSubjectsForStandard(editData.standard);
                    const isCustom = editData.subject && !stdSubjects.includes(editData.subject);
                    return (
                      <>
                        <select className="form-select" value={isCustom ? '__custom' : editData.subject} onChange={e => {
                          if (e.target.value === '__custom') {
                            setEditData({ ...editData, subject: '' });
                          } else {
                            setEditData({ ...editData, subject: e.target.value });
                          }
                        }}>
                          <option value="">Select Subject</option>
                          {stdSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                          <option value="__custom">✏️ Custom Subject...</option>
                        </select>
                        {(isCustom || editData.subject === '') && editData.subject !== '' && (
                          <input className="form-input" value={editData.subject} onChange={e => setEditData({ ...editData, subject: e.target.value })} style={{ marginTop: 6 }} placeholder="Type custom subject name" />
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Faculty</label>
                  <select className="form-select" value={editData.facultyId} onChange={e => setEditData({ ...editData, facultyId: e.target.value })}>
                    <option value="">Select Faculty</option>
                    {faculty.map(f => <option key={f._id} value={f._id}>{f.name} ({f.subject || 'N/A'})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Batch</label>
                  <select className="form-select" value={editData.batch} onChange={e => setEditData({ ...editData, batch: e.target.value })}>
                    <option value="">All Batches</option>
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

export default ManageTimetable;
