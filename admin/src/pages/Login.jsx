import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login } from '../services/api';
import { LogIn, Eye, EyeOff, Shield, Mail } from 'lucide-react';

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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background grid pattern */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(99,102,241,0.15) 1px, transparent 0)',
        backgroundSize: '40px 40px'
      }} />

      {/* Glow effects */}
      <div style={{
        position: 'absolute', top: '20%', left: '20%',
        width: 300, height: 300,
        background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '20%', right: '20%',
        width: 250, height: 250,
        background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none'
      }} />

      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: 420, padding: '0 20px'
      }}>
        {/* Logo / Brand */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 72, height: 72,
            margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <img src="/pgt-logo.svg" alt="PGT Logo" style={{ width: '100%', height: '100%', borderRadius: '50%', boxShadow: '0 0 40px rgba(199,16,121,0.3)' }} />
          </div>
          <h1 style={{
            color: 'white', fontSize: 26, fontWeight: 800,
            margin: '0 0 6px', letterSpacing: '-0.5px'
          }}>Admin Portal</h1>
          <p style={{ color: '#94a3b8', fontSize: 14, margin: 0 }}>
            Perfect Group Tuition — Restricted Access
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(30,41,59,0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 20,
          padding: '32px 28px',
          boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
        }}>
          {error && (
            <div style={{
              background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)',
              borderRadius: 10, padding: '12px 16px', marginBottom: 20,
              color: '#fca5a5', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8
            }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', color: '#cbd5e1', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                Admin Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{
                  position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                  color: '#64748b', pointerEvents: 'none'
                }} />
                <input
                  id="admin-email"
                  type="text"
                  placeholder="Enter admin email"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  style={{
                    width: '100%', padding: '12px 14px 12px 42px',
                    background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(99,102,241,0.25)',
                    borderRadius: 10, color: 'white', fontSize: 14, outline: 'none',
                    boxSizing: 'border-box', transition: 'border-color 0.2s',
                    fontFamily: 'inherit'
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.6)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(99,102,241,0.25)'}
                />
              </div>
            </div>

            {/* Password Field */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', color: '#cbd5e1', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Shield size={16} style={{
                  position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                  color: '#64748b', pointerEvents: 'none'
                }} />
                <input
                  id="admin-password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Enter admin password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  style={{
                    width: '100%', padding: '12px 44px 12px 42px',
                    background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(99,102,241,0.25)',
                    borderRadius: 10, color: 'white', fontSize: 14, outline: 'none',
                    boxSizing: 'border-box', transition: 'border-color 0.2s',
                    fontFamily: 'inherit'
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.6)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(99,102,241,0.25)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 4
                  }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              id="admin-login-submit"
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '13px',
                background: loading ? '#334155' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                border: 'none', borderRadius: 10, color: 'white',
                fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s', fontFamily: 'inherit',
                boxShadow: loading ? 'none' : '0 4px 15px rgba(99,102,241,0.4)'
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <LogIn size={18} />
              {loading ? 'Authenticating...' : 'Secure Login'}
            </button>
          </form>

          <div style={{
            marginTop: 24, padding: '12px 16px',
            background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)',
            borderRadius: 10, textAlign: 'center'
          }}>
            <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>
              🔒 This portal is restricted to authorized administrators only.
            </p>
          </div>
        </div>

        <p style={{ textAlign: 'center', color: '#475569', fontSize: 12, marginTop: 20 }}>
          © 2026 Perfect Group Tuition. Administrator Access Only.
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: #475569; }
      `}</style>
    </div>
  );
};

export default AdminLogin;
