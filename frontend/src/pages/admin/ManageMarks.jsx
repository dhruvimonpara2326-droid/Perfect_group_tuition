import { useState, useEffect } from 'react';
import { getStudents, addMarks, getMarks, updateMarks, deleteMarks, getBatches } from '../../services/api';
import { Plus, Trash2, Edit2, X, CheckCircle, Search, Download, Award, ChevronLeft, ChevronRight } from 'lucide-react';

const STANDARDS = ['1','2','3','4','5','6','7','8','9','10','11 Commerce','12 Commerce'];
const EXAM_TYPES = [
  { value: 'unit_test', label: 'Unit Test' }
];

// Standard-wise subjects (Gujarat Board curriculum)
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

const getSubjectsForStandard = (std) => {
  if (!std) {
    const all = new Set();
    Object.values(SUBJECTS_BY_STD).forEach(arr => arr.forEach(s => all.add(s)));
    return [...all].sort();
  }
  return SUBJECTS_BY_STD[std] || getSubjectsForStandard('');
};

const formatDate = (d) => { if (!d) return '—'; const parts = d.split('-'); return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : d; };

const ManageMarks = () => {
  const [marks, setMarks] = useState([]);
  const [students, setStudents] = useState([]);
  const [filterStd, setFilterStd] = useState('1');
  const [filterExam, setFilterExam] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [search, setSearch] = useState('');
  const [listType, setListType] = useState('current'); // 'current' | 'past'
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [success, setSuccess] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 20;

  const [bulkSetup, setBulkSetup] = useState({
    standard: '', batch: '', subject: '', examType: 'unit_test', totalMarks: 100, date: new Date().toISOString().split('T')[0]
  });
  const [bulkMarks, setBulkMarks] = useState({});
  const [availableBatches, setAvailableBatches] = useState([]);
  const [filterBatch, setFilterBatch] = useState('');
  const [filterAvailableBatches, setFilterAvailableBatches] = useState([]);

  const [editData, setEditData] = useState({
    subject: '', examType: '', totalMarks: 0, obtainedMarks: 0, date: '', remarks: ''
  });

  useEffect(() => {
    if (filterStd) getBatches({ standard: filterStd }).then(res => setFilterAvailableBatches(res.data)).catch(console.error);
    else setFilterAvailableBatches([]);
    setFilterBatch('');
  }, [filterStd]);

  useEffect(() => { loadMarks(); }, [filterStd, filterExam, filterSubject, filterBatch]);

  const loadMarks = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStd) params.standard = filterStd;
      if (filterBatch) params.batch = filterBatch;
      if (filterExam) params.examType = filterExam;
      if (filterSubject) params.subject = filterSubject;
      const res = await getMarks(params);
      setMarks(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleBulkSetupChange = async (field, value) => {
    const updatedSetup = { ...bulkSetup, [field]: value };
    if (field === 'standard') {
       const availableSubjects = getSubjectsForStandard(value);
       updatedSetup.subject = availableSubjects.includes(updatedSetup.subject) ? updatedSetup.subject : '';
    }
    setBulkSetup(updatedSetup);

    if (updatedSetup.standard) {
      if (field === 'standard') {
         try {
            const batchRes = await getBatches({ standard: updatedSetup.standard });
            setAvailableBatches(batchRes.data);
         } catch(err) { console.error(err); }
      }
      try {
        const params = { standard: updatedSetup.standard };
        if (updatedSetup.batch) params.batch = updatedSetup.batch;
        const res = await getStudents(params);
        setStudents(res.data);
        const initialMarks = {};
        res.data.forEach(s => {
          initialMarks[s._id] = { obtained: '', remarks: '' };
        });
        setBulkMarks(initialMarks);
      } catch (err) { console.error(err); }
    } else {
      setStudents([]);
      setBulkMarks({});
    }
  };

  const handleAddBulk = async (e) => {
    e.preventDefault();
    if (!bulkSetup.standard || !bulkSetup.subject) {
      alert('Please select standard and subject'); return;
    }
    
    const validEntries = students.filter(s => bulkMarks[s._id]?.obtained !== '').map(s => ({
      studentId: s._id,
      standard: bulkSetup.standard,
      batch: bulkSetup.batch,
      subject: bulkSetup.subject,
      examType: bulkSetup.examType,
      totalMarks: bulkSetup.totalMarks,
      obtainedMarks: Number(bulkMarks[s._id].obtained),
      date: bulkSetup.date,
      remarks: bulkMarks[s._id].remarks
    }));

    if (validEntries.length === 0) {
      alert('Please enter marks for at least one student. (Leave empty if student was absent/not taken)'); return;
    }

    if (validEntries.some(e => e.obtainedMarks < 0 || e.obtainedMarks > e.totalMarks)) {
      alert('Obtained marks cannot be negative or greater than total marks'); return;
    }

    try {
      setLoading(true);
      await Promise.all(validEntries.map(entry => addMarks(entry)));
      setShowAdd(false);
      setSuccess(`Marks added successfully for ${validEntries.length} students!`);
      setTimeout(() => setSuccess(''), 3000);
      setBulkSetup({ standard: '', batch: '', subject: '', examType: 'unit_test', totalMarks: 100, date: new Date().toISOString().split('T')[0] });
      setStudents([]);
      setBulkMarks({});
      setAvailableBatches([]);
      loadMarks();
    } catch (err) { 
      setLoading(false);
      alert(err.response?.data?.message || 'Failed to add marks'); 
    }
  };

  const handleEdit = (m) => {
    setEditData({
      subject: m.subject,
      examType: m.examType,
      totalMarks: m.totalMarks,
      obtainedMarks: m.obtainedMarks,
      date: m.date || '',
      remarks: m.remarks || ''
    });
    setEditModal(m);
  };

  const handleSaveEdit = async () => {
    if (Number(editData.obtainedMarks) < 0 || Number(editData.totalMarks) < 0) {
      alert('Marks cannot be negative.');
      return;
    }
    if (Number(editData.obtainedMarks) > Number(editData.totalMarks)) {
      alert('Obtained marks cannot be greater than total marks');
      return;
    }
    try {
      await updateMarks(editModal._id, editData);
      setEditModal(null);
      setSuccess('Marks updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
      loadMarks();
    } catch (err) { alert(err.response?.data?.message || 'Update failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this marks record?')) return;
    try {
      await deleteMarks(id);
      setMarks(prev => prev.filter(m => m._id !== id));
      setSuccess('Record deleted');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { alert('Delete failed'); }
  };

  const handleExport = () => {
    const headers = ['Student', 'Roll No', 'Standard', 'Subject', 'Exam', 'Obtained', 'Total', '%', 'Date', 'Remarks'];
    const rows = filtered.map(m => {
      const pct = Math.round((m.obtainedMarks / m.totalMarks) * 100);
      return [m.studentId?.name || '', m.studentId?.rollNo || '', m.standard, m.subject, getExamLabel(m.examType), m.obtainedMarks, m.totalMarks, pct + '%', m.date || '', m.remarks || ''];
    });
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marks_${filterStd || 'all'}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getExamLabel = (val) => EXAM_TYPES.find(e => e.value === val)?.label || val;

  // 1. First, partition all marks into Current vs Past logically
  const sortedDesc = [...marks].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  
  const currentMarks = [];
  const pastMarks = [];
  const seenMap = new Set();

  sortedDesc.forEach(m => {
     const studentId = m.studentId?._id || m.studentId;
     const key = `${studentId}_${m.subject}`;
     if (!seenMap.has(key)) {
         seenMap.add(key);
         currentMarks.push(m);
     } else {
         pastMarks.push(m);
     }
  });

  const selectedMarks = listType === 'current' ? currentMarks : pastMarks;

  // 2. Now heavily apply UI filters like Search & Date only to the final list
  const filtered = selectedMarks.filter(m => {
    if (listType === 'past' && filterDate && m.date !== filterDate) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (m.studentId?.name?.toLowerCase().includes(q) ||
            m.subject?.toLowerCase().includes(q) ||
            m.studentId?.rollNo?.includes(q));
  });

  // Stats
  const totalRecords = filtered.length;
  const avgPercent = totalRecords > 0
    ? Math.round(filtered.reduce((sum, m) => sum + (m.obtainedMarks / m.totalMarks) * 100, 0) / totalRecords)
    : 0;
  const above70 = filtered.filter(m => (m.obtainedMarks / m.totalMarks) * 100 >= 70).length;
  const below40 = filtered.filter(m => (m.obtainedMarks / m.totalMarks) * 100 < 40).length;

  // Pagination
  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  useEffect(() => { setCurrentPage(1); }, [search, filterStd, filterBatch, filterExam, filterSubject, filterDate, listType]);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-actions">
          <div>
            <h1>Manage Marks</h1>
            <p>Add, edit and track student marks and results</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={handleExport} disabled={filtered.length === 0}>
              <Download size={16} /> Export
            </button>
            <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus size={18} /> Add Marks</button>
          </div>
        </div>
      </div>

      {success && <div className="alert alert-success"><CheckCircle size={18} /> {success}</div>}

      {/* Stats summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <div style={{ padding: '14px 18px', borderRadius: 10, background: 'white', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Total Records</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1e293b' }}>{totalRecords}</div>
        </div>
        <div style={{ padding: '14px 18px', borderRadius: 10, background: 'white', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Avg Score</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#2563eb' }}>{avgPercent}%</div>
        </div>
        <div style={{ padding: '14px 18px', borderRadius: 10, background: '#f0fdf4', border: '1px solid #a7f3d0' }}>
          <div style={{ fontSize: 11, color: '#065f46', fontWeight: 600, textTransform: 'uppercase' }}>Above 70%</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#059669' }}>{above70}</div>
        </div>
        <div style={{ padding: '14px 18px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fca5a5' }}>
          <div style={{ fontSize: 11, color: '#991b1b', fontWeight: 600, textTransform: 'uppercase' }}>Below 40%</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#dc2626' }}>{below40}</div>
        </div>
      </div>

      <div className="filters-bar">
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input className="form-input" placeholder="Search by student name or roll no..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
        </div>
        <select className="form-select" value={filterStd} onChange={e => setFilterStd(e.target.value)}>
          {STANDARDS.map(s => <option key={s} value={s}>Std {s}</option>)}
        </select>
        <select className="form-select" value={filterBatch} onChange={e => setFilterBatch(e.target.value)}>
          <option value="">All Batches</option>
          {filterAvailableBatches.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
        </select>
        <select className="form-select" value={filterExam} onChange={e => setFilterExam(e.target.value)}>
          <option value="">All Exams</option>
          {EXAM_TYPES.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
        </select>
        {listType === 'past' && (
          <input 
            type="date" 
            className="form-input" 
            value={filterDate} 
            onChange={e => setFilterDate(e.target.value)} 
          />
        )}
        {(filterStd || filterBatch || filterExam || filterSubject || search || filterDate) && (
          <button className="btn btn-secondary btn-sm" onClick={() => { setFilterStd(''); setFilterBatch(''); setFilterExam(''); setFilterSubject(''); setSearch(''); setFilterDate(''); }}>
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* Tabs for Current / Past */}
      <div className="tabs" style={{ marginBottom: 16 }}>
        <button 
          className={`tab-btn ${listType === 'current' ? 'active' : ''}`} 
          onClick={() => setListType('current')}
        >
          Latest Marks (Current)
        </button>
        <button 
          className={`tab-btn ${listType === 'past' ? 'active' : ''}`} 
          onClick={() => setListType('past')}
        >
          Past Exams (History)
        </button>
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
                  <th>Student</th>
                  <th>Standard</th>
                  <th>Subject</th>
                  <th>Exam</th>
                  <th>Obtained</th>
                  <th>Total</th>
                  <th>%</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan="10" style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
                    <Award size={36} style={{ marginBottom: 8, opacity: 0.3 }} /><br />No marks records found
                  </td></tr>
                ) : paginated.map((m, idx) => {
                  const pct = Math.round((m.obtainedMarks / m.totalMarks) * 100);
                  return (
                    <tr key={m._id}>
                      <td style={{ color: '#94a3b8', fontSize: 12 }}>{(currentPage - 1) * perPage + idx + 1}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{m.studentId?.name || '—'}</div>
                        {m.studentId?.rollNo && <div style={{ fontSize: 11, color: '#94a3b8' }}>Roll: {m.studentId.rollNo}</div>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          <span className="badge badge-purple">Std {m.standard}</span>
                          {m.batch && <span className="badge badge-blue" style={{ fontSize: 10 }}>Batch {m.batch}</span>}
                        </div>
                      </td>
                      <td style={{ fontWeight: 500 }}>{m.subject}</td>
                      <td><span className="badge badge-blue">{getExamLabel(m.examType)}</span></td>
                      <td style={{ fontWeight: 700 }}>{m.obtainedMarks}</td>
                      <td>{m.totalMarks}</td>
                      <td>
                        <span className={`badge ${pct >= 70 ? 'badge-green' : pct >= 40 ? 'badge-orange' : 'badge-red'}`}>
                          {pct}%
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: '#64748b' }}>{formatDate(m.date)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(m)}><Edit2 size={14} /></button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(m._id)}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginTop: 16, padding: '12px 16px', background: 'white', borderRadius: 8, border: '1px solid #e2e8f0'
            }}>
              <span style={{ fontSize: 13, color: '#64748b' }}>
                Showing {(currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, filtered.length)} of {filtered.length}
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

      {/* Add Marks Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 800, width: '95%' }}>
            <div className="modal-header">
              <h3>Bulk Add Marks</h3>
              <button className="modal-close" onClick={() => setShowAdd(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddBulk}>
              <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Standard *</label>
                    <select className="form-select" value={bulkSetup.standard} onChange={e => handleBulkSetupChange('standard', e.target.value)} required>
                      <option value="">Select Standard</option>
                      {STANDARDS.map(s => <option key={s} value={s}>Std {s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Batch</label>
                    <select className="form-select" value={bulkSetup.batch} onChange={e => handleBulkSetupChange('batch', e.target.value)} disabled={!bulkSetup.standard}>
                      <option value="">{bulkSetup.standard ? 'All Batches' : 'Select Standard First'}</option>
                      {availableBatches.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Subject *</label>
                    <select className="form-select" value={bulkSetup.subject} onChange={e => handleBulkSetupChange('subject', e.target.value)} required
                      style={{ borderColor: !bulkSetup.standard ? '#fcd34d' : undefined }}
                    >
                      <option value="">{bulkSetup.standard ? 'Select Subject' : '← Select Standard first'}</option>
                      {getSubjectsForStandard(bulkSetup.standard).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Exam Type *</label>
                    <select className="form-select" value={bulkSetup.examType} onChange={e => setBulkSetup({...bulkSetup, examType: e.target.value})}>
                      {EXAM_TYPES.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Total Marks *</label>
                    <input type="number" className="form-input" value={bulkSetup.totalMarks} onChange={e => setBulkSetup({...bulkSetup, totalMarks: Number(e.target.value)})} required min="1" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date *</label>
                    <input type="date" className="form-input" value={bulkSetup.date} onChange={e => setBulkSetup({...bulkSetup, date: e.target.value})} required />
                  </div>
                </div>

                {bulkSetup.standard && students.length > 0 && (
                  <div style={{ marginTop: 20 }}>
                    <div style={{ background: '#f8fafc', padding: '10px 15px', borderRadius: '8px 8px 0 0', border: '1px solid #e2e8f0', borderBottom: 'none', fontWeight: 600, color: '#1e293b' }}>
                      Enter Student Marks
                    </div>
                    <table className="data-table" style={{ borderTopRadius: 0, marginTop: 0 }}>
                      <thead style={{ background: '#f1f5f9' }}>
                        <tr>
                          <th style={{ width: 60 }}>Roll</th>
                          <th>Student Name</th>
                          <th style={{ width: 140 }}>Obtained</th>
                          <th>Remarks (Opt)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map(s => (
                          <tr key={s._id}>
                            <td style={{ color: '#64748b', fontWeight: 600 }}>{s.rollNo}</td>
                            <td style={{ fontWeight: 500 }}>{s.name}</td>
                            <td>
                              <input type="number" className="form-input" placeholder="Absent/Leave blank" min="0" max={bulkSetup.totalMarks}
                                value={bulkMarks[s._id]?.obtained !== undefined ? bulkMarks[s._id].obtained : ''}
                                onChange={e => setBulkMarks(prev => ({ ...prev, [s._id]: { ...prev[s._id], obtained: e.target.value } }))}
                                style={{ padding: '6px 10px', height: '36px', width: '100%' }}
                              />
                            </td>
                            <td>
                              <input type="text" className="form-input" placeholder="Remarks..."
                                value={bulkMarks[s._id]?.remarks || ''}
                                onChange={e => setBulkMarks(prev => ({ ...prev, [s._id]: { ...prev[s._id], remarks: e.target.value } }))}
                                style={{ padding: '6px 10px', height: '36px', width: '100%' }}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {bulkSetup.standard && students.length === 0 && (
                   <div style={{ padding: 20, textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: 8, border: '1px dashed #cbd5e1', marginTop: 16 }}>
                     No students found in this standard.
                   </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save All Marks'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Marks Modal */}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h3>Edit Marks — {editModal.studentId?.name}</h3>
              <button className="modal-close" onClick={() => setEditModal(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Subject{editModal?.standard && <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: 11 }}> — Std {editModal.standard}</span>}</label>
                  <select className="form-select" value={editData.subject} onChange={e => setEditData({...editData, subject: e.target.value})}>
                    <option value="">Select Subject</option>
                    {getSubjectsForStandard(editModal?.standard).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Exam Type</label>
                  <select className="form-select" value={editData.examType} onChange={e => setEditData({...editData, examType: e.target.value})}>
                    {EXAM_TYPES.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Total Marks</label>
                  <input type="number" className="form-input" value={editData.totalMarks} onChange={e => setEditData({...editData, totalMarks: Number(e.target.value)})} min="1" />
                </div>
                <div className="form-group">
                  <label className="form-label">Obtained Marks</label>
                  <input type="number" className="form-input" value={editData.obtainedMarks} onChange={e => setEditData({...editData, obtainedMarks: Number(e.target.value)})} min="0" />
                </div>
              </div>
              {editData.totalMarks > 0 && (
                <div style={{ padding: '8px 12px', borderRadius: 8, background: '#f8fafc', marginBottom: 16, textAlign: 'center' }}>
                  <span style={{ fontSize: 13, color: '#64748b' }}>Score: </span>
                  <span style={{
                    fontSize: 16, fontWeight: 800,
                    color: (editData.obtainedMarks / editData.totalMarks) * 100 >= 70 ? '#059669' :
                           (editData.obtainedMarks / editData.totalMarks) * 100 >= 40 ? '#d97706' : '#dc2626'
                  }}>
                    {Math.round((editData.obtainedMarks / editData.totalMarks) * 100)}%
                  </span>
                </div>
              )}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input type="date" className="form-input" value={editData.date} onChange={e => setEditData({...editData, date: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Remarks</label>
                  <input className="form-input" value={editData.remarks} onChange={e => setEditData({...editData, remarks: e.target.value})} />
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

export default ManageMarks;
