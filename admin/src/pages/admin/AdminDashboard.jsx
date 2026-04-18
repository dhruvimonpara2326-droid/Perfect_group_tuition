import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats, getFees, getAttendance, getMarks, getNotifications } from '../../services/api';
import {
  Users, GraduationCap, IndianRupee, ClipboardCheck,
  AlertTriangle, TrendingUp, Calendar, BookOpen, Bell,
  ArrowRight, Award, Clock, ChevronRight, BarChart3, Activity
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ totalStudents: 0, totalFaculty: 0, standardGroups: [] });
  const [feeStats, setFeeStats] = useState({ total: 0, paid: 0, due: 0, partialCount: 0, totalCollection: 0, totalDue: 0 });
  const [attendanceToday, setAttendanceToday] = useState({ present: 0, absent: 0, total: 0 });
  const [recentMarks, setRecentMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [statsRes, feesRes, attendanceRes, marksRes] = await Promise.all([
        getDashboardStats(),
        getFees({}),
        getAttendance({ date: today, role: 'student' }),
        getMarks({})
      ]);

      setStats(statsRes.data);

      // Fee calculations
      const fees = feesRes.data;
      const totalCollection = fees.reduce((sum, f) => sum + (f.paidAmount || 0), 0);
      const totalDue = fees.reduce((sum, f) => sum + (f.dueAmount || 0), 0);
      setFeeStats({
        total: fees.length,
        paid: fees.filter(f => f.status === 'paid').length,
        due: fees.filter(f => f.status === 'due').length,
        partialCount: fees.filter(f => f.status === 'partial').length,
        totalCollection,
        totalDue
      });

      // Today's attendance
      const todayAtt = attendanceRes.data.filter(a => a.date === today);
      setAttendanceToday({
        present: todayAtt.filter(a => a.status === 'present').length,
        absent: todayAtt.filter(a => a.status === 'absent').length,
        total: todayAtt.length
      });

      // Recent marks (last 5)
      setRecentMarks(marksRes.data.slice(0, 5));
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-container"><div className="spinner"></div></div>;
  }

  const quickActions = [
    { label: 'Mark Attendance', icon: <ClipboardCheck size={20} />, path: '/admin/attendance', color: '#2563eb' },
    { label: 'Add Marks', icon: <Award size={20} />, path: '/admin/marks', color: '#7c3aed' },
    { label: 'Manage Fees', icon: <IndianRupee size={20} />, path: '/admin/fees', color: '#059669' },
    { label: 'Send Notice', icon: <Bell size={20} />, path: '/admin/notifications', color: '#d97706' },
    { label: 'Timetable', icon: <Calendar size={20} />, path: '/admin/timetable', color: '#dc2626' },
    { label: 'Classwork', icon: <BookOpen size={20} />, path: '/admin/classwork', color: '#0891b2' },
  ];

  const attendancePercent = attendanceToday.total > 0
    ? Math.round((attendanceToday.present / attendanceToday.total) * 100) : 0;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-actions">
          <div>
            <h1>Admin Dashboard</h1>
            <p>Welcome back! Here's an overview of Perfect Group Tuition</p>
          </div>
        </div>
      </div>

      {/* === STAT CARDS === */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="stat-card" onClick={() => navigate('/admin/students')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon blue"><GraduationCap size={24} /></div>
          <div className="stat-info">
            <h4>Total Students</h4>
            <div className="stat-value">{stats.totalStudents}</div>
            <div className="stat-change">Active enrollments</div>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate('/admin/faculty')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon purple"><Users size={24} /></div>
          <div className="stat-info">
            <h4>Total Faculty</h4>
            <div className="stat-value">{stats.totalFaculty}</div>
            <div className="stat-change">Teaching staff</div>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate('/admin/fees')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon green"><IndianRupee size={24} /></div>
          <div className="stat-info">
            <h4>Fees Collected</h4>
            <div className="stat-value">₹{feeStats.totalCollection.toLocaleString()}</div>
            <div className="stat-change">{feeStats.paid} fully paid</div>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate('/admin/fees')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon red"><AlertTriangle size={24} /></div>
          <div className="stat-info">
            <h4>Fees Pending</h4>
            <div className="stat-value" style={{ color: '#dc2626' }}>₹{feeStats.totalDue.toLocaleString()}</div>
            <div className="stat-change" style={{ color: '#dc2626' }}>{feeStats.due + feeStats.partialCount} pending</div>
          </div>
        </div>

      </div>

      {/* === QUICK ACTIONS === */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h3><Activity size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Quick Actions</h3>
        </div>
        <div className="card-body" style={{ padding: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
            {quickActions.map((action, i) => (
              <button
                key={i}
                className="quick-action-btn"
                onClick={() => navigate(action.path)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  padding: '20px 12px', borderRadius: 12, border: '1px solid #e2e8f0',
                  background: 'white', cursor: 'pointer', transition: 'all 0.2s ease',
                  position: 'relative', overflow: 'hidden'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
                  e.currentTarget.style.borderColor = action.color;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: `${action.color}15`, color: action.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {action.icon}
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* === TWO COLUMN LAYOUT === */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Students by Standard */}
        <div className="card">
          <div className="card-header">
            <h3><BarChart3 size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Students by Standard</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/admin/students')}>
              View All <ChevronRight size={14} />
            </button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {stats.standardGroups && stats.standardGroups.length > 0 ? (
              <div style={{ padding: '16px 24px' }}>
                {stats.standardGroups.map((g, i) => {
                  const pct = Math.min((g.count / Math.max(stats.totalStudents, 1)) * 100, 100);
                  const colors = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2', '#be185d', '#4f46e5', '#0d9488', '#ea580c', '#2563eb', '#7c3aed'];
                  return (
                    <div key={g._id} style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>Std {g._id}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: colors[i % colors.length] }}>{g.count} students</span>
                      </div>
                      <div style={{ height: 8, borderRadius: 4, background: '#f1f5f9', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 4, width: `${pct}%`,
                          background: `linear-gradient(90deg, ${colors[i % colors.length]}, ${colors[i % colors.length]}88)`,
                          transition: 'width 0.6s ease'
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
                No student data available
              </div>
            )}
          </div>
        </div>

        {/* Fee Collection Overview */}
        <div className="card">
          <div className="card-header">
            <h3><IndianRupee size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Fee Overview</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/admin/fees')}>
              Manage <ChevronRight size={14} />
            </button>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div style={{ textAlign: 'center', padding: '16px 8px', borderRadius: 10, background: '#d1fae5' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#065f46' }}>{feeStats.paid}</div>
                <div style={{ fontSize: 12, color: '#065f46', fontWeight: 600 }}>Paid</div>
              </div>
              <div style={{ textAlign: 'center', padding: '16px 8px', borderRadius: 10, background: '#fef3c7' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#92400e' }}>{feeStats.partialCount}</div>
                <div style={{ fontSize: 12, color: '#92400e', fontWeight: 600 }}>Partial</div>
              </div>
              <div style={{ textAlign: 'center', padding: '16px 8px', borderRadius: 10, background: '#fee2e2' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#991b1b' }}>{feeStats.due}</div>
                <div style={{ fontSize: 12, color: '#991b1b', fontWeight: 600 }}>Due</div>
              </div>
            </div>
            <div style={{ padding: 16, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>Total Collection</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#059669' }}>₹{feeStats.totalCollection.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>Outstanding Due</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#dc2626' }}>₹{feeStats.totalDue.toLocaleString()}</span>
              </div>
              {(feeStats.totalCollection + feeStats.totalDue) > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ height: 10, borderRadius: 5, background: '#fee2e2', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 5,
                      background: 'linear-gradient(90deg, #059669, #34d399)',
                      width: `${(feeStats.totalCollection / (feeStats.totalCollection + feeStats.totalDue)) * 100}%`,
                      transition: 'width 0.6s ease'
                    }} />
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, textAlign: 'right' }}>
                    {Math.round((feeStats.totalCollection / (feeStats.totalCollection + feeStats.totalDue)) * 100)}% collected
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* === RECENT MARKS === */}
      {recentMarks.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3><Award size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Recent Marks Entries</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/admin/marks')}>
              View All <ChevronRight size={14} />
            </button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Subject</th>
                  <th>Exam</th>
                  <th>Marks</th>
                  <th>%</th>
                </tr>
              </thead>
              <tbody>
                {recentMarks.map(m => {
                  const pct = Math.round((m.obtainedMarks / m.totalMarks) * 100);
                  return (
                    <tr key={m._id}>
                      <td style={{ fontWeight: 600 }}>{m.studentId?.name || '—'}</td>
                      <td>{m.subject}</td>
                      <td><span className="badge badge-blue">{m.examType?.replace('_', ' ')}</span></td>
                      <td style={{ fontWeight: 700 }}>{m.obtainedMarks}/{m.totalMarks}</td>
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
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;


