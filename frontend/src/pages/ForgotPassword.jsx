import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../services/api';
import { Mail, ChevronLeft, ChevronRight, Clock, LogIn, UserPlus, CheckCircle, AlertCircle, Shield } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

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

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await forgotPassword({ email });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process request. Please try again. / વિનંતી પ્રક્રિયા નિષ્ફળ. ફરી પ્રયાસ કરો.');
    } finally {
      setLoading(false);
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
            <Link to="/register" className="portal-header-btn">
              <UserPlus size={15} /> Register / નોંધણી
            </Link>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="portal-breadcrumb">
        <div className="portal-breadcrumb-inner">
          <Link to="/login" className="portal-back-link">
            <ChevronLeft size={16} />
            Back to Login / લૉગિન પર પાછા
          </Link>
          <span className="portal-breadcrumb-sep">|</span>
          <Link to="/login" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>Home / હોમ</Link>
          <ChevronRight size={14} />
          <span className="active">Forgot Password / પાસવર્ડ ભૂલ્યા</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="portal-content">
        <div className="portal-grid portal-grid-fullwidth">
          <div className="portal-panel portal-panel-center">
            <div
              className="portal-panel-header"
              style={{ background: 'linear-gradient(135deg, #7c3aeddd, #7c3aed)' }}
            >
              <Shield size={20} />
              <span>Password Recovery / પાસવર્ડ રિકવરી</span>
            </div>

            <div className="portal-panel-body">
              {error && <div className="alert alert-error"><AlertCircle size={16} /> {error}</div>}

              {success ? (
                <div className="forgot-success-container">
                  <div className="forgot-success-icon">
                    <CheckCircle size={56} />
                  </div>
                  <h3>Reset Link Sent! / રીસેટ લિંક મોકલવામાં આવી છે!</h3>
                  <p>
                    A password reset link has been sent to <strong>{email}</strong>.
                    <br />
                    Please check your inbox (and spam folder) and click the link to create a new password.
                    <br /><br />
                    <span className="portal-gu-text"><strong>{email}</strong> પર પાસવર્ડ રીસેટ લિંક મોકલવામાં આવી છે. નવો પાસવર્ડ બનાવવા માટે કૃપા કરીને તમારું ઇનબૉક્સ તપાસો અને લિંક પર ક્લિક કરો.</span>
                  </p>
                  <Link to="/login" className="portal-submit-btn" style={{ textDecoration: 'none', display: 'inline-flex', marginTop: '16px' }}>
                    <LogIn size={16} />
                    Return to Login / લૉગિન પર પાછા ફરો
                  </Link>
                </div>
              ) : (
                <>
                  <div className="portal-notice">
                    <span className="portal-notice-hash">#</span>
                    <div>
                      Enter the email address associated with your account. We will send you a secure link to reset your password.
                      <br />
                      <span className="portal-gu-text">તમારા એકાઉન્ટ સાથે જોડાયેલ ઈમેલ એડ્રેસ દાખલ કરો. પાસવર્ડ રીસેટ કરવા માટે અમે તમને એક સુરક્ષિત લિંક મોકલીશું.</span>
                    </div>
                  </div>

                  <form onSubmit={handleForgotSubmit} className="portal-form">
                    <div className="portal-form-group">
                      <label className="portal-label">Registered Email Address / નોંધાયેલ ઈમેલ એડ્રેસ *</label>
                      <div className="portal-input-wrapper">
                        <Mail size={16} className="portal-input-icon" />
                        <input
                          id="forgot-email"
                          type="email"
                          className="portal-input"
                          placeholder="Enter your registered email / તમારો નોંધાયેલ ઈમેલ દાખલ કરો"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <button
                      id="forgot-submit"
                      type="submit"
                      className="portal-submit-btn"
                      style={{ background: 'linear-gradient(135deg, #7c3aeddd, #7c3aed)' }}
                      disabled={loading}
                    >
                      <Mail size={16} />
                      {loading ? 'Sending Link... / લિંક મોકલી રહ્યા છીએ...' : 'Send Reset Link / રીસેટ લિંક મોકલો'}
                    </button>
                  </form>
                </>
              )}

              <div className="portal-form-footer">
                <p>
                  Remember your password? / પાસવર્ડ યાદ છે? <Link to="/login">Login here / અહીં લૉગિન કરો</Link>
                  {' | '}
                  New user? / નવા વપરાશકર્તા? <Link to="/register">Register here / અહીં નોંધણી કરો</Link>
                </p>
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
            <span>📧 info@perfectgroup.com</span>
            <span>📞 +91 98765 43210</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
