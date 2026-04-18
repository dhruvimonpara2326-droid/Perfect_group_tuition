import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { t } from '../../utils/translations';
import { getAttendanceSummary, getFees, getStudentResult } from '../../services/api';
import { Award, ClipboardCheck, IndianRupee, TrendingUp, BookOpen, Calendar } from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [attendance, setAttendance] = useState({ total: 0, present: 0, absent: 0, percentage: 0 });
  const [fees, setFees] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [attRes, feeRes, resultRes] = await Promise.all([
        getAttendanceSummary(user._id),
        getFees({ studentId: user._id }),
        getStudentResult(user._id)
      ]);
      setAttendance(attRes.data);
      setFees(feeRes.data[0] || null);
      setResult(resultRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <h1>{t(language, 'Welcome')}, {user?.name}!</h1>
        <p>{t(language, 'RollNo')}: {user?.rollNo} | {t(language, 'Standard')}: {user?.standard} | {t(language, 'Batch')}: {user?.batch}</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon green"><ClipboardCheck size={24} /></div>
          <div className="stat-info">
            <h4>{t(language, 'Attendance')}</h4>
            <div className="stat-value">{attendance.percentage}%</div>
            <div className="stat-change">{attendance.present}/{attendance.total} {t(language, 'DaysPresent')}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue"><Award size={24} /></div>
          <div className="stat-info">
            <h4>{t(language, 'OverallResult')}</h4>
            <div className="stat-value">{result?.percentage || 0}%</div>
            <div className="stat-change">{result?.totalExams || 0} {t(language, 'Exams')}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: fees?.status === 'paid' ? '#d1fae5' : '#fee2e2', color: fees?.status === 'paid' ? '#059669' : '#dc2626' }}>
            <IndianRupee size={24} />
          </div>
          <div className="stat-info">
            <h4>{t(language, 'FeeStatusLabel')}</h4>
            <div className="stat-value" style={{ fontSize: '1.2rem' }}>
              {fees ? (
                <>
                  <span className={`badge ${fees.status === 'paid' ? 'badge-green' : fees.status === 'partial' ? 'badge-orange' : 'badge-red'}`} style={{ fontSize: 14 }}>
                    {fees.status === 'paid' ? t(language, 'Paid') : fees.status === 'partial' ? t(language, 'Partial') : t(language, 'Due')}
                  </span>
                </>
              ) : 'N/A'}
            </div>
            {fees && fees.dueAmount > 0 && (
              <div style={{ color: '#dc2626', fontSize: 13, marginTop: 4 }}>{t(language, 'Due')}: ₹{fees.dueAmount.toLocaleString()}</div>
            )}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple"><TrendingUp size={24} /></div>
          <div className="stat-info">
            <h4>{t(language, 'TotalMarks')}</h4>
            <div className="stat-value">{result?.totalObtained || 0}/{result?.totalMax || 0}</div>
          </div>
        </div>
      </div>

      {result && Object.keys(result.subjects).length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3>{t(language, 'SubjectPerformance')}</h3>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr><th>{t(language, 'Subject')}</th><th>{t(language, 'Exams')}</th><th>{t(language, 'Avg')}</th></tr>
              </thead>
              <tbody>
                {Object.entries(result.subjects).map(([subject, records]) => {
                  const avgPct = Math.round(records.reduce((s, r) => s + (r.obtainedMarks/r.totalMarks)*100, 0) / records.length);
                  return (
                    <tr key={subject}>
                      <td style={{fontWeight:600}}>{subject}</td>
                      <td>{records.length}</td>
                      <td><span className={`badge ${avgPct>=70?'badge-green':avgPct>=40?'badge-orange':'badge-red'}`}>{avgPct}%</span></td>
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

export default StudentDashboard;
