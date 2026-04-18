import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { t } from '../../utils/translations';
import { getMarks } from '../../services/api';

const formatDate = (d) => { if (!d) return '—'; const parts = d.split('-'); return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : d; };

const StudentMarks = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadMarks(); }, []);

  const loadMarks = async () => {
    try {
      const res = await getMarks({ studentId: user._id });
      setMarks(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <h1>{t(language, 'MyMarks')}</h1>
        <p>{t(language, 'ViewExamResults')}</p>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr><th>{t(language, 'Subject')}</th><th>{t(language, 'ExamType')}</th><th>{t(language, 'Obtained')}</th><th>{t(language, 'Total')}</th><th>{t(language, 'Percentage')}</th><th>{t(language, 'Date')}</th><th>{t(language, 'Remarks')}</th></tr>
          </thead>
          <tbody>
            {marks.length === 0 ? (
              <tr><td colSpan="7" className="text-center" style={{padding:24,color:'#94a3b8'}}>{t(language, 'NoMarksRecords')}</td></tr>
            ) : marks.map(m => {
              const pct = Math.round((m.obtainedMarks/m.totalMarks)*100);
              return (
                <tr key={m._id}>
                  <td style={{fontWeight:600}}>{m.subject}</td>
                  <td><span className="badge badge-blue">{m.examType.replace('_',' ')}</span></td>
                  <td style={{fontWeight:700}}>{m.obtainedMarks}</td>
                  <td>{m.totalMarks}</td>
                  <td><span className={`badge ${pct>=70?'badge-green':pct>=40?'badge-orange':'badge-red'}`}>{pct}%</span></td>
                  <td>{formatDate(m.date)}</td>
                  <td>{m.remarks || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentMarks;
