import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { resetPassword } from '../services/api';
import { KeyRound, ChevronLeft, ChevronRight, Clock, LogIn, UserPlus, CheckCircle, AlertCircle, Eye, EyeOff, Shield } from 'lucide-react';

const ResetPassword = () => {
  const { token } = useParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
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

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match / પાસવર્ડ મેળ ખાતો નથી');
      return;
    }

    if (newPassword.length < 4) {
      setError('Password must be at least 4 characters / પાસવર્ડ ઓછામાં ઓછા 4 અક્ષરનો હોવો જોઈએ');
      return;
    }

    setLoading(true);

    try {
      await resetPassword({ token, newPassword });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. The link might be invalid or expired. / પાસવર્ડ રીસેટ નિષ્ફળ. લિંક અમાન્ય અથવા સમાપ્ત થઈ ગઈ હોઈ શકે છે.');
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
          <span className="active">Reset Password / પાસવર્ડ રીસેટ</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="portal-content">
        <div className="portal-grid portal-grid-fullwidth">
          <div className="portal-panel portal-panel-center">
            <div
              className="portal-panel-header"
              style={{ background: 'linear-gradient(135deg, #059669dd, #059669)' }}
            >
              <Shield size={20} />
              <span>Provide New Password / નવો પાસવર્ડ પ્રદાન કરો</span>
            </div>

            <div className="portal-panel-body">
              {error && <div className="alert alert-error"><AlertCircle size={16} /> {error}</div>}

              {success ? (
                <div className="forgot-success-container">
                  <div className="forgot-success-icon">
                    <CheckCircle size={56} />
                  </div>
                  <h3>Password Reset Successful! / પાસવર્ડ રીસેટ સફળ!</h3>
                  <p>
                    Your password has been reset successfully. You can now login with your new password.
                    <br />
                    <span className="portal-gu-text">તમારો પાસવર્ડ સફળતાપૂર્વક રીસેટ થયો છે. હવે તમે નવા પાસવર્ડ સાથે લૉગિન કરી શકો છો.</span>
                  </p>
                  <Link to="/login" className="portal-submit-btn" style={{ background: 'linear-gradient(135deg, #059669dd, #059669)', textDecoration: 'none', display: 'inline-flex', marginTop: '6px' }}>
                    <LogIn size={16} />
                    Go to Login / લૉગિન પર જાઓ
                  </Link>
                </div>
              ) : (
                <>
                  <div className="portal-notice" style={{ background: '#ecfdf5', borderColor: '#a7f3d0', color: '#065f46' }}>
                    <span className="portal-notice-hash" style={{ color: '#059669' }}>#</span>
                    <div>
                      Setup your new password below. Ensure it is at least 4 characters long.
                      <br />
                      <span className="portal-gu-text" style={{ color: '#047857' }}>નીચે તમારો નવો પાસવર્ડ સેટઅપ કરો. ખાતરી કરો કે તે ઓછામાં ઓછા 4 અક્ષરોનો છે.</span>
                    </div>
                  </div>

                  <form onSubmit={handleResetSubmit} className="portal-form">
                    <div className="portal-form-group">
                      <label className="portal-label">New Password / નવો પાસવર્ડ *</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          id="reset-new-password"
                          type={showPass ? 'text' : 'password'}
                          className="portal-input"
                          placeholder="Enter new password / નવો પાસવર્ડ દાખલ કરો"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
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
                      <span className="portal-field-help">Minimum 4 characters / ઓછામાં ઓછા 4 અક્ષર</span>
                    </div>

                    <div className="portal-form-group">
                      <label className="portal-label">Confirm New Password / નવો પાસવર્ડ ખાતરી કરો *</label>
                      <input
                        id="reset-confirm-password"
                        type="password"
                        className="portal-input"
                        placeholder="Confirm new password / નવો પાસવર્ડ ખાતરી કરો"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>

                    <button
                      id="reset-submit"
                      type="submit"
                      className="portal-submit-btn"
                      style={{ background: 'linear-gradient(135deg, #059669dd, #059669)' }}
                      disabled={loading}
                    >
                      <KeyRound size={16} />
                      {loading ? 'Resetting... / રીસેટ થઈ રહ્યું છે...' : 'Reset Password / પાસવર્ડ રીસેટ કરો'}
                    </button>
                  </form>
                </>
              )}

              <div className="portal-form-footer">
                <p>
                  Remember your password? / પાસવર્ડ યાદ છે? <Link to="/login">Login here / અહીં લૉગિન કરો</Link>
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

export default ResetPassword;
