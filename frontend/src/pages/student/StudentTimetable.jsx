import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { t } from '../../utils/translations';
import { getTimetable } from '../../services/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const formatDate = (d) => { if (!d) return ''; const parts = d.split('-'); return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : d; };

const parseMetadata = (roomStr) => {
  try {
    if (roomStr && roomStr.startsWith('{')) return JSON.parse(roomStr);
  } catch {}
  return { actualRoom: roomStr || '' };
};

const StudentTimetable = ({ type = 'lecture' }) => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => { loadTimetable(); }, [type]);

  const loadTimetable = async () => {
    setLoading(true);
    try {
      const params = { standard: user?.standard, type };
      if (user?.batch) params.batch = user.batch;
      const res = await getTimetable(params);
      setEntries(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

  // Lecture grouping
  const grouped = {};
  DAYS.forEach(d => { grouped[d] = []; });

  // Test grouping
  const testsCategorized = { expired: [], today: [], upcoming: [] };

  if (type === 'lecture') {
    entries.forEach(e => { if (grouped[e.day]) grouped[e.day].push(e); });
  } else {
    const todayDateObj = new Date();
    todayDateObj.setHours(0,0,0,0);
    entries.forEach(e => {
      const meta = parseMetadata(e.room);
      const dStr = meta.date;
      if (!dStr) {
        testsCategorized.upcoming.push(e);
        return;
      }
      const d = new Date(dStr);
      d.setHours(0,0,0,0);
      if (d < todayDateObj) testsCategorized.expired.push(e);
      else if (d.getTime() === todayDateObj.getTime()) testsCategorized.today.push(e);
      else testsCategorized.upcoming.push(e);
    });
    ['expired', 'today', 'upcoming'].forEach(cat => {
      testsCategorized[cat].sort((a,b) => {
        const dA = parseMetadata(a.room).date ? new Date(parseMetadata(a.room).date) : new Date(8640000000000000);
        const dB = parseMetadata(b.room).date ? new Date(parseMetadata(b.room).date) : new Date(8640000000000000);
        return dA - dB;
      });
    });
  }

  return (
    <div>
      <div className="page-header">
        <h1>{type === 'lecture' ? t(language, 'LectureTimetable') : t(language, 'TestTimetable')}</h1>
        <p>{type === 'lecture' ? t(language, 'WeeklyLectureSchedule') : t(language, 'WeeklyTestSchedule')} {user?.standard}{user?.batch ? ` • Batch ${user.batch}` : ''}</p>
      </div>

      {entries.length === 0 ? (
        <div className="empty-state">
          <h3>{type === 'lecture' ? t(language, 'NoLectureSchedule') : t(language, 'NoTestSchedule')}</h3>
          <p>{t(language, 'TimetableNotCreated')}</p>
        </div>
      ) : type === 'test' ? (
        <>
          <div className="tabs" style={{ marginBottom: 20 }}>
            <button className={`tab-btn ${activeTab === 'expired' ? 'active' : ''}`} onClick={() => setActiveTab('expired')}>
              Expired Tests ({testsCategorized.expired.length})
            </button>
            <button className={`tab-btn ${activeTab === 'today' ? 'active' : ''}`} onClick={() => setActiveTab('today')}>
              Today's Tests ({testsCategorized.today.length})
            </button>
            <button className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`} onClick={() => setActiveTab('upcoming')}>
              Upcoming Tests ({testsCategorized.upcoming.length})
            </button>
          </div>

          {testsCategorized[activeTab].length === 0 ? (
            <div className="empty-state">
              <h3>No {activeTab} tests</h3>
              <p>You have no {activeTab} tests scheduled.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
              {testsCategorized[activeTab].map(entry => {
                const meta = parseMetadata(entry.room);
                const isExpired = activeTab === 'expired';
                const isToday = activeTab === 'today';
                return (
                  <div key={entry._id} className="card" style={{
                    borderLeft: `4px solid ${isExpired ? '#94a3b8' : isToday ? '#d97706' : '#2563eb'}`,
                    opacity: isExpired ? 0.75 : 1
                  }}>
                    <div className="card-body" style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4,
                          background: isExpired ? '#f1f5f9' : isToday ? '#fef3c7' : '#eff6ff',
                          color: isExpired ? '#64748b' : isToday ? '#d97706' : '#2563eb',
                          textTransform: 'uppercase'
                        }}>
                          {meta.examType?.replace('_', ' ') || 'TEST'}
                        </span>
                        {isToday && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: '#d97706', color: 'white' }}>TODAY</span>}
                        {isExpired && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: '#94a3b8', color: 'white' }}>EXPIRED</span>}
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>{entry.subject}</div>
                      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
                        {meta.date ? `📅 ${formatDate(meta.date)} • ` : ''}{entry.time}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                        <div style={{ padding: '6px', borderRadius: 6, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                          <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>{t(language, 'TotalMarks') || 'Total Marks'}</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>{meta.totalMarks || '—'}</div>
                        </div>
                        <div style={{ padding: '6px', borderRadius: 6, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                          <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>{t(language, 'Duration') || 'Duration'}</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>{meta.duration || '—'}</div>
                        </div>
                      </div>

                      {meta.syllabus && (
                        <div style={{ padding: '8px', borderRadius: 6, background: '#fef3c7', fontSize: 11, color: '#92400e' }}>
                          <strong>📖 Syllabus:</strong> {meta.syllabus}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <div className="timetable-grid">
          {DAYS.map(day => (
            <div className="timetable-day" key={day}>
              <div className="timetable-day-header">{t(language, day) || day}</div>
              {grouped[day].length === 0 ? (
                <div className="timetable-slot" style={{color:'#94a3b8',textAlign:'center',fontSize:13}}>
                  {t(language, 'NoLectures') || 'No lectures'}
                </div>
              ) : (
                grouped[day].map(entry => {
                  const meta = parseMetadata(entry.room);
                  return (
                    <div className="timetable-slot" key={entry._id}>
                      <div className="slot-time">{entry.time}</div>
                      <div className="slot-subject">{entry.subject}</div>
                      <div className="slot-faculty">{entry.facultyName || '—'}</div>
                      {entry.room && !entry.room.startsWith('{') && (
                        <div className="slot-faculty">{t(language, 'Room') || 'Room'}: {entry.room}</div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentTimetable;
