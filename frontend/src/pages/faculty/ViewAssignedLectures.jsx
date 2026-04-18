import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getTimetable } from '../../services/api';
import { Calendar, Clock, BookOpen, Users, Home, ChevronDown, ChevronUp } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const dayColors = {
  'Monday': '#2563eb', 'Tuesday': '#7c3aed', 'Wednesday': '#059669',
  'Thursday': '#d97706', 'Friday': '#dc2626', 'Saturday': '#0891b2'
};

const ViewAssignedLectures = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedDay, setExpandedDay] = useState(null);

  const todayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];

  useEffect(() => { loadSchedule(); }, []);

  const loadSchedule = async () => {
    try {
      const res = await getTimetable({ type: 'lecture' });
      // Filter lectures assigned to this faculty
      const myLectures = res.data.filter(e =>
        e.facultyId?._id === user._id || e.facultyId === user._id || e.facultyName === user.name
      );
      setEntries(myLectures);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const grouped = {};
  DAYS.forEach(d => { grouped[d] = []; });
  entries.forEach(e => { if (grouped[e.day]) grouped[e.day].push(e); });

  // Sort each day by time
  DAYS.forEach(d => { grouped[d].sort((a, b) => (a.time || '').localeCompare(b.time || '')); });

  const totalLectures = entries.length;
  const todaysCount = grouped[todayName]?.length || 0;
  const uniqueSubjects = [...new Set(entries.map(e => e.subject))];
  const uniqueStandards = [...new Set(entries.map(e => e.standard))];

  if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <h1>📅 My Lecture Schedule</h1>
        <p>Your assigned lectures for the week • {totalLectures} total lectures</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
        <div style={{ padding: '14px 18px', borderRadius: 10, background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', border: '1px solid #bfdbfe' }}>
          <div style={{ fontSize: 10, color: '#1e40af', fontWeight: 700, textTransform: 'uppercase' }}>Total Lectures</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#1e3a8a' }}>{totalLectures}</div>
        </div>
        <div style={{ padding: '14px 18px', borderRadius: 10, background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1px solid #a7f3d0' }}>
          <div style={{ fontSize: 10, color: '#065f46', fontWeight: 700, textTransform: 'uppercase' }}>Today ({todayName.slice(0,3)})</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#065f46' }}>{todaysCount}</div>
        </div>
        <div style={{ padding: '14px 18px', borderRadius: 10, background: 'linear-gradient(135deg, #ede9fe, #e0e7ff)', border: '1px solid #c4b5fd' }}>
          <div style={{ fontSize: 10, color: '#5b21b6', fontWeight: 700, textTransform: 'uppercase' }}>Subjects</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#5b21b6' }}>{uniqueSubjects.length}</div>
          <div style={{ fontSize: 10, color: '#7c3aed' }}>{uniqueSubjects.join(', ')}</div>
        </div>
        <div style={{ padding: '14px 18px', borderRadius: 10, background: 'linear-gradient(135deg, #fef3c7, #fde68a)', border: '1px solid #fcd34d' }}>
          <div style={{ fontSize: 10, color: '#92400e', fontWeight: 700, textTransform: 'uppercase' }}>Standards</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#92400e' }}>{uniqueStandards.length}</div>
          <div style={{ fontSize: 10, color: '#d97706' }}>{uniqueStandards.map(s => `Std ${s}`).join(', ')}</div>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="empty-state">
          <Calendar size={48} />
          <h3>No lectures assigned</h3>
          <p>You don't have any lectures assigned yet. Contact admin for schedule.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {DAYS.map(day => {
            const dayEntries = grouped[day];
            const isToday = day === todayName;
            const isExpanded = expandedDay === day || isToday || dayEntries.length > 0;

            return (
              <div key={day} className="card" style={{
                borderLeft: `4px solid ${dayColors[day]}`,
                background: isToday ? `${dayColors[day]}05` : 'white'
              }}>
                <div
                  className="card-header"
                  style={{ cursor: 'pointer', padding: '12px 16px' }}
                  onClick={() => setExpandedDay(expandedDay === day ? null : day)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                    <span style={{
                      width: 10, height: 10, borderRadius: '50%', background: dayColors[day]
                    }} />
                    <span style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>{day}</span>
                    {isToday && <span className="badge badge-blue" style={{ fontSize: 10 }}>TODAY</span>}
                    <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 'auto' }}>
                      {dayEntries.length} lecture{dayEntries.length !== 1 ? 's' : ''}
                    </span>
                    {dayEntries.length > 0 ? (isExpanded ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />) : null}
                  </div>
                </div>

                {isExpanded && dayEntries.length > 0 && (
                  <div className="card-body" style={{ paddingTop: 0, paddingBottom: 12 }}>
                    {dayEntries.map((entry, idx) => (
                      <div key={entry._id} style={{
                        display: 'flex', gap: 14, alignItems: 'center',
                        padding: '12px 16px', borderRadius: 10, marginBottom: 6,
                        background: '#f8fafc', border: '1px solid #f1f5f9',
                        transition: 'all 0.15s ease'
                      }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; }}
                      >
                        <div style={{
                          minWidth: 44, height: 44, borderRadius: 10,
                          background: `${dayColors[day]}15`, color: dayColors[day],
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 800, fontSize: 14
                        }}>{idx + 1}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>{entry.subject}</div>
                          <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#64748b', marginTop: 3 }}>
                            <span><Clock size={11} style={{ verticalAlign: 'middle', marginRight: 3 }} />{entry.time}</span>
                            <span><BookOpen size={11} style={{ verticalAlign: 'middle', marginRight: 3 }} />Std {entry.standard}</span>
                            {entry.batch && <span><Users size={11} style={{ verticalAlign: 'middle', marginRight: 3 }} />Batch {entry.batch}</span>}
                            {entry.room && <span><Home size={11} style={{ verticalAlign: 'middle', marginRight: 3 }} />{entry.room}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ViewAssignedLectures;
