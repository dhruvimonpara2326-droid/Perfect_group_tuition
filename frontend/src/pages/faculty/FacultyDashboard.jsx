import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getTimetable, getAttendanceSummary, getMarks, getClasswork, getNotifications } from '../../services/api';
import { Calendar, ClipboardCheck, BookOpen, BarChart3, Clock, Award, Bell, ChevronRight, Users, FileText } from 'lucide-react';

const FacultyDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [todayLectures, setTodayLectures] = useState([]);
  const [allLectures, setAllLectures] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState({ total: 0, present: 0, absent: 0, percentage: 0 });
  const [recentMarks, setRecentMarks] = useState([]);
  const [recentClasswork, setRecentClasswork] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const todayName = DAYS[new Date().getDay()];

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [ttRes, attRes, marksRes, cwRes, notifRes] = await Promise.allSettled([
        getTimetable({ type: 'lecture' }),
        getAttendanceSummary(user._id),
        getMarks({}),
        getClasswork({}),
        getNotifications({ role: 'faculty' })
      ]);

      const allTT = ttRes.status === 'fulfilled' ? ttRes.value.data : [];
      // Filter lectures for this faculty
      const myLectures = allTT.filter(e =>
        e.facultyId?._id === user._id || e.facultyId === user._id ||
        e.facultyName === user.name
      );
      setAllLectures(myLectures);
      setTodayLectures(myLectures.filter(e => e.day === todayName));

      if (attRes.status === 'fulfilled') setAttendanceSummary(attRes.value.data);
      if (marksRes.status === 'fulfilled') setRecentMarks(marksRes.value.data.slice(0, 5));
      if (cwRes.status === 'fulfilled') setRecentClasswork(cwRes.value.data.slice(0, 3));
      if (notifRes.status === 'fulfilled') setNotifications(notifRes.value.data.slice(0, 3));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

  const uniqueStandards = [...new Set(allLectures.map(e => e.standard))];

  return (
    <div>
      {/* Welcome Header */}
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1>{getGreeting()}, {user?.name}! 👋</h1>
            <p style={{ marginTop: 4 }}>
              Subject: <strong>{user?.subject || 'General'}</strong>
              <span style={{ margin: '0 8px', color: '#cbd5e1' }}>|</span>
              {todayName}, {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div style={{
            padding: '8px 16px', borderRadius: 8,
            background: todayLectures.length > 0 ? '#f0fdf4' : '#f8fafc',
            border: `1px solid ${todayLectures.length > 0 ? '#a7f3d0' : '#e2e8f0'}`,
            fontSize: 13, fontWeight: 600,
            color: todayLectures.length > 0 ? '#059669' : '#94a3b8'
          }}>
            📅 {todayLectures.length} lecture{todayLectures.length !== 1 ? 's' : ''} today
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14, marginBottom: 24 }}>
        <div style={{ padding: '18px 20px', borderRadius: 12, background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', border: '1px solid #bfdbfe', cursor: 'pointer' }}
          onClick={() => navigate('/faculty/schedule')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: '#2563eb20', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={20} />
            </div>
            <div style={{ fontSize: 11, color: '#1e40af', fontWeight: 700, textTransform: 'uppercase' }}>My Lectures</div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#1e3a8a' }}>{allLectures.length}</div>
          <div style={{ fontSize: 11, color: '#3b82f6' }}>{uniqueStandards.length} standards</div>
        </div>

        <div style={{ padding: '18px 20px', borderRadius: 12, background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1px solid #a7f3d0', cursor: 'pointer' }}
          onClick={() => navigate('/faculty/my-attendance')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: '#05966920', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ClipboardCheck size={20} />
            </div>
            <div style={{ fontSize: 11, color: '#065f46', fontWeight: 700, textTransform: 'uppercase' }}>My Attendance</div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#065f46' }}>{attendanceSummary.percentage || 0}%</div>
          <div style={{ fontSize: 11, color: '#059669' }}>{attendanceSummary.present || 0}/{attendanceSummary.total || 0} present</div>
        </div>

        <div style={{ padding: '18px 20px', borderRadius: 12, background: 'linear-gradient(135deg, #ede9fe, #e0e7ff)', border: '1px solid #c4b5fd', cursor: 'pointer' }}
          onClick={() => navigate('/faculty/marks')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: '#7c3aed20', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={20} />
            </div>
            <div style={{ fontSize: 11, color: '#5b21b6', fontWeight: 700, textTransform: 'uppercase' }}>Marks Entries</div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#5b21b6' }}>{recentMarks.length}+</div>
          <div style={{ fontSize: 11, color: '#7c3aed' }}>recent records</div>
        </div>

        <div style={{ padding: '18px 20px', borderRadius: 12, background: 'linear-gradient(135deg, #fef3c7, #fde68a)', border: '1px solid #fcd34d', cursor: 'pointer' }}
          onClick={() => navigate('/faculty/classwork')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: '#d9770620', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={20} />
            </div>
            <div style={{ fontSize: 11, color: '#92400e', fontWeight: 700, textTransform: 'uppercase' }}>Classwork</div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#92400e' }}>{recentClasswork.length}</div>
          <div style={{ fontSize: 11, color: '#d97706' }}>uploads</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><h3>⚡ Quick Actions</h3></div>
        <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
          {[
            { icon: <Calendar size={20} />, label: 'My Schedule', path: '/faculty/schedule', color: '#2563eb' },
            { icon: <Award size={20} />, label: 'Student Marks', path: '/faculty/marks', color: '#7c3aed' },
            { icon: <ClipboardCheck size={20} />, label: 'Attendance', path: '/faculty/attendance', color: '#059669' },
            { icon: <BookOpen size={20} />, label: 'Classwork', path: '/faculty/classwork', color: '#d97706' },
            { icon: <BarChart3 size={20} />, label: 'Performance', path: '/faculty/performance', color: '#dc2626' },
            { icon: <Clock size={20} />, label: 'Test TT', path: '/faculty/test-timetable', color: '#0891b2' },
          ].map((a, i) => (
            <div key={i} onClick={() => navigate(a.path)} style={{
              padding: '16px 12px', borderRadius: 10, textAlign: 'center', cursor: 'pointer',
              border: '1px solid #e2e8f0', transition: 'all 0.15s ease', background: 'white'
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = a.color; e.currentTarget.style.background = `${a.color}08`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = 'white'; }}
            >
              <div style={{ color: a.color, marginBottom: 6 }}>{a.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>{a.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Today's Schedule */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>📅 Today's Schedule</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/faculty/schedule')}>View All <ChevronRight size={14} /></button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {todayLectures.length === 0 ? (
              <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8' }}>
                <Calendar size={32} style={{ opacity: 0.3, marginBottom: 8 }} /><br />
                No lectures today
              </div>
            ) : (
              <div style={{ padding: 12 }}>
                {todayLectures.sort((a, b) => (a.time || '').localeCompare(b.time || '')).map((l, i) => (
                  <div key={l._id} style={{
                    display: 'flex', gap: 12, alignItems: 'center',
                    padding: '10px 14px', borderRadius: 8, marginBottom: 6,
                    background: i === 0 ? '#eff6ff' : '#f8fafc',
                    border: `1px solid ${i === 0 ? '#bfdbfe' : '#f1f5f9'}`
                  }}>
                    <div style={{
                      width: 4, height: 36, borderRadius: 2,
                      background: i === 0 ? '#2563eb' : '#94a3b8'
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>{l.subject}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>
                        <Clock size={10} style={{ verticalAlign: 'middle', marginRight: 3 }} />
                        {l.time} • Std {l.standard} {l.room ? `• ${l.room}` : ''}
                      </div>
                    </div>
                    {i === 0 && <span className="badge badge-blue" style={{ fontSize: 10 }}>Next</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Notifications */}
        <div className="card">
          <div className="card-header">
            <h3>🔔 Notifications</h3>
          </div>
          <div className="card-body" style={{ padding: 12 }}>
            {notifications.length === 0 ? (
              <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8' }}>
                <Bell size={32} style={{ opacity: 0.3, marginBottom: 8 }} /><br />
                No notifications
              </div>
            ) : notifications.map((n, i) => (
              <div key={n._id || i} style={{
                padding: '10px 14px', borderRadius: 8, marginBottom: 6,
                background: '#f8fafc', border: '1px solid #f1f5f9'
              }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b', marginBottom: 2 }}>{n.title}</div>
                <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>{n.message?.slice(0, 80)}{n.message?.length > 80 ? '...' : ''}</div>
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>
                  {n.createdAt ? new Date(n.createdAt).toLocaleDateString('en-IN') : '—'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Attendance Progress Bar */}
      {attendanceSummary.total > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-body" style={{ padding: '14px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
              <span style={{ fontWeight: 600, color: '#334155' }}>My Attendance Progress</span>
              <span style={{ fontWeight: 700, color: attendanceSummary.percentage >= 75 ? '#059669' : '#dc2626' }}>
                {attendanceSummary.percentage}%
              </span>
            </div>
            <div style={{ height: 10, borderRadius: 5, background: '#fee2e2', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 5,
                background: attendanceSummary.percentage >= 75 ? 'linear-gradient(90deg, #059669, #34d399)' : 'linear-gradient(90deg, #dc2626, #f87171)',
                width: `${attendanceSummary.percentage}%`, transition: 'width 0.6s ease'
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: '#94a3b8' }}>
              <span>Present: {attendanceSummary.present}</span>
              <span>Absent: {attendanceSummary.absent}</span>
              <span>Total: {attendanceSummary.total}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyDashboard;
