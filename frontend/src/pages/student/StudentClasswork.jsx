import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { t } from '../../utils/translations';
import { getClasswork } from '../../services/api';
import { FileText, Download } from 'lucide-react';

const StudentClasswork = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [classwork, setClasswork] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadClasswork(); }, []);

  const loadClasswork = async () => {
    try {
      const params = { standard: user?.standard };
      if (user?.batch) params.batch = user.batch;
      const res = await getClasswork(params);
      setClasswork(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <h1>{t(language, 'ClassworkNotes')}</h1>
        <p>{t(language, 'NotesForStandard')} {user?.standard}</p>
      </div>

      {classwork.length === 0 ? (
        <div className="empty-state">
          <FileText size={48} />
          <h3>{t(language, 'NoClasswork')}</h3>
          <p>{t(language, 'ClassworkAppearHere')}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {classwork.map(item => (
            <div className="card" key={item._id}>
              <div className="card-header">
                <h3 style={{ fontSize: 16 }}>{item.title}</h3>
                <span className="badge badge-blue">{item.subject}</span>
              </div>
              <div className="card-body" style={{ paddingTop: 12, paddingBottom: 12 }}>
                {item.description && <p style={{ fontSize: 13, color: '#475569', marginBottom: 8 }}>{item.description}</p>}
                {item.content && (
                  <div style={{ fontSize: 13, background: '#f8fafc', padding: 12, borderRadius: 8, marginBottom: 8, maxHeight: 150, overflow: 'auto', lineHeight: 1.6 }}>
                    {item.content}
                  </div>
                )}
                {item.fileUrl && (
                  <a href={`http://localhost:5000${item.fileUrl}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                    <Download size={14} /> {item.fileName || t(language, 'DownloadFile')}
                  </a>
                )}
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>
                  {t(language, 'UploadedBy')}: {item.uploaderName} • {new Date(item.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentClasswork;
