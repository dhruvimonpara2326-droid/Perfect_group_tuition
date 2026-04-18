import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login } from '../services/api';
import { LogIn, Eye, EyeOff, Shield } from 'lucide-react';

const AdminLogin = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(formData);

      // Validate Admin Role strongly
      if (res.data.role !== 'admin') {
        setError('Access denied. Administrator privileges required.');
        setLoading(false);
        return;
      }

      loginUser(res.data);
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Invalid administrator credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="portal-page" style={{ alignItems: 'center', justifyContent: 'center', display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <div className="portal-panel" style={{ maxWidth: '400px', width: '100%', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <div className="portal-panel-header" style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)' }}>
          <Shield size={20} />
          <span>Admin Portal Login</span>
        </div>
        <div className="portal-panel-subheader" style={{ textAlign: 'center', padding: '20px 15px 10px' }}>
          Restricted Area. Authorized System Administrators Only.
        </div>
        <div className="portal-panel-body">
          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit} className="portal-form">
            <div className="portal-form-group">
              <label className="portal-label">Admin Username</label>
              <div className="portal-input-wrapper">
                <Shield size={16} className="portal-input-icon" />
                <input
                  type="text"
                  className="portal-input"
                  placeholder="Enter administrator username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="portal-form-group">
              <label className="portal-label">Admin Password</label>
              <div className="portal-input-wrapper">
                <Eye size={16} className="portal-input-icon" />
                <input
                  type={showPass ? 'text' : 'password'}
                  className="portal-input"
                  placeholder="Enter administrator password"
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
              type="submit"
              className="portal-submit-btn"
              disabled={loading}
              style={{ background: 'linear-gradient(135deg, #0f172a, #334155)' }}
            >
              <LogIn size={16} />
              {loading ? 'Authenticating...' : 'Secure Login'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 15, fontSize: 13, color: '#64748b' }}>
            <Link to="/login" style={{ color: '#2563eb', textDecoration: 'none' }}>
              ← Return to Student/Faculty Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
