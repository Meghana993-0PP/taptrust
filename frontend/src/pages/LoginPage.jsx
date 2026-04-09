import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiUrl } from '../services/apiBase';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please enter your email and password.'); return; }
    setLoading(true);
    try {
      console.log('[Auth] login request', {
        url: apiUrl('/auth/login'),
        email,
      });
      const res = await fetch(apiUrl('/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      console.log('[Auth] login response', {
        url: apiUrl('/auth/login'),
        status: res.status,
        ok: res.ok,
        response: data,
      });
      if (!res.ok) throw new Error(data.message || 'Invalid email or password.');
      const token = data?.data?.token;
      if (!token) throw new Error('No token received');
      localStorage.setItem('taptrust_token', token);
      const payload = JSON.parse(atob(token.split('.')[1]));
      const roleHome = { Customer: '/customer/search', Provider: '/provider/dashboard', Admin: '/admin/dashboard' };
      // For now just go to landing since other pages are removed
      alert(`Logged in as ${payload.role}: ${payload.email}`);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fdf6f0', display: 'flex', flexDirection: 'column' }}>
      {/* Nav */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '0 40px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img src="/logo.png" alt="TapTrust" style={{ width: 36, height: 36, objectFit: 'contain' }} onError={e => e.target.style.display = 'none'} />
          <span style={{ fontWeight: 900, fontSize: 22 }}><span style={{ color: '#c0392b' }}>Tap</span><span style={{ color: '#1a1a1a' }}>Trust</span></span>
        </a>
        <a href="/register" style={{ fontSize: 14, color: '#c0392b', fontWeight: 600, textDecoration: 'none' }}>Create account →</a>
      </nav>

      {/* Form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 20, boxShadow: '0 8px 40px rgba(0,0,0,0.1)', padding: '44px 40px' }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#1a1a1a', margin: '0 0 8px' }}>Welcome back</h1>
          <p style={{ fontSize: 14, color: '#888', marginBottom: 32 }}>Sign in to your TapTrust account</p>

          {error && (
            <div style={{ background: '#fff5f5', color: '#c0392b', border: '1px solid #ffd5d5', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 20 }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#333', display: 'block', marginBottom: 6 }}>Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" autoComplete="email"
                style={{ width: '100%', padding: '12px 16px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 15, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor = '#c0392b'}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#333', display: 'block', marginBottom: 6 }}>Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" autoComplete="current-password"
                style={{ width: '100%', padding: '12px 16px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 15, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor = '#c0392b'}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '13px', background: '#c0392b', color: '#fff',
              border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 16,
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
            }}>
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#888' }}>
            Don't have an account?{' '}
            <a href="/register" style={{ color: '#c0392b', fontWeight: 600, textDecoration: 'none' }}>Register</a>
          </p>
        </div>
      </div>
    </div>
  );
}
