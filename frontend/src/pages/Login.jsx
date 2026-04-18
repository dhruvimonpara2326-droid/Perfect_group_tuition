import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login, getBatches } from '../services/api';
import { LogIn, Eye, EyeOff, UserPlus, FileText, Phone, ChevronRight, Globe, Clock, GraduationCap, Layers } from 'lucide-react';

const STANDARDS = ['1','2','3','4','5','6','7','8','9','10','11 Commerce','12 Commerce'];

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStandard, setSelectedStandard] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [availableBatches, setAvailableBatches] = useState([]);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (selectedRole === 'student' && selectedStandard) {
      getBatches({ standard: selectedStandard })
        .then(res => setAvailableBatches(res.data))
        .catch(console.error);
    } else {
      setAvailableBatches([]);
    }
    setSelectedBatch('');
  }, [selectedStandard, selectedRole]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(formData);

      // Block admin users — they must use the Admin Portal
      if (res.data.role === 'admin') {
        setError('Administrators must login via the Admin Portal, not this portal.');
        setLoading(false);
        return;
      }

      // Enforce the selected role matches the user's actual role
      if (res.data.role !== selectedRole) {
        setError(`Access denied. You selected ${selectedRole} but are registered as a ${res.data.role}.`);
        setLoading(false);
        return;
      }

      // For students, verify standard and batch match
      if (selectedRole === 'student') {
        if (res.data.standard !== selectedStandard) {
          setError(`Standard mismatch. You selected Std ${selectedStandard} but you are registered in Std ${res.data.standard}. / ધોરણ મેળ ખાતું નથી.`);
          setLoading(false);
          return;
        }
        if (selectedBatch && res.data.batch && res.data.batch !== selectedBatch) {
          setError(`Batch mismatch. You selected ${selectedBatch} but you are registered in ${res.data.batch}. / બેચ મેળ ખાતું નથી.`);
          setLoading(false);
          return;
        }
      }

      loginUser(res.data);
      const dashMap = { faculty: '/faculty', student: '/student' };
      navigate(dashMap[res.data.role] || '/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again. / લૉગિન નિષ્ફળ. ફરી પ્રયાસ કરો.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = () => {
    return currentTime.toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) + ' ' + currentTime.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const announcements = [
    {
      type: 'important',
      textEn: 'New academic session 2026-27 registrations are now open for Standards 1 to 12 Commerce.',
      textGu: 'નવા શૈક્ષણિક સત્ર 2026-27 માટે ધોરણ 1 થી 12 કોમર્સ ની નોંધણી શરૂ થઈ ગઈ છે.',
      date: 'April 2026 / એપ્રિલ 2026'
    },
    {
      type: 'update',
      textEn: 'Unit Test 3 timetable has been published. Students can check from their dashboard.',
      textGu: 'યુનિટ ટેસ્ટ 3 નું ટાઈમટેબલ પ્રકાશિત થયું છે. વિદ્યાર્થીઓ ડેશબોર્ડ પરથી ચકાસી શકે છે.',
      date: 'April 2026 / એપ્રિલ 2026'
    },
    {
      type: 'important',
      textEn: 'Fee payment deadline for April month is 15th April 2026. Late fees will be applicable.',
      textGu: 'એપ્રિલ મહિનાની ફી ચૂકવણીની છેલ્લી તારીખ 15 એપ્રિલ 2026 છે. મોડી ફી લાગુ થશે.',
      date: 'April 2026 / એપ્રિલ 2026'
    },
    {
      type: 'update',
      textEn: 'Parent-Teacher meeting scheduled for 20th April 2026 at the main campus.',
      textGu: 'વાલી-શિક્ષક મીટિંગ 20 એપ્રિલ 2026 ના રોજ મુખ્ય કેમ્પસ ખાતે.',
      date: 'April 2026 / એપ્રિલ 2026'
    },
    {
      type: 'notice',
      textEn: 'Students are requested to update their mobile numbers for receiving notifications.',
      textGu: 'વિદ્યાર્થીઓને તેમના મોબાઈલ નંબર અપડેટ કરવા વિનંતી.',
      date: 'March 2026 / માર્ચ 2026'
    }
  ];

  return (
    <div className="portal-page">
      {/* Top Info Bar */}
      <div className="portal-topbar">
        <div className="portal-topbar-inner">
          <span>Welcome to Perfect Group Tuition Portal / પરફેક્ટ ગ્રૂપ ટ્યુશન પોર્ટલ પર સ્વાગત છે</span>
          <div className="portal-topbar-right">
            <span><Clock size={13} /> {formatDate()}</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="portal-header">
        <div className="portal-header-inner">
          <div className="portal-brand">
            <div className="portal-logo"><img src="/pgt-logo.svg" alt="PGT" style={{ width: 70, height: 70, borderRadius: '50%' }} /></div>
            <div className="portal-brand-text">
              <h1>Perfect Group Tuition / પરફેક્ટ ગ્રૂપ ટ્યુશન</h1>
              <p>Online Management Portal / ઓનલાઈન મેનેજમેન્ટ પોર્ટલ</p>
            </div>
          </div>
          <div className="portal-header-actions">
            <Link to="/login" className="portal-header-btn active">
              <LogIn size={15} /> Login / લૉગિન
            </Link>
            <Link to="/register" className="portal-header-btn">
              <UserPlus size={15} /> Register / નોંધણી
            </Link>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="portal-breadcrumb">
        <div className="portal-breadcrumb-inner">
          <span>Home / હોમ</span>
          <ChevronRight size={14} />
          <span className="active">User Login / યુઝર લૉગિન</span>
        </div>
      </div>

      {/* Main Content - 3 Column Layout */}
      <div className="portal-content">
        <div className="portal-grid">

          {/* Left Column - New User */}
          <div className="portal-panel portal-panel-left">
            <div className="portal-panel-header portal-panel-header-orange">
              <UserPlus size={18} />
              <span>New Student / નવા વિદ્યાર્થી</span>
            </div>
            <div className="portal-panel-subheader">
              Register as a student with Perfect Group Tuition
              <br />
              <span className="portal-gu-text">પરફેક્ટ ગ્રૂપ ટ્યુશન પોર્ટલ પર વિદ્યાર્થી તરીકે નોંધણી કરો</span>
            </div>
            <div className="portal-panel-body">
              <Link to="/register" className="portal-register-btn" id="new-registration-btn">
                New Registration / નવી નોંધણી
              </Link>

              <ul className="portal-features-list">
                <li><ChevronRight size={14} /> View Attendance Online / ઓનલાઈન હાજરી જુઓ</li>
                <li><ChevronRight size={14} /> Check Marks & Results / માર્ક્સ અને પરિણામ ચકાસો</li>
                <li><ChevronRight size={14} /> Pay Fees Online / ઓનલાઈન ફી ચૂકવો</li>
                <li><ChevronRight size={14} /> View Lecture Timetable / લેક્ચર ટાઈમટેબલ જુઓ</li>
                <li><ChevronRight size={14} /> View Test Timetable / ટેસ્ટ ટાઈમટેબલ જુઓ</li>
                <li><ChevronRight size={14} /> Download Classwork Notes / ક્લાસવર્ક નોટ્સ ડાઉનલોડ કરો</li>
                <li><ChevronRight size={14} /> Receive Notifications / સૂચનાઓ મેળવો</li>
              </ul>

              <div className="portal-helpline">
                <h4><Phone size={15} /> Contact Helpline / હેલ્પલાઈન સંપર્ક</h4>
                <p className="portal-helpline-number">📞 9824156290</p>
                <p className="portal-helpline-text">For any queries or support  / કોઈપણ પ્રશ્ન અથવા મદદ માટે</p>
              </div>
            </div>
          </div>

          {/* Center Column - Login Form */}
          <div className="portal-panel portal-panel-center">
            <div className="portal-panel-header portal-panel-header-blue">
              <LogIn size={18} />
              <span>Registered User / નોંધાયેલ વપરાશકર્તા</span>
            </div>
            <div className="portal-panel-subheader">
              Registered users can login to access their account & services
              <br />
              <span className="portal-gu-text">નોંધાયેલ યુઝર્સ તેમનું એકાઉન્ટ અને સેવાઓ ઍક્સેસ કરવા લૉગિન કરી શકે છે</span>
            </div>
            <div className="portal-panel-body">
              <div className="portal-notice">
                <span className="portal-notice-hash">#</span>
                <div>
                  Kindly keep your login credentials safe. Do not share your password with anyone.
                  <br />
                  <span className="portal-gu-text">કૃપા કરીને તમારા લૉગિન ક્રેડેન્શિયલ સુરક્ષિત રાખો. તમારો પાસવર્ડ કોઈની સાથે શેર ન કરો.</span>
                </div>
              </div>

              {error && <div className="alert alert-error">{error}</div>}

              <form onSubmit={handleSubmit} className="portal-form">
                <div className="portal-form-group">
                  <label className="portal-label">Select Role / ભૂમિકા પસંદ કરો</label>
                  <div className="portal-input-wrapper">
                    <Globe size={16} className="portal-input-icon" />
                    <select
                      id="login-role"
                      className="portal-input"
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      required
                    >
                      <option value="">Select / પસંદ કરો</option>
                      <option value="faculty">Faculty / શિક્ષક</option>
                      <option value="student">Student / વિદ્યાર્થી</option>
                      {/* Admin login is via the separate Admin Portal */}
                    </select>
                  </div>
                </div>

                {selectedRole === 'student' && (
                  <>
                    <div className="portal-form-group">
                      <label className="portal-label">Standard / ધોરણ</label>
                      <div className="portal-input-wrapper">
                        <GraduationCap size={16} className="portal-input-icon" />
                        <select
                          id="login-standard"
                          className="portal-input"
                          value={selectedStandard}
                          onChange={(e) => setSelectedStandard(e.target.value)}
                          required
                        >
                          <option value="">Select Standard / ધોરણ પસંદ કરો</option>
                          {STANDARDS.map(s => <option key={s} value={s}>Std {s}</option>)}
                        </select>
                      </div>
                    </div>

                    {selectedStandard && availableBatches.length > 0 && (
                      <div className="portal-form-group">
                        <label className="portal-label">Batch / બેચ</label>
                        <div className="portal-input-wrapper">
                          <Layers size={16} className="portal-input-icon" />
                          <select
                            id="login-batch"
                            className="portal-input"
                            value={selectedBatch}
                            onChange={(e) => setSelectedBatch(e.target.value)}
                          >
                            <option value="">Select Batch / બેચ પસંદ કરો</option>
                            {availableBatches.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
                          </select>
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div className="portal-form-group">
                  <label className="portal-label">User Name / યુઝરનેમ</label>
                  <div className="portal-input-wrapper">
                    <UserPlus size={16} className="portal-input-icon" />
                    <input
                      id="login-username"
                      type="text"
                      className="portal-input"
                      placeholder="Enter User Name / યુઝરનેમ દાખલ કરો"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="portal-form-group">
                  <label className="portal-label">Password / પાસવર્ડ</label>
                  <div className="portal-input-wrapper">
                    <Eye size={16} className="portal-input-icon" />
                    <input
                      id="login-password"
                      type={showPass ? 'text' : 'password'}
                      className="portal-input"
                      placeholder="Enter Password / પાસવર્ડ દાખલ કરો"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="portal-input-toggle"
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  id="login-submit"
                  type="submit"
                  className="portal-submit-btn"
                  disabled={loading}
                >
                  <LogIn size={16} />
                  {loading ? 'Signing in... / લૉગિન થઈ રહ્યું છે...' : 'Login / લૉગિન'}
                </button>
              </form>

              <div className="forgot-link-container">
                <Link to="/forgot-password" className="forgot-password-link" id="forgot-password-link">
                  🔒 Forgot Password? / પાસવર્ડ ભૂલ્યા?
                </Link>
              </div>

              <div className="portal-form-footer">
                <p>New student? / નવા વિદ્યાર્થી? <Link to="/register">Register here / અહીં નોંધણી કરો</Link></p>
              </div>
            </div>
          </div>

          {/* Right Column - Latest Updates */}
          <div className="portal-panel portal-panel-right">
            <div className="portal-panel-header portal-panel-header-orange">
              <FileText size={18} />
              <span>Latest Updates / તાજા સમાચાર</span>
            </div>
            <div className="portal-panel-subheader">
              Important announcements and notices for students & parents
              <br />
              <span className="portal-gu-text">વિદ્યાર્થીઓ અને વાલીઓ માટે મહત્વની જાહેરાતો અને સૂચનાઓ</span>
            </div>
            <div className="portal-panel-body portal-updates-body">
              <div className="portal-updates-scroll">
                {announcements.map((item, index) => (
                  <div key={index} className={`portal-update-item portal-update-${item.type}`}>
                    <span className="portal-update-icon">
                      {item.type === 'important' ? '🔴' : item.type === 'update' ? '🟢' : '🔵'}
                    </span>
                    <div className="portal-update-content">
                      <p>{item.textEn}</p>
                      <p className="portal-gu-text">{item.textGu}</p>
                      <span className="portal-update-date">{item.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <div className="portal-footer">
        <div className="portal-footer-inner">
          <div className="portal-footer-left">
            <p>© 2026 Perfect Group Tuition. All Rights Reserved. / સર્વાધિકાર સુરક્ષિત.</p>
            <p className="portal-footer-sub">Designed & Developed for Academic Excellence / શૈક્ષણિક ઉત્કૃષ્ટતા માટે ડિઝાઇન</p>
          </div>
          <div className="portal-footer-right">
            {/* <span>📧 info@perfectgroup.com</span> */}
            <span>📞 +91 9824156290</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
