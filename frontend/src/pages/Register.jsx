import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { register, getBatches } from '../services/api';
import { UserPlus, Eye, EyeOff, LogIn, ChevronRight, ChevronLeft, Clock, Shield, GraduationCap, Users } from 'lucide-react';

const STANDARDS = [
  '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
  '11 Commerce', '12 Commerce'
];

const SUBJECTS = [
  'Mathematics', 'Science', 'English', 'Gujarati', 'Hindi', 'Social Science',
  'Accounts', 'Economics', 'Commerce', 'Statistics', 'Computer', 'Other'
];

const Register = () => {
  const [selectedRole, setSelectedRole] = useState('student');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    name: '',
    email: '',
    mobile: '',
    rollNo: '',
    batch: '',
    standard: '',
    subject: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const [availableBatches, setAvailableBatches] = useState([]);

  useEffect(() => {
    if (formData.standard) {
      getBatches({ standard: formData.standard })
        .then(res => setAvailableBatches(res.data))
        .catch(err => console.error(err));
    } else {
      setAvailableBatches([]);
    }
  }, [formData.standard]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRollOrNameChange = (field, value) => {
    const updated = { ...formData, [field]: value };
    if (selectedRole === 'student' && updated.rollNo && updated.name) {
      const roll = updated.rollNo.padStart(3, '0');
      const namePart = updated.name.replace(/\s+/g, '');
      updated.username = roll + namePart;
    }
    setFormData(updated);
  };

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setError('');
    setFormData({
      username: '',
      password: '',
      confirmPassword: '',
      name: '',
      email: '',
      mobile: '',
      rollNo: '',
      batch: '',
      standard: '',
      subject: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match / પાસવર્ડ મેળ ખાતો નથી');
      return;
    }

    if (formData.password.length < 4) {
      setError('Password must be at least 4 characters / પાસવર્ડ ઓછામાં ઓછા 4 અક્ષરનો હોવો જોઈએ');
      return;
    }

    if (selectedRole === 'student' && !formData.standard) {
      setError('Please select a standard / કૃપા કરીને ધોરણ પસંદ કરો');
      return;
    }

    if (selectedRole === 'faculty' && !formData.subject) {
      setError('Please select a subject / કૃપા કરીને વિષય પસંદ કરો');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        username: formData.username,
        password: formData.password,
        name: formData.name,
        email: formData.email,
        mobile: formData.mobile,
        role: selectedRole,
      };

      if (selectedRole === 'student') {
        payload.rollNo = formData.rollNo.padStart(3, '0');
        payload.batch = formData.batch;
        payload.standard = formData.standard;
      }

      if (selectedRole === 'faculty') {
        payload.subject = formData.subject;
      }

      const res = await register(payload);
      loginUser(res.data);

      const dashMap = { admin: '/admin', faculty: '/faculty', student: '/student' };
      navigate(dashMap[res.data.role] || '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again. / નોંધણી નિષ્ફળ. ફરી પ્રયાસ કરો.');
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

  const roleConfig = {
    student: {
      icon: <GraduationCap size={20} />,
      label: 'Student / વિદ્યાર્થી',
      labelShort: 'Student',
      color: '#2563eb',
      description: 'Register as a student to access marks, attendance, fees, timetable and classwork.',
      descriptionGu: 'માર્ક્સ, હાજરી, ફી, ટાઈમટેબલ અને ક્લાસવર્ક ઍક્સેસ કરવા વિદ્યાર્થી તરીકે નોંધણી કરો.'
    },
    faculty: {
      icon: <Users size={20} />,
      label: 'Faculty / શિક્ષક',
      labelShort: 'Faculty',
      color: '#059669',
      description: 'Register as faculty to manage student attendance, marks and lectures.',
      descriptionGu: 'વિદ્યાર્થીઓની હાજરી, માર્ક્સ અને લેક્ચર્સ મેનેજ કરવા શિક્ષક તરીકે નોંધણી કરો.'
    },
    admin: {
      icon: <Shield size={20} />,
      label: 'Admin / એડમિન',
      labelShort: 'Admin',
      color: '#dc2626',
      description: 'Register as admin to manage the entire tuition center.',
      descriptionGu: 'સમગ્ર ટ્યુશન સેન્ટર મેનેજ કરવા એડમિન તરીકે નોંધણી કરો.'
    }
  };

  return (
    <div className="portal-page">
      {/* Top Info Bar */}
      <div className="portal-topbar">
        <div className="portal-topbar-inner">
          <span>Welcome to Perfect Group Tuition Portal / પર્ફેક્ટ ગ્રૂપ ટ્યુશન પોર્ટલ પર સ્વાગત છે</span>
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
              <h1>Perfect Group Tuition / પર્ફેક્ટ ગ્રૂપ ટ્યુશન</h1>
              <p>Online Management Portal / ઓનલાઈન મેનેજમેન્ટ પોર્ટલ</p>
            </div>
          </div>
          <div className="portal-header-actions">
            <Link to="/login" className="portal-header-btn">
              <LogIn size={15} /> Login / લૉગિન
            </Link>
            <Link to="/register" className="portal-header-btn active">
              <UserPlus size={15} /> Register / નોંધણી
            </Link>
          </div>
        </div>
      </div>

      {/* Breadcrumb with Back */}
      <div className="portal-breadcrumb">
        <div className="portal-breadcrumb-inner">
          <Link to="/login" className="portal-back-link">
            <ChevronLeft size={16} />
            Back / પાછા
          </Link>
          <span className="portal-breadcrumb-sep">|</span>
          <Link to="/login" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>Home / હોમ</Link>
          <ChevronRight size={14} />
          <span className="active">New Registration / નવી નોંધણી</span>
        </div>
      </div>

      {/* Role Category Tabs Removed - Only Student Registration Allowed */}

      {/* Main Content */}
      <div className="portal-content">
        <div className="portal-grid portal-grid-fullwidth">

          {/* Registration Form */}
          <div className="portal-panel portal-panel-center">
            <div
              className="portal-panel-header"
              style={{ background: `linear-gradient(135deg, ${roleConfig[selectedRole].color}dd, ${roleConfig[selectedRole].color})` }}
            >
              {roleConfig[selectedRole].icon}
              <span>{roleConfig[selectedRole].label} - Registration Form / નોંધણી ફોર્મ</span>
            </div>
            <div className="portal-panel-subheader">
              Fill all the required fields to create your {roleConfig[selectedRole].labelShort} account
              <br />
              <span className="portal-gu-text">તમારું {roleConfig[selectedRole].labelShort} એકાઉન્ટ બનાવવા માટે બધા જરૂરી ફીલ્ડ ભરો</span>
            </div>
            <div className="portal-panel-body">
              <div className="portal-notice">
                <span className="portal-notice-hash">#</span>
                <div>
                  {selectedRole === 'student'
                    ? <>Fields marked with <strong>*</strong> are mandatory. Your username will be auto-generated from Roll No + Name.<br /><span className="portal-gu-text"><strong>*</strong> ચિહ્નવાળા ફીલ્ડ ફરજિયાત છે. તમારું યુઝરનેમ રોલ નં + નામ પરથી આપમેળે બનશે.</span></>
                    : <>Fields marked with <strong>*</strong> are mandatory. Choose a unique username for your account.<br /><span className="portal-gu-text"><strong>*</strong> ચિહ્નવાળા ફીલ્ડ ફરજિયાત છે. તમારા એકાઉન્ટ માટે યુનિક યુઝરનેમ પસંદ કરો.</span></>
                  }
                </div>
              </div>

              {error && <div className="alert alert-error">{error}</div>}

              <form onSubmit={handleSubmit} className="portal-form">
                {/* Common: Name */}
                <div className="portal-form-row">
                  <div className="portal-form-group">
                    <label className="portal-label">Full Name / પૂરું નામ *</label>
                    <input
                      id="register-name"
                      type="text"
                      className="portal-input"
                      placeholder={selectedRole === 'student' ? 'e.g. Raj Patel / દા.ત. રાજ પટેલ' : selectedRole === 'faculty' ? 'e.g. Prof. Shah / દા.ત. પ્રો. શાહ' : 'e.g. Admin Name / દા.ત. એડમિન નામ'}
                      value={formData.name}
                      onChange={(e) => selectedRole === 'student' ? handleRollOrNameChange('name', e.target.value) : handleChange(e)}
                      name="name"
                      required
                    />
                  </div>
                  <div className="portal-form-group">
                    <label className="portal-label">Mobile Number / મોબાઈલ નંબર *</label>
                    <input
                      id="register-mobile"
                      type="tel"
                      className="portal-input"
                      placeholder="10 digit mobile / 10 અંકનો મોબાઈલ નંબર"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleChange}
                      required
                      maxLength={10}
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div className="portal-form-group">
                  <label className="portal-label">Email Address / ઈમેલ એડ્રેસ *</label>
                  <input
                    id="register-email"
                    type="email"
                    className="portal-input"
                    placeholder="e.g. name@example.com / દા.ત. name@example.com"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                  <span className="portal-field-help">Used for password recovery / પાસવર્ડ રિકવરી માટે વપરાય છે</span>
                </div>

                {/* Student-specific fields */}
                {selectedRole === 'student' && (
                  <>
                    <div className="portal-form-row">
                      <div className="portal-form-group">
                        <label className="portal-label">Roll No / રોલ નંબર *</label>
                        <input
                          id="register-rollno"
                          type="text"
                          className="portal-input"
                          placeholder="e.g. 1 or 001 / દા.ત. 1 અથવા 001"
                          value={formData.rollNo}
                          onChange={(e) => handleRollOrNameChange('rollNo', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="portal-form-row">
                      <div className="portal-form-group">
                        <label className="portal-label">Standard / ધોરણ *</label>
                        <select
                          id="register-standard"
                          className="portal-input"
                          name="standard"
                          value={formData.standard}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Select Standard / ધોરણ પસંદ કરો</option>
                          {STANDARDS.map(s => (
                            <option key={s} value={s}>{s === '11 ' || s === '12 ' ? `Std ${s} / ધો. ${s}` : `Std ${s}  / ધો. ${s} `}</option>
                          ))}
                        </select>
                      </div>
                      <div className="portal-form-group">
                        <label className="portal-label">Batch / બેચ *</label>
                        <select
                          id="register-batch"
                          className="portal-input"
                          name="batch"
                          value={formData.batch}
                          onChange={handleChange}
                          required
                          disabled={!formData.standard}
                          style={{ borderColor: !formData.standard ? '#cbd5e1' : undefined }}
                        >
                          <option value="">{formData.standard ? 'Select Batch / બેચ પસંદ કરો' : 'Select Standard First'}</option>
                          {availableBatches.map(b => (
                            <option key={b._id} value={b.name}>{b.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {/* Faculty-specific fields */}
                {selectedRole === 'faculty' && (
                  <div className="portal-form-group">
                    <label className="portal-label">Subject / વિષય *</label>
                    <select
                      id="register-subject"
                      className="portal-input"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Subject / વિષય પસંદ કરો</option>
                      {SUBJECTS.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Username */}
                <div className="portal-form-group">
                  <label className="portal-label">
                    Username / યુઝરનેમ {selectedRole === 'student' ? '(auto / આપમેળે)' : '*'}
                  </label>
                  <input
                    id="register-username"
                    type="text"
                    className="portal-input"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder={selectedRole === 'student' ? 'e.g. 001RajPatel / દા.ત. 001રાજપટેલ' : 'Choose username / યુઝરનેમ પસંદ કરો'}
                    required
                    style={selectedRole === 'student' ? { background: '#f0f4f8' } : {}}
                  />
                  {selectedRole === 'student' && (
                    <span className="portal-field-help">Format: 3-digit roll + name / ફોર્મેટ: 3-અંકનો રોલ + નામ (e.g. 001RajPatel)</span>
                  )}
                </div>

                {/* Password */}
                <div className="portal-form-row">
                  <div className="portal-form-group">
                    <label className="portal-label">Password / પાસવર્ડ *</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        id="register-password"
                        type={showPass ? 'text' : 'password'}
                        className="portal-input"
                        placeholder="Set password / પાસવર્ડ સેટ કરો"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
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
                  <div className="portal-form-group">
                    <label className="portal-label">Confirm Password / પાસવર્ડ ખાતરી કરો *</label>
                    <input
                      id="register-confirm"
                      type="password"
                      className="portal-input"
                      placeholder="Confirm password / પાસવર્ડ ખાતરી કરો"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <button
                  id="register-submit"
                  type="submit"
                  className="portal-submit-btn"
                  style={{ background: `linear-gradient(135deg, ${roleConfig[selectedRole].color}dd, ${roleConfig[selectedRole].color})` }}
                  disabled={loading}
                >
                  <UserPlus size={16} />
                  {loading ? 'Registering... / નોંધણી થઈ રહી છે...' : `Create Account / એકાઉન્ટ બનાવો`}
                </button>
              </form>

              <div className="portal-form-footer">
                <p>Already have an account? / પહેલેથી એકાઉન્ટ છે? <Link to="/login">Sign in here / અહીં લૉગિન કરો</Link></p>
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
            <span>📧 perfectgrouptuition@gmail.com</span>
            <span>📞 +91 98765 43210</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
