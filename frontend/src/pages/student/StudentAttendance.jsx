import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { t } from '../../utils/translations';
import { getAttendance, getAttendanceSummary } from '../../services/api';
import { CheckCircle, XCircle } from 'lucide-react';

const formatDate = (d) => { if (!d) return '—'; const parts = d.split('-'); return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : d; };

const StudentAttendance = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [attendance, setAttendance] = useState([]);
  const [summary, setSummary] = useState({ total: 0, present: 0, absent: 0, percentage: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [attRes, sumRes] = await Promise.all([
        getAttendance({ userId: user._id }),
        getAttendanceSummary(user._id)
      ]);
      setAttendance(attRes.data);
      setSummary(sumRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <h1>{t(language, 'MyAttendance')}</h1>
        <p>{t(language, 'TrackDailyAttendance')}</p>
      </div>

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-icon green"><CheckCircle size={24} /></div>
          <div className="stat-info">
            <h4>{t(language, 'Present')}</h4>
            <div className="stat-value">{summary.present}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><XCircle size={24} /></div>
          <div className="stat-info">
            <h4>{t(language, 'Absent')}</h4>
            <div className="stat-value">{summary.absent}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><CheckCircle size={24} /></div>
          <div className="stat-info">
            <h4>{t(language, 'Overall')}</h4>
            <div className="stat-value">{summary.percentage}%</div>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr><th>{t(language, 'Date')}</th><th>{t(language, 'Day')}</th><th>{t(language, 'Status')}</th></tr>
          </thead>
          <tbody>
            {attendance.length === 0 ? (
              <tr><td colSpan="3" className="text-center" style={{padding:24,color:'#94a3b8'}}>{t(language, 'NoAttendanceRecords')}</td></tr>
            ) : attendance.map(a => {
              const dayName = new Date(a.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long' });
              return (
                <tr key={a._id}>
                  <td style={{fontWeight:600}}>{formatDate(a.date)}</td>
                  <td>{dayName}</td>
                  <td>
                    <span className={`badge ${a.status === 'present' ? 'badge-green' : 'badge-red'}`}>
                      {a.status === 'present' ? `✓ ${t(language, 'Present')}` : `✗ ${t(language, 'Absent')}`}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentAttendance;
