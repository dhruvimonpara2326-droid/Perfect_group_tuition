import { useState, useEffect } from 'react';
import { getFees, addFeeRecord, recordPayment, notifyDueFees, getStudents, getBatches } from '../../services/api';
import { Plus, IndianRupee, Bell, X, CheckCircle, Search, Download, Eye, History, ChevronLeft, ChevronRight } from 'lucide-react';

const STANDARDS = ['1','2','3','4','5','6','7','8','9','10','11 Commerce','12 Commerce'];

const formatDate = (d) => { if (!d) return '—'; try { const dt = new Date(d); return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`; } catch { return d; } };

const ManageFees = () => {
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterStd, setFilterStd] = useState('1');
  const [filterBatch, setFilterBatch] = useState('');
  const [availableBatches, setAvailableBatches] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showPay, setShowPay] = useState(null);
  const [showHistory, setShowHistory] = useState(null);
  const [success, setSuccess] = useState('');
  const [addData, setAddData] = useState({ studentId: '', totalAmount: '' });
  const [payData, setPayData] = useState({ amount: '', method: 'cash', note: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 15;

  useEffect(() => {
    if (filterStd) getBatches({ standard: filterStd }).then(res => setAvailableBatches(res.data)).catch(console.error);
    else setAvailableBatches([]);
    setFilterBatch('');
  }, [filterStd]);

  useEffect(() => { loadFees(); }, [filterStatus, filterStd, filterBatch]);

  const loadFees = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterStd) params.standard = filterStd;
      if (filterBatch) params.batch = filterBatch;
      const res = await getFees(params);
      setFees(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadStudentsForAdd = async () => {
    try {
      const res = await getStudents({});
      setStudents(res.data);
    } catch (err) { console.error(err); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const student = students.find(s => s._id === addData.studentId);
      await addFeeRecord({
        studentId: addData.studentId,
        totalAmount: Number(addData.totalAmount),
        standard: student?.standard,
        batch: student?.batch
      });
      setShowAdd(false);
      setAddData({ studentId: '', totalAmount: '' });
      setSuccess('Fee record added!');
      setTimeout(() => setSuccess(''), 3000);
      loadFees();
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const handlePay = async (e) => {
    e.preventDefault();
    const amount = Number(payData.amount);
    if (amount <= 0) { alert('Enter a valid amount'); return; }
    if (amount > showPay.dueAmount) { alert(`Amount cannot exceed due amount (₹${showPay.dueAmount})`); return; }
    try {
      await recordPayment(showPay._id, { amount, method: payData.method, note: payData.note });
      setShowPay(null);
      setPayData({ amount: '', method: 'cash', note: '' });
      setSuccess('Payment recorded successfully!');
      setTimeout(() => setSuccess(''), 3000);
      loadFees();
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const handleNotify = async () => {
    if (!window.confirm('Send fee due notifications to all students with pending fees?')) return;
    try {
      const res = await notifyDueFees();
      setSuccess(res.data.message);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) { alert('Failed to send notifications'); }
  };

  const handleExport = () => {
    const headers = ['Student', 'Roll No', 'Standard', 'Batch', 'Total Fee', 'Paid', 'Due', 'Status'];
    const rows = filtered.map(f => [
      f.studentId?.name || '', f.studentId?.rollNo || '', f.standard || f.studentId?.standard || '',
      f.batch || f.studentId?.batch || '', f.totalAmount, f.paidAmount, f.dueAmount, f.status
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fees_${filterStatus || 'all'}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status) => {
    if (status === 'paid') return <span className="badge badge-green">✓ Paid</span>;
    if (status === 'partial') return <span className="badge badge-orange">● Partial</span>;
    return <span className="badge badge-red">⊖ Due</span>;
  };

  // Search filter
  const filtered = fees.filter(f => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (f.studentId?.name?.toLowerCase().includes(q) || f.studentId?.rollNo?.includes(q));
  });

  // Stats
  const totalCollection = filtered.reduce((sum, f) => sum + (f.paidAmount || 0), 0);
  const totalDue = filtered.reduce((sum, f) => sum + (f.dueAmount || 0), 0);
  const totalFees = filtered.reduce((sum, f) => sum + (f.totalAmount || 0), 0);
  const paidCount = filtered.filter(f => f.status === 'paid').length;
  const partialCount = filtered.filter(f => f.status === 'partial').length;
  const dueCount = filtered.filter(f => f.status === 'due').length;

  // Pagination
  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  useEffect(() => { setCurrentPage(1); }, [search, filterStatus, filterStd, filterBatch]);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-actions">
          <div>
            <h1>Manage Fees</h1>
            <p>Track and manage student fee payments ({filtered.length} records)</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={handleExport} disabled={filtered.length === 0}>
              <Download size={16} /> Export
            </button>
            <button className="btn btn-secondary" onClick={handleNotify}>
              <Bell size={16} /> Notify Due
            </button>
            <button className="btn btn-primary" onClick={() => { setShowAdd(true); loadStudentsForAdd(); }}>
              <Plus size={18} /> Add Fee Record
            </button>
          </div>
        </div>
      </div>

      {success && <div className="alert alert-success"><CheckCircle size={18} /> {success}</div>}

      {/* Fee Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
        <div style={{ padding: '16px 20px', borderRadius: 10, background: 'linear-gradient(135deg, #eff6ff, #e0e7ff)', border: '1px solid #bfdbfe' }}>
          <div style={{ fontSize: 11, color: '#1e40af', fontWeight: 600, textTransform: 'uppercase' }}>Total Fees</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1e3a8a' }}>₹{totalFees.toLocaleString()}</div>
        </div>
        <div style={{ padding: '16px 20px', borderRadius: 10, background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1px solid #a7f3d0' }}>
          <div style={{ fontSize: 11, color: '#065f46', fontWeight: 600, textTransform: 'uppercase' }}>Collected</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#059669' }}>₹{totalCollection.toLocaleString()}</div>
        </div>
        <div style={{ padding: '16px 20px', borderRadius: 10, background: 'linear-gradient(135deg, #fef2f2, #fee2e2)', border: '1px solid #fca5a5' }}>
          <div style={{ fontSize: 11, color: '#991b1b', fontWeight: 600, textTransform: 'uppercase' }}>Outstanding</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#dc2626' }}>₹{totalDue.toLocaleString()}</div>
        </div>
        <div style={{ padding: '16px 20px', borderRadius: 10, background: 'white', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Status</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <span className="badge badge-green">{paidCount} Paid</span>
            <span className="badge badge-orange">{partialCount} Partial</span>
            <span className="badge badge-red">{dueCount} Due</span>
          </div>
        </div>
      </div>

      {/* Collection progress bar */}
      {totalFees > 0 && (
        <div style={{ marginBottom: 20, padding: '12px 20px', background: 'white', borderRadius: 10, border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
            <span style={{ color: '#64748b' }}>Fee Collection Progress</span>
            <span style={{ fontWeight: 700, color: '#059669' }}>{Math.round((totalCollection / totalFees) * 100)}%</span>
          </div>
          <div style={{ height: 10, borderRadius: 5, background: '#fee2e2', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 5,
              background: 'linear-gradient(90deg, #059669, #34d399)',
              width: `${(totalCollection / totalFees) * 100}%`,
              transition: 'width 0.6s ease'
            }} />
          </div>
        </div>
      )}

      <div className="filters-bar">
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input className="form-input" placeholder="Search by student name or roll no..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
        </div>
        <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="paid">Paid</option>
          <option value="partial">Partial</option>
          <option value="due">Due</option>
        </select>
        <select className="form-select" value={filterStd} onChange={e => setFilterStd(e.target.value)}>
          {STANDARDS.map(s => <option key={s} value={s}>Std {s}</option>)}
        </select>
        <select className="form-select" value={filterBatch} onChange={e => setFilterBatch(e.target.value)}>
          <option value="">All Batches</option>
          {availableBatches.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
        </select>
        {(filterStatus || filterStd || filterBatch || search) && (
          <button className="btn btn-secondary btn-sm" onClick={() => { setFilterStatus(''); setFilterStd(''); setFilterBatch(''); setSearch(''); }}>
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
                  <th>Student</th>
                  <th>Standard</th>
                  <th>Total Fee</th>
                  <th>Paid</th>
                  <th>Due</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan="8" style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
                    <IndianRupee size={36} style={{ marginBottom: 8, opacity: 0.3 }} /><br />No fee records found
                  </td></tr>
                ) : paginated.map((f, idx) => (
                  <tr key={f._id}>
                    <td style={{ color: '#94a3b8', fontSize: 12 }}>{(currentPage - 1) * perPage + idx + 1}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{f.studentId?.name || '—'}</div>
                      {f.studentId?.rollNo && <div style={{ fontSize: 11, color: '#94a3b8' }}>Roll: {f.studentId.rollNo}</div>}
                    </td>
                    <td><span className="badge badge-purple">Std {f.standard || f.studentId?.standard || '—'}</span></td>
                    <td style={{ fontWeight: 700 }}>₹{f.totalAmount?.toLocaleString()}</td>
                    <td style={{ color: '#059669', fontWeight: 600 }}>₹{f.paidAmount?.toLocaleString()}</td>
                    <td style={{ color: f.dueAmount > 0 ? '#dc2626' : '#059669', fontWeight: 600 }}>₹{f.dueAmount?.toLocaleString()}</td>
                    <td>{getStatusBadge(f.status)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {f.payments && f.payments.length > 0 && (
                          <button className="btn btn-secondary btn-sm" onClick={() => setShowHistory(f)} title="Payment History">
                            <History size={14} />
                          </button>
                        )}
                        {f.status !== 'paid' && (
                          <button className="btn btn-success btn-sm" onClick={() => setShowPay(f)} title="Record Payment">
                            <IndianRupee size={14} /> Pay
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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

      {/* Payment History Modal */}
      {showHistory && (
        <div className="modal-overlay" onClick={() => setShowHistory(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3>Payment History — {showHistory.studentId?.name}</h3>
              <button className="modal-close" onClick={() => setShowHistory(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20,
                padding: 16, borderRadius: 10, background: '#f8fafc'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Total Fee</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#1e293b' }}>₹{showHistory.totalAmount?.toLocaleString()}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#065f46', fontWeight: 600 }}>Paid</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#059669' }}>₹{showHistory.paidAmount?.toLocaleString()}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#991b1b', fontWeight: 600 }}>Due</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#dc2626' }}>₹{showHistory.dueAmount?.toLocaleString()}</div>
                </div>
              </div>

              {showHistory.payments && showHistory.payments.length > 0 ? (
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: '#334155' }}>Transactions</h4>
                  {showHistory.payments.map((p, i) => (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '12px 16px', borderRadius: 8, marginBottom: 8,
                      background: '#f0fdf4', border: '1px solid #d1fae5'
                    }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#059669' }}>₹{p.amount?.toLocaleString()}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>
                          {p.date ? formatDate(p.date) : '—'} • {p.method || 'Cash'}
                        </div>
                        {p.note && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Note: {p.note}</div>}
                      </div>
                      <span className="badge badge-green">#{i + 1}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: 20 }}>No payment transactions yet</div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowHistory(null)}>Close</button>
              {showHistory.status !== 'paid' && (
                <button className="btn btn-success" onClick={() => { setShowHistory(null); setShowPay(showHistory); }}>
                  <IndianRupee size={14} /> Record Payment
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Fee Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Fee Record</h3>
              <button className="modal-close" onClick={() => setShowAdd(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Student *</label>
                  <select className="form-select" value={addData.studentId} onChange={e => setAddData({...addData, studentId: e.target.value})} required>
                    <option value="">Select Student</option>
                    {students.map(s => <option key={s._id} value={s._id}>{s.rollNo} - {s.name} (Std {s.standard})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Total Fee Amount (₹) *</label>
                  <input type="number" className="form-input" value={addData.totalAmount} onChange={e => setAddData({...addData, totalAmount: e.target.value})} required placeholder="e.g. 15000" min="1" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPay && (
        <div className="modal-overlay" onClick={() => setShowPay(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Record Payment — {showPay.studentId?.name}</h3>
              <button className="modal-close" onClick={() => setShowPay(null)}><X size={18} /></button>
            </div>
            <form onSubmit={handlePay}>
              <div className="modal-body">
                <div style={{
                  padding: 16, borderRadius: 10, marginBottom: 20,
                  background: '#fef2f2', border: '1px solid #fca5a5'
                }}>
                  <div style={{ fontSize: 13, color: '#991b1b', fontWeight: 600 }}>
                    Outstanding Due: <span style={{ fontSize: 18, fontWeight: 800 }}>₹{showPay.dueAmount?.toLocaleString()}</span>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Amount (₹) *</label>
                  <input type="number" className="form-input" value={payData.amount} onChange={e => setPayData({...payData, amount: e.target.value})} required min="1" max={showPay.dueAmount} placeholder={`Max: ₹${showPay.dueAmount}`} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Payment Method</label>
                    <select className="form-select" value={payData.method} onChange={e => setPayData({...payData, method: e.target.value})}>
                      <option value="cash">Cash</option>
                      <option value="upi">UPI</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cheque">Cheque</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Note</label>
                    <input className="form-input" value={payData.note} onChange={e => setPayData({...payData, note: e.target.value})} placeholder="Optional note" />
                  </div>
                </div>
                {payData.amount && Number(payData.amount) >= showPay.dueAmount && (
                  <div className="alert alert-success" style={{ marginBottom: 0 }}>
                    <CheckCircle size={16} /> This payment will fully clear the outstanding fee!
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPay(null)}>Cancel</button>
                <button type="submit" className="btn btn-success">
                  <IndianRupee size={14} /> Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageFees;


