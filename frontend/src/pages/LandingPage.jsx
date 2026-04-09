import { useState, useEffect, useRef } from 'react';
import { apiUrl } from '../services/apiBase';

const C = {
  primary: '#2a9d8f',
  primaryDark: '#1f7a6e',
  accent: '#e9c46a',
  navy: '#1a2e44',
  cream: '#f0faf9',
  text: '#1a2e44',
  gray: '#4a6274',
  white: '#fff',
};

const PROVIDER_CATEGORIES = [
  'Plumbing',
  'Electrical',
  'Cleaning',
  'Painting',
  'Carpentry',
  'General Construction',
];

// ── helpers ──────────────────────────────────────────────────────────────────
function getUser() {
  try {
    const t = localStorage.getItem('taptrust_token');
    if (!t) return null;
    const p = JSON.parse(atob(t.split('.')[1]));
    if (p.exp && p.exp * 1000 < Date.now()) { localStorage.removeItem('taptrust_token'); return null; }
    return p;
  } catch { return null; }
}

// ── Root ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [modal, setModal] = useState(null);
  const [user, setUser] = useState(getUser);
  const open = (tab) => setModal(tab);
  const close = () => setModal(null);

  // Fetch real user profile (name from DB) on mount if logged in
  useEffect(() => {
    const token = localStorage.getItem('taptrust_token');
    if (!token || !user) return;
    fetch(apiUrl('/auth/me'), { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d?.data) setUser(prev => ({ ...prev, ...d.data })); })
      .catch(() => {});
  }, []);

  const onLogin = (u) => {
    const token = localStorage.getItem('taptrust_token');
    if (token) {
      fetch(apiUrl('/auth/me'), { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => { setUser(d?.data ? { ...u, ...d.data } : u); })
        .catch(() => setUser(u));
    } else {
      setUser(u);
    }
    close();
  };
  const onLogout = () => { localStorage.removeItem('taptrust_token'); setUser(null); };

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: C.white, color: C.text, overflowX: 'hidden' }}>
      <Navbar open={open} user={user} onLogout={onLogout} />
      <Hero open={open} user={user} />
      <HowItWorks />
      <Services open={open} user={user} />
      <Professionals open={open} user={user} />
      <WhyTrust />
      <BookingSection open={open} user={user} />
      {user?.role === 'Customer' && <CustomerSection user={user} />}
      <Reviews />
      <Footer open={open} />
      {modal && <AuthModal tab={modal} setTab={setModal} close={close} onLogin={onLogin} />}
    </div>
  );
}

// ── Navbar ────────────────────────────────────────────────────────────────────
function Navbar({ open, user, onLogout }) {
  const [scrolled, setScrolled] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    const fn = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const initial = user?.name ? user.name[0].toUpperCase() : user?.email?.[0]?.toUpperCase() || '?';

  return (
    <nav style={{ position: 'sticky', top: 0, zIndex: 200, background: C.white, borderBottom: '1px solid #e0f0ee', boxShadow: scrolled ? '0 2px 16px rgba(42,157,143,0.1)' : 'none', transition: 'box-shadow 0.2s' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 68 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/logo.png" alt="TapTrust" style={{ width: 36, height: 36, objectFit: 'contain' }} onError={e => e.target.style.display = 'none'} />
          <span style={{ fontWeight: 900, fontSize: 22 }}><span style={{ color: C.primary }}>Tap</span><span style={{ color: C.text }}>Trust</span></span>
        </div>
        <div style={{ display: 'flex', gap: 32 }}>
          {[['How it works', '#how'], ['Services', '#services'], ['Professionals', '#pros'], ['Reviews', '#reviews']].map(([label, href]) => (
            <a key={label} href={href} style={{ fontSize: 14, color: C.text, textDecoration: 'none', fontWeight: 500 }}
              onMouseEnter={e => e.target.style.color = C.primary} onMouseLeave={e => e.target.style.color = C.text}
            >{label}</a>
          ))}
        </div>
        {user ? (
          <div ref={dropRef} style={{ position: 'relative' }}>
            <button onClick={() => setDropOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 10, background: C.cream, border: `1.5px solid ${C.primary}`, borderRadius: 30, padding: '6px 16px 6px 6px', cursor: 'pointer' }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: C.primary, color: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15 }}>{initial}</div>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{user.name || user.email?.split('@')[0]}</span>
              <span style={{ fontSize: 10, color: C.gray, marginLeft: 2 }}>▼</span>
            </button>
            {dropOpen && (
              <div style={{ position: 'absolute', top: '110%', right: 0, background: C.white, borderRadius: 14, boxShadow: '0 8px 32px rgba(26,46,68,0.15)', minWidth: 220, overflow: 'hidden', border: '1px solid #e0f0ee' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #e0f0ee', background: C.cream }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: C.text }}>{user.name || user.email?.split('@')[0] || 'User'}</div>
                  <div style={{ fontSize: 12, color: C.gray, marginTop: 2 }}>{user.email}</div>
                </div>
                {user.role === 'Provider' && (
                  <DropItem icon="📊" label="My Dashboard" onClick={() => { window.location.href = '/provider/dashboard'; }} />
                )}
                {user.role === 'Customer' && (
                  <>
                    <DropItem icon="📋" label="My Bookings" onClick={() => document.getElementById('customer-section')?.scrollIntoView({ behavior: 'smooth' })} />
                    <DropItem icon="💳" label="Payment History" onClick={() => document.getElementById('customer-section')?.scrollIntoView({ behavior: 'smooth' })} />
                  </>
                )}
                {user.role === 'Admin' && (
                  <DropItem icon="⚙️" label="Admin Panel" onClick={() => { window.location.href = '/admin/dashboard'; }} />
                )}
                <div style={{ borderTop: '1px solid #e0f0ee' }}>
                  <DropItem icon="🚪" label="Sign Out" onClick={onLogout} danger />
                </div>
              </div>
            )}
          </div>
        ) : (
          <button onClick={() => open('signin')} style={{ background: C.primary, color: C.white, border: 'none', padding: '10px 26px', borderRadius: 30, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
            onMouseEnter={e => e.target.style.background = C.primaryDark} onMouseLeave={e => e.target.style.background = C.primary}
          >Get Started</button>
        )}
      </div>
    </nav>
  );
}

function DropItem({ icon, label, onClick, danger }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', background: hov ? C.cream : 'transparent', border: 'none', cursor: 'pointer', fontSize: 14, color: danger ? '#e74c3c' : C.text, fontWeight: 500, textAlign: 'left' }}>
      <span>{icon}</span>{label}
    </button>
  );
}

// ── Auth Modal ────────────────────────────────────────────────────────────────
function AuthModal({ tab, setTab, close, onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('Customer');
  const [serviceCategory, setServiceCategory] = useState(PROVIDER_CATEGORIES[0]);
  const [yearsExperience, setYearsExperience] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setError('');
    setEmail('');
    setPassword('');
    setName('');
    setPhone('');
    setRole('Customer');
    setServiceCategory(PROVIDER_CATEGORIES[0]);
    setYearsExperience('');
    setHourlyRate('');
  }, [tab]);

  async function handleSignIn(e) {
    e.preventDefault(); setError('');
    if (!email || !password) { setError('Please enter email and password.'); return; }
    setLoading(true);
    try {
      console.log('[Auth] login request', {
        url: apiUrl('/auth/login'),
        email,
      });
      const res = await fetch(apiUrl('/auth/login'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const data = await res.json();
      console.log('[Auth] login response', {
        url: apiUrl('/auth/login'),
        status: res.status,
        ok: res.ok,
        response: data,
      });
      if (!res.ok) throw new Error(data.message || 'Invalid credentials.');
      const token = data?.data?.token;
      if (!token) throw new Error('No token received');
      localStorage.setItem('taptrust_token', token);
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.role === 'Provider') { window.location.href = '/provider/dashboard'; return; }
      if (payload.role === 'Admin') { window.location.href = '/admin/dashboard'; return; }
      onLogin(payload);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }

  async function handleSignUp(e) {
    e.preventDefault(); setError('');
    if (!name || !email || !password || !phone) { setError('Please fill all fields.'); return; }
    if (role === 'Provider' && (!serviceCategory || yearsExperience === '' || hourlyRate === '')) {
      setError('Please complete your provider profile details.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name,
        email,
        password,
        phone,
        role,
        ...(role === 'Provider' ? {
          service_category: serviceCategory,
          years_experience: Number(yearsExperience),
          hourly_rate: Number(hourlyRate),
        } : {}),
      };
      console.log('[Auth] signup request', {
        url: apiUrl('/auth/register'),
        payload: {
          ...payload,
          password: '[redacted]',
        },
      });
      const res = await fetch(apiUrl('/auth/register'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      console.log('[Auth] signup response', {
        url: apiUrl('/auth/register'),
        status: res.status,
        ok: res.ok,
        response: data,
      });
      if (!res.ok) throw new Error(data.message || 'Registration failed.');
      setTab('signin');
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(26,46,68,0.55)', backdropFilter: 'blur(4px)' }} onClick={close} />
      <div style={{ position: 'relative', zIndex: 1, background: '#f0faf9', borderRadius: 24, padding: '40px 36px', width: '100%', maxWidth: 440, boxShadow: '0 24px 64px rgba(26,46,68,0.25)' }}>
        <button onClick={close} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: C.gray }}>✕</button>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: C.text, margin: '0 0 6px' }}>Welcome to TapTrust</h2>
        <p style={{ fontSize: 14, color: C.gray, marginBottom: 28 }}>Join thousands of happy households.</p>
        <div style={{ display: 'flex', background: '#d4eeeb', borderRadius: 12, padding: 4, marginBottom: 28 }}>
          {['signin', 'signup'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 14, background: tab === t ? C.white : 'transparent', color: tab === t ? C.primary : C.gray, boxShadow: tab === t ? '0 2px 8px rgba(0,0,0,0.1)' : 'none' }}>
              {t === 'signin' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>
        {error && <div style={{ background: '#e8f8f6', color: C.primary, border: '1px solid #a8ddd8', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>⚠️ {error}</div>}
        {tab === 'signin' ? (
          <form onSubmit={handleSignIn}>
            <Field label="PHONE / EMAIL" placeholder="Your phone or email" type="text" value={email} onChange={setEmail} />
            <Field label="PASSWORD" placeholder="••••••••" type="password" value={password} onChange={setPassword} />
            <SubmitBtn loading={loading} label="Sign In →" />
          </form>
        ) : (
          <form onSubmit={handleSignUp}>
            <Field label="FULL NAME" placeholder="Your full name" type="text" value={name} onChange={setName} />
            <Field label="PHONE" placeholder="10-digit mobile number" type="tel" value={phone} onChange={setPhone} />
            <Field label="EMAIL" placeholder="you@example.com" type="email" value={email} onChange={setEmail} />
            <Field label="PASSWORD" placeholder="Create a password" type="password" value={password} onChange={setPassword} />
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.gray, display: 'block', marginBottom: 6 }}>I AM A</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {['Customer', 'Provider'].map(r => (
                  <button key={r} type="button" onClick={() => setRole(r)} style={{ flex: 1, padding: '10px', border: `2px solid ${role === r ? C.primary : '#e0f0ee'}`, borderRadius: 10, background: role === r ? '#e8f8f6' : C.white, color: role === r ? C.primary : C.gray, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>{r}</button>
                ))}
              </div>
            </div>
            {role === 'Provider' && (
              <div style={{ marginBottom: 20, background: 'linear-gradient(160deg, #f8fffe, #e6f7f4 60%, #dbf1ed)', border: '1px solid #b7e3dd', borderRadius: 20, padding: '18px 16px 16px', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)' }}>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: C.text }}>Provider Profile</div>
                  <div style={{ fontSize: 13, color: C.gray, marginTop: 3 }}>A few quick details to help customers trust your profile faster.</div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                  {['Verified category', 'Visible experience', 'Starter pricing'].map(item => (
                    <span key={item} style={{ padding: '7px 10px', borderRadius: 999, background: C.white, border: '1px solid #cdeae5', fontSize: 12, fontWeight: 700, color: C.gray }}>{item}</span>
                  ))}
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.gray, display: 'block', marginBottom: 6 }}>SERVICE CATEGORY</label>
                  <div style={{ position: 'relative', background: C.white, border: '1.5px solid #cfeae6', borderRadius: 14, boxShadow: '0 8px 20px rgba(42,157,143,0.06)' }}>
                    <select
                      value={serviceCategory}
                      onChange={e => setServiceCategory(e.target.value)}
                      style={{ width: '100%', padding: '14px 48px 14px 42px', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 600, outline: 'none', boxSizing: 'border-box', background: 'transparent', color: C.text, appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none', cursor: 'pointer' }}
                    >
                      {PROVIDER_CATEGORIES.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                    <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 15, pointerEvents: 'none' }}>🛠️</span>
                    <span style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', color: C.primaryDark, fontSize: 12, pointerEvents: 'none' }}>▼</span>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="YEARS OF EXPERIENCE" placeholder="e.g. 3" type="number" value={yearsExperience} onChange={setYearsExperience} />
                  <Field label="HOURLY RATE (INR)" placeholder="e.g. 500" type="number" value={hourlyRate} onChange={setHourlyRate} />
                </div>
              </div>
            )}
            <SubmitBtn loading={loading} label="Create Account →" />
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ label, placeholder, type, value, onChange }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.gray, display: 'block', marginBottom: 6 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', padding: '13px 16px', border: '1.5px solid #d4eeeb', borderRadius: 10, fontSize: 15, outline: 'none', boxSizing: 'border-box', background: C.white }}
        onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = '#d4eeeb'} />
    </div>
  );
}

function SubmitBtn({ loading, label }) {
  return (
    <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', background: C.primary, color: C.white, border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: 4 }}>
      {loading ? 'Please wait…' : label}
    </button>
  );
}

// ── Customer Section ──────────────────────────────────────────────────────────
function CustomerSection({ user }) {
  const [tab, setTab] = useState('bookings');
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('taptrust_token');
    if (!token) return;
    setLoading(true);
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(apiUrl('/bookings'), { headers }).then(r => r.json()).catch(() => ({ data: [] })),
      fetch(apiUrl('/payments'), { headers }).then(r => r.json()).catch(() => ({ data: [] })),
    ]).then(([b, p]) => {
      setBookings(b?.data?.bookings || b?.data || []);
      setPayments(p?.data?.payments || p?.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const statusColor = (s) => ({ pending: '#e9c46a', confirmed: '#2a9d8f', completed: '#16a34a', cancelled: '#e74c3c' }[s?.toLowerCase()] || C.gray);

  return (
    <section id="customer-section" style={{ padding: '80px 0', background: C.cream }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 40px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: C.primary, marginBottom: 10 }}>My Account</div>
        <div style={{ fontSize: 32, fontWeight: 900, marginBottom: 32 }}>Hello, {user.name || 'there'} 👋</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
          {[['bookings', '📋 My Bookings'], ['payments', '💳 Payment History']].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} style={{ padding: '10px 24px', borderRadius: 30, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, background: tab === k ? C.primary : C.white, color: tab === k ? C.white : C.gray, boxShadow: tab === k ? '0 4px 12px rgba(42,157,143,0.3)' : '0 2px 8px rgba(0,0,0,0.06)' }}>{l}</button>
          ))}
        </div>
        {loading ? <div style={{ textAlign: 'center', padding: 40, color: C.gray }}>Loading…</div> : (
          tab === 'bookings' ? (
            bookings.length === 0 ? <EmptyState icon="📋" msg="No bookings yet. Book your first service!" /> : (
              <div style={{ display: 'grid', gap: 16 }}>
                {bookings.map((b, i) => (
                  <div key={b.id || i} style={{ background: C.white, borderRadius: 16, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{b.service_name || b.service || 'Service'}</div>
                      <div style={{ fontSize: 13, color: C.gray, marginTop: 4 }}>{b.provider_name || 'Provider'} · {b.scheduled_date ? new Date(b.scheduled_date).toLocaleDateString('en-IN') : 'Date TBD'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: statusColor(b.status), background: statusColor(b.status) + '20', padding: '4px 12px', borderRadius: 20 }}>{b.status || 'Pending'}</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginTop: 6 }}>₹{b.total_amount || b.amount || '—'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            payments.length === 0 ? <EmptyState icon="💳" msg="No payment history yet." /> : (
              <div style={{ display: 'grid', gap: 16 }}>
                {payments.map((p, i) => (
                  <div key={p.id || i} style={{ background: C.white, borderRadius: 16, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{p.description || 'Payment'}</div>
                      <div style={{ fontSize: 13, color: C.gray, marginTop: 4 }}>{p.created_at ? new Date(p.created_at).toLocaleDateString('en-IN') : ''} · {p.payment_method || 'Online'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 16, fontWeight: 900, color: C.primary }}>₹{p.amount || '—'}</div>
                      <div style={{ fontSize: 12, color: p.status === 'completed' ? '#16a34a' : C.gray, marginTop: 4 }}>{p.status || 'Completed'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )
        )}
      </div>
    </section>
  );
}

function EmptyState({ icon, msg }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: C.gray }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
      <div style={{ fontSize: 16 }}>{msg}</div>
    </div>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────
function Hero({ open, user }) {
  return (
    <section style={{ background: C.cream, padding: '90px 0 70px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 40px', display: 'flex', alignItems: 'center', gap: 60 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#e8f8f6', border: '1px solid #a8ddd8', borderRadius: 30, padding: '6px 16px', marginBottom: 28, fontSize: 13, color: C.primary, fontWeight: 600 }}>
            🔒 Verified &amp; Trusted Platform
          </div>
          <h1 style={{ fontSize: 62, fontWeight: 900, lineHeight: 1.08, margin: '0 0 22px' }}>
            Tap once,<br /><span style={{ color: C.primary }}>Trust always.</span>
          </h1>
          <p style={{ fontSize: 18, color: C.gray, lineHeight: 1.7, marginBottom: 36, maxWidth: 440 }}>
            Connect with background-verified home service professionals — transparent pricing, real-time tracking, quality guaranteed.
          </p>
          <div style={{ display: 'flex', gap: 16 }}>
            <button onClick={() => user ? document.getElementById('customer-section')?.scrollIntoView({ behavior: 'smooth' }) : open('signin')}
              style={{ background: C.primary, color: C.white, border: 'none', padding: '14px 32px', borderRadius: 30, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
              {user ? 'My Bookings' : 'Book a Service'}
            </button>
            <button onClick={() => user ? document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' }) : open('signup')} style={{ background: 'transparent', color: C.primary, border: `2px solid ${C.primary}`, padding: '14px 32px', borderRadius: 30, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
              {user ? 'Browse Services' : 'Meet Professionals'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: 48, marginTop: 52 }}>
            {[['500+', 'Verified Pros'], ['4.8★', 'Avg Rating'], ['10K+', 'Bookings Done']].map(([v, l]) => (
              <div key={l}><div style={{ fontSize: 30, fontWeight: 900 }}>{v}</div><div style={{ fontSize: 13, color: C.gray, marginTop: 2 }}>{l}</div></div>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', position: 'relative', minHeight: 480 }}>
          <PhoneMockup />
        </div>
      </div>
    </section>
  );
}

function PhoneMockup() {
  return (
    <div style={{ position: 'relative', width: 290 }}>
      <div style={{ position: 'absolute', top: 100, left: -50, background: C.white, borderRadius: 14, padding: '12px 16px', boxShadow: '0 6px 24px rgba(0,0,0,0.13)', textAlign: 'center', zIndex: 2 }}>
        <div style={{ fontSize: 26 }}>✅</div><div style={{ fontSize: 12, fontWeight: 700, marginTop: 4 }}>Verified</div><div style={{ fontSize: 10, color: '#888' }}>Background checked</div>
      </div>
      <div style={{ position: 'absolute', bottom: 80, right: -40, background: C.white, borderRadius: 14, padding: '10px 14px', boxShadow: '0 6px 24px rgba(0,0,0,0.13)', textAlign: 'center', zIndex: 2 }}>
        <div style={{ fontSize: 22 }}>⭐</div><div style={{ fontSize: 15, fontWeight: 900 }}>4.9/5</div><div style={{ fontSize: 10, color: '#888' }}>Customer rating</div>
      </div>
      <div style={{ background: C.white, borderRadius: 36, boxShadow: '0 24px 64px rgba(0,0,0,0.16)', padding: '22px 18px', border: '8px solid #1a2e44', position: 'relative', zIndex: 1 }}>
        <div style={{ width: 80, height: 20, background: '#1a2e44', borderRadius: 10, margin: '0 auto 18px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div><div style={{ fontSize: 11, color: '#999' }}>Good morning! 👋</div><div style={{ fontSize: 16, fontWeight: 800 }}>Find a Pro</div></div>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: C.primary, color: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>TT</div>
        </div>
        <div style={{ background: '#f5f5f5', borderRadius: 10, padding: '9px 12px', fontSize: 12, color: '#999', marginBottom: 14 }}>🔍 Search services near you...</div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {['Plumber', 'Electrician', 'Cleaner'].map((c, i) => (
            <span key={c} style={{ background: i === 0 ? C.primary : '#f0f0f0', color: i === 0 ? C.white : '#333', borderRadius: 20, padding: '4px 10px', fontSize: 10, fontWeight: 600 }}>{c}</span>
          ))}
        </div>
        {[{ name: 'Rajan Kumar', role: 'Senior Plumber', icon: '🔧', price: '₹350/hr', rating: '4.9' }, { name: 'Anil Sharma', role: 'Electrician', icon: '⚡', price: '₹400/hr', rating: '4.8' }].map(p => (
          <div key={p.name} style={{ background: '#fafafa', borderRadius: 10, padding: '10px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{p.icon}</div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 700 }}>{p.name}</div><div style={{ fontSize: 10, color: '#888' }}>{p.role}</div><div style={{ fontSize: 10, color: '#f59e0b' }}>★★★★★ {p.rating}</div></div>
            <div style={{ textAlign: 'right' }}><div style={{ fontSize: 11, fontWeight: 700 }}>{p.price}</div><div style={{ background: C.primary, color: C.white, borderRadius: 6, padding: '3px 8px', fontSize: 10, fontWeight: 700, marginTop: 4 }}>Book</div></div>
          </div>
        ))}
        <div style={{ background: '#e8f8f6', border: '1px solid #a8ddd8', borderRadius: 8, padding: '6px 10px', fontSize: 10, color: C.primary, fontWeight: 600, textAlign: 'center' }}>✅ All pros background-verified</div>
      </div>
    </div>
  );
}

// ── How It Works ──────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    { n: '01', icon: '🔍', title: 'Search & Browse', desc: 'Find verified professionals by category, location, and ratings.' },
    { n: '02', icon: '📋', title: 'View & Compare', desc: 'Check fixed transparent pricing, reviews, and credentials.' },
    { n: '03', icon: '📅', title: 'Book Instantly', desc: 'Pick your time slot and confirm with secure payment.' },
    { n: '04', icon: '📍', title: 'Track in Real-Time', desc: "Follow your professional's location and get live updates." },
    { n: '05', icon: '🌟', title: 'Rate & Review', desc: 'Share your experience to help the community.' },
  ];
  return (
    <section id="how" style={{ padding: '80px 0', background: C.white }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 40px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: C.primary, marginBottom: 10 }}>Process</div>
        <div style={{ fontSize: 36, fontWeight: 900, marginBottom: 12 }}>How TapTrust works</div>
        <div style={{ fontSize: 16, color: C.gray, marginBottom: 48 }}>From search to service completion — seamlessly simple, completely trusted.</div>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {steps.map(s => (
            <div key={s.n} style={{ flex: '1 1 160px', background: C.cream, borderRadius: 16, padding: '28px 20px', minWidth: 160 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: C.primary, marginBottom: 10, letterSpacing: 1 }}>{s.n}</div>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{s.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{s.title}</div>
              <div style={{ fontSize: 13, color: C.gray, lineHeight: 1.6 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Services ──────────────────────────────────────────────────────────────────
const SERVICE_DATA = [
  { icon: '🔧', name: 'Plumbing', price: '₹299', subs: ['Tap repair','Pipe leakage fix','Bathroom fittings','Water motor repair','Borewell maintenance','Overhead tank setup','Shower installation','Water pressure fixing','RO purifier installation'] },
  { icon: '⚡', name: 'Electrical', price: '₹349', subs: ['Switch & wiring','Fan repair','Light installation','CCTV wiring','Doorbell installation','Generator setup','UPS repair','Smart home wiring','Earthing setup'] },
  { icon: '🧹', name: 'Deep Cleaning', price: '₹499', subs: ['Full home cleaning','Kitchen cleaning','Bathroom cleaning','Post-construction cleaning','Move-in/move-out cleaning','Water tank cleaning','Mattress sanitization','Curtain cleaning','Balcony cleaning'] },
  { icon: '🪚', name: 'Carpentry', price: '₹399', subs: ['Cupboard & drawer','Kitchen fittings','Shelves & decor','Wooden door repair','Window frame fixing','Bed assembly','Office furniture setup','Wooden flooring repair','Polishing & varnishing'] },
  { icon: '❄️', name: 'AC & Appliances', price: '₹599', subs: ['AC repair','AC installation/uninstallation','TV installation','Dishwasher repair','Chimney cleaning & repair','Geyser repair & installation','Induction stove repair','Washing machine repair','Refrigerator repair'] },
  { icon: '🎨', name: 'Painting', price: '₹899', subs: ['Interior painting','Exterior painting','Texture painting','Wallpaper installation','Wallpaper removal','False ceiling work','Tile fixing','Modular kitchen renovation','Wood polish'] },
  { icon: '🐛', name: 'Pest Control', price: '₹799', subs: ['Cockroach treatment','Termite control','Bed bug treatment','Mosquito control','Rodent control','Ant control','General pest spray','Pre-construction treatment','Herbal pest control'] },
  { icon: '🗄️', name: 'Handyman', price: '₹199', subs: ['Mirror installation','Hanging photo frames','Door lock repair','Small drilling work','Net/mesh installation','Curtain rod fitting','TV wall mount','Shelf installation','Furniture assembly'] },
  { icon: '🌿', name: 'Outdoor Services', price: '₹349', subs: ['Garden maintenance','Tree trimming','Landscape design','Compost setup','Terrace cleaning','Rainwater harvesting setup','Lawn mowing','Plant care','Outdoor cleaning'] },
  { icon: '🔒', name: 'Safety & Security', price: '₹499', subs: ['CCTV installation','Video door phone','Fire alarm setup','Motion sensor lights','Intercom installation','Smart lock setup','Security audit','Smoke detector','Emergency lighting'] },
  { icon: '📦', name: 'Moving & Packing', price: '₹999', subs: ['Home relocation','Office relocation','Vehicle transport','Storage services','Packing material supply','Furniture disassembly','Loading & unloading','International packing','Fragile item packing'] },
  { icon: '📱', name: 'Tech Services', price: '₹299', subs: ['WiFi router setup','Smart TV setup','Laptop repair at home','Mobile screen replacement','CCTV setup','Printer setup','Data recovery','Smart home setup','Gaming console repair'] },
];

function Services({ open, user }) {
  const [selected, setSelected] = useState(null);

  function handleClick(s) {
    if (!user) { open('signin'); return; }
    setSelected(s);
  }

  return (
    <section id="services" style={{ padding: '80px 0', background: C.cream }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 40px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: C.primary, marginBottom: 10 }}>Services</div>
        <div style={{ fontSize: 36, fontWeight: 900, marginBottom: 12 }}>What we cover</div>
        <div style={{ fontSize: 16, color: C.gray, marginBottom: 48 }}>Click any service to see all sub-services.</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 20 }}>
          {SERVICE_DATA.map(s => (
            <div key={s.name} onClick={() => handleClick(s)}
              style={{ background: C.white, borderRadius: 16, padding: '24px 16px', textAlign: 'center', cursor: 'pointer', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', transition: 'all 0.2s', border: selected?.name === s.name ? `2px solid ${C.primary}` : '2px solid transparent' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(42,157,143,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>{s.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{s.name}</div>
              <div style={{ fontSize: 12, color: C.primary, fontWeight: 600 }}>From {s.price}</div>
            </div>
          ))}
        </div>

        {/* Sub-services panel */}
        {selected && (
          <div style={{ marginTop: 32, background: C.white, borderRadius: 20, padding: '32px', boxShadow: '0 4px 24px rgba(42,157,143,0.12)', border: `1px solid ${C.primary}30` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 32 }}>{selected.icon}</span>
                <div>
                  <div style={{ fontWeight: 900, fontSize: 20, color: C.text }}>{selected.name}</div>
                  <div style={{ fontSize: 13, color: C.primary, fontWeight: 600 }}>Starting from {selected.price}</div>
                </div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: '#f0f0f0', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {selected.subs.map(sub => (
                <div key={sub} onClick={() => document.getElementById('book')?.scrollIntoView({ behavior: 'smooth' })}
                  style={{ background: C.cream, borderRadius: 12, padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#d4eeeb'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = C.cream; e.currentTarget.style.transform = 'translateX(0)'; }}>
                  <span style={{ color: C.primary, fontSize: 16 }}>→</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{sub}</span>
                </div>
              ))}
            </div>
            <button onClick={() => document.getElementById('book')?.scrollIntoView({ behavior: 'smooth' })}
              style={{ marginTop: 24, background: C.primary, color: C.white, border: 'none', padding: '12px 32px', borderRadius: 30, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
              Book {selected.name} →
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

// ── Professionals ─────────────────────────────────────────────────────────────
function Professionals({ open, user }) {
  const pros = [
    { icon: '🔧', name: 'Rajan Kumar', role: 'Master Plumber · 8 yrs', tags: ['Pipe Repair', 'Drainage', 'Installation'], badge: 'Background Verified · Skill Certified', rating: '4.9', reviews: 142, price: '₹350/hr' },
    { icon: '⚡', name: 'Anil Sharma', role: 'Certified Electrician · 12 yrs', tags: ['Wiring', 'Switches', 'Short Circuit'], badge: 'Background Verified · Govt. Licensed', rating: '4.8', reviews: 198, price: '₹400/hr' },
    { icon: '🧹', name: 'Priya Devi', role: 'Deep Clean Specialist · 5 yrs', tags: ['Full Home', 'Kitchen', 'Bathroom'], badge: 'Background Verified · ID Checked', rating: '4.9', reviews: 87, price: '₹499/visit' },
  ];
  return (
    <section id="pros" style={{ padding: '80px 0', background: C.white }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 40px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: C.primary, marginBottom: 10 }}>Our Pros</div>
        <div style={{ fontSize: 36, fontWeight: 900, marginBottom: 12 }}>Meet verified professionals</div>
        <div style={{ fontSize: 16, color: C.gray, marginBottom: 48 }}>Every professional is background-checked, skill-certified, and rated by real customers.</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
          {pros.map(p => (
            <div key={p.name} style={{ background: C.cream, borderRadius: 20, padding: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>{p.icon}</div>
                <div><div style={{ fontWeight: 800, fontSize: 16 }}>{p.name}</div><div style={{ fontSize: 13, color: C.gray }}>{p.role}</div></div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                {p.tags.map(t => <span key={t} style={{ background: C.white, border: '1px solid #d4eeeb', borderRadius: 20, padding: '3px 10px', fontSize: 11, color: C.gray }}>{t}</span>)}
              </div>
              <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 600, marginBottom: 14 }}>✅ {p.badge}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div><span style={{ color: '#f59e0b' }}>★★★★★</span><span style={{ fontWeight: 800, marginLeft: 4 }}>{p.rating}</span><span style={{ fontSize: 12, color: C.gray, marginLeft: 4 }}>({p.reviews} reviews)</span></div>
                <div style={{ fontWeight: 700 }}>From {p.price}</div>
              </div>
              <button onClick={() => !user && open('signin')} style={{ width: '100%', background: C.primary, color: C.white, border: 'none', padding: '11px', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                Book {p.name.split(' ')[0]} →
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Why Trust ─────────────────────────────────────────────────────────────────
function WhyTrust() {
  const items = [
    { icon: '🔍', title: 'Background Verified', desc: 'All professionals go through thorough identity and criminal background checks before joining.' },
    { icon: '📜', title: 'Skill Certified', desc: 'We verify skills and experience. No amateur work — only trained and tested professionals.' },
    { icon: '💳', title: 'Secure Payments', desc: 'Pay only after the service is done or through our escrow system. 100% secure transactions.' },
    { icon: '⭐', title: 'Ratings & Reviews', desc: 'Real reviews from real customers. No fake ratings — complete transparency on every profile.' },
    { icon: '🔄', title: 'Service Guarantee', desc: 'Unsatisfied with the work? Get a free re-service or full refund within 24 hours.' },
    { icon: '📞', title: '24/7 Support', desc: 'Our support team is always available via in-app chat, phone, or email to resolve issues instantly.' },
  ];
  return (
    <section style={{ padding: '80px 0', background: C.cream }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 40px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: C.primary, marginBottom: 10 }}>Why TapTrust</div>
        <div style={{ fontSize: 36, fontWeight: 900, marginBottom: 12 }}>Built on trust</div>
        <div style={{ fontSize: 16, color: C.gray, marginBottom: 48 }}>Every feature is designed to make you feel safe, informed, and in control.</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
          {items.map(item => (
            <div key={item.title} style={{ background: C.white, borderRadius: 16, padding: '28px 24px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: 32, marginBottom: 14 }}>{item.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{item.title}</div>
              <div style={{ fontSize: 14, color: C.gray, lineHeight: 1.6 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Service Picker (two-level dropdown) ──────────────────────────────────────
function ServicePicker({ value, onChange, iS }) {
  const [open, setOpen] = useState(false);
  const [hovMain, setHovMain] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const selected = SERVICE_DATA.find(s => s.name === value || s.subs.includes(value));
  const displayLabel = value ? `${selected?.icon || ''} ${value}` : 'Choose a service…';

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div onClick={() => setOpen(o => !o)} style={{ ...iS, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none' }}>
        <span style={{ color: value ? '#fff' : '#888' }}>{displayLabel}</span>
        <span style={{ color: '#888', fontSize: 12 }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div style={{ position: 'absolute', top: '110%', left: 0, right: 0, zIndex: 500, background: '#1a1a1a', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', border: '1px solid #3a3a3a', overflow: 'hidden', maxHeight: 400, overflowY: 'auto' }}>
          {SERVICE_DATA.map(s => (
            <div key={s.name}>
              {/* Main service row */}
              <div
                onMouseEnter={() => setHovMain(s.name)}
                onClick={() => { onChange(s.name); setOpen(false); setHovMain(null); }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', cursor: 'pointer', background: hovMain === s.name ? '#2a2a2a' : 'transparent', borderBottom: '1px solid #2a2a2a' }}>
                <span style={{ fontSize: 14, color: '#fff', fontWeight: 600 }}>{s.icon} {s.name}</span>
                <span style={{ fontSize: 11, color: C.primary }}>from {s.price} ›</span>
              </div>
              {/* Sub-services shown on hover */}
              {hovMain === s.name && s.subs.map(sub => (
                <div key={sub}
                  onClick={e => { e.stopPropagation(); onChange(sub); setOpen(false); setHovMain(null); }}
                  style={{ padding: '9px 16px 9px 36px', cursor: 'pointer', fontSize: 13, color: '#ccc', background: '#252525', borderBottom: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', gap: 8 }}
                  onMouseEnter={e => e.currentTarget.style.background = '#2f2f2f'}
                  onMouseLeave={e => e.currentTarget.style.background = '#252525'}>
                  <span style={{ color: C.primary, fontSize: 12 }}>→</span>{sub}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Booking Section ───────────────────────────────────────────────────────────
function BookingSection({ open, user }) {
  const [form, setForm] = useState({ service: '', name: '', phone: '', date: '', time: '', address: '', location: '', notes: '', payment: 'online' });
  const [toast, setToast] = useState(false);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-fetch first available provider silently
  const [providerId, setProviderId] = useState(null);
  useEffect(() => {
    fetch(apiUrl('/providers'))
      .then(r => r.json())
      .then(d => {
        const list = d?.data?.providers || d?.data || [];
        if (list.length > 0) setProviderId(list[0].id);
      }).catch(() => {});
  }, []);

  const slots = [['08:00','08:00 – 10:00 AM'],['10:00','10:00 AM – 12:00 PM'],['12:00','12:00 – 02:00 PM'],['14:00','02:00 – 04:00 PM'],['16:00','04:00 – 06:00 PM'],['18:00','06:00 – 08:00 PM']];
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleBook(e) {
    e.preventDefault();
    if (!user) { open('signin'); return; }
    if (!form.service || !form.date || !form.time || !form.address) {
      setMsg('⚠️ Please fill service, date, time, and address.'); return;
    }
    setLoading(true); setMsg('');
    // Simulate booking — show success toast directly
    setTimeout(() => {
      setLoading(false);
      setToast(true);
      setTimeout(() => setToast(false), 4000);
      setForm({ service: '', name: '', phone: '', date: '', time: '', address: '', location: '', notes: '', payment: 'online' });
    }, 800);
  }

  const iS = { width: '100%', padding: '12px 14px', background: '#2a2a2a', border: '1.5px solid #3a3a3a', borderRadius: 10, fontSize: 14, color: '#fff', outline: 'none', boxSizing: 'border-box' };
  const lS = { fontSize: 11, fontWeight: 700, letterSpacing: 1, color: '#888', display: 'block', marginBottom: 6 };
  const fo = e => e.target.style.borderColor = C.primary;
  const bl = e => e.target.style.borderColor = '#3a3a3a';

  return (
    <section id="book" style={{ padding: '80px 0', background: '#1a1a1a' }}>
      {/* Toast notification */}
      {toast && (
        <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, background: '#16a34a', color: '#fff', padding: '16px 24px', borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: 12, fontSize: 15, fontWeight: 700, animation: 'slideIn 0.3s ease' }}>
          <span style={{ fontSize: 22 }}>✅</span>
          <div>
            <div>Booking slot confirmed!</div>
            <div style={{ fontSize: 12, fontWeight: 400, opacity: 0.85, marginTop: 2 }}>We'll match you with a verified professional shortly.</div>
          </div>
          <button onClick={() => setToast(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 18, marginLeft: 8 }}>✕</button>
        </div>
      )}
      <style>{`@keyframes slideIn { from { opacity:0; transform:translateX(40px); } to { opacity:1; transform:translateX(0); } }`}</style>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 40px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: C.primary, marginBottom: 10 }}>Book Now</div>
        <div style={{ fontSize: 36, fontWeight: 900, color: '#fff', marginBottom: 12 }}>Schedule a service</div>
        <div style={{ fontSize: 16, color: '#888', marginBottom: 48 }}>Fill in your details and we'll match you with the best verified professional.</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 32, alignItems: 'start' }}>
          <form onSubmit={handleBook} style={{ background: '#222', borderRadius: 20, padding: '32px' }}>
            <div style={{ marginBottom: 20 }}>
              <label style={lS}>SERVICE TYPE</label>
              <ServicePicker value={form.service} onChange={v => set('service', v)} iS={iS} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div><label style={lS}>YOUR NAME</label><input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Full name" style={iS} onFocus={fo} onBlur={bl} /></div>
              <div><label style={lS}>PHONE</label><input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 XXXXX XXXXX" style={iS} onFocus={fo} onBlur={bl} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div><label style={lS}>DATE</label><input type="date" value={form.date} onChange={e => set('date', e.target.value)} style={{ ...iS, colorScheme: 'dark' }} onFocus={fo} onBlur={bl} /></div>
              <div><label style={lS}>TIME SLOT</label>
                <select value={form.time} onChange={e => set('time', e.target.value)} style={{ ...iS, cursor: 'pointer' }} onFocus={fo} onBlur={bl}>
                  <option value="">Select time…</option>
                  {slots.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 20 }}><label style={lS}>ADDRESS</label><input value={form.address} onChange={e => set('address', e.target.value)} placeholder="Flat / Building, Street, City" style={iS} onFocus={fo} onBlur={bl} /></div>
            <div style={{ marginBottom: 20 }}>
              <label style={lS}>LOCATION / CITY</label>
              <div style={{ position: 'relative' }}>
                <input value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Hyderabad, Telangana" style={{ ...iS, paddingRight: 44 }} onFocus={fo} onBlur={bl} />
                <button type="button" onClick={() => { if (!navigator.geolocation) return; navigator.geolocation.getCurrentPosition(pos => { fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`).then(r => r.json()).then(d => set('location', d.address?.city || d.address?.town || d.address?.state || 'Detected')).catch(() => {}); }); }} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>📍</button>
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={lS}>PAYMENT METHOD</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {[['online','💳 Online'],['cash','💵 Cash'],['upi','📱 UPI']].map(([v,l]) => (
                  <button key={v} type="button" onClick={() => set('payment', v)} style={{ flex: 1, padding: '10px 8px', borderRadius: 10, border: `2px solid ${form.payment === v ? C.primary : '#3a3a3a'}`, background: form.payment === v ? C.primary + '22' : '#2a2a2a', color: form.payment === v ? C.primary : '#888', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>{l}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 24 }}><label style={lS}>NOTES (OPTIONAL)</label><textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Describe the issue briefly…" rows={3} style={{ ...iS, resize: 'vertical' }} onFocus={fo} onBlur={bl} /></div>
            {msg && <div style={{ marginBottom: 16, fontSize: 13, color: msg.startsWith('✅') ? '#16a34a' : '#e9c46a', fontWeight: 600 }}>{msg}</div>}
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', background: C.primary, color: C.white, border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Booking…' : user ? 'Confirm Booking →' : 'Sign In to Book →'}
            </button>
          </form>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[{ icon: '💰', title: 'Transparent Pricing', desc: 'No hidden charges. What you see is what you pay. Prices are fixed upfront before the service begins.' }, { icon: '🛡️', title: 'Quality Guarantee', desc: 'Not happy with the service? We offer a free re-service or full refund — no questions asked.' }, { icon: '📍', title: 'Real-Time Tracking', desc: "Track your professional's location live. Know exactly when they'll arrive." }].map(card => (
              <div key={card.title} style={{ background: '#222', borderRadius: 16, padding: '24px' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{card.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#fff', marginBottom: 8 }}>{card.title}</div>
                <div style={{ fontSize: 14, color: '#888', lineHeight: 1.6 }}>{card.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Reviews ───────────────────────────────────────────────────────────────────
function Reviews() {
  const list = [
    { text: '"Booked a plumber at 8 AM and he arrived in under an hour. Transparent pricing — no surprises. Absolutely love TapTrust!"', name: 'Sahithi R.', city: 'Hyderabad', initial: 'S' },
    { text: '"Finally a platform I can trust! The electrician was professional, verified, and fixed everything in one visit. 100% recommended."', name: 'Aparna M.', city: 'Bengaluru', initial: 'A' },
    { text: '"The deep cleaning service was impeccable. Worth every rupee. The real-time tracking is a great feature!"', name: 'Vijay K.', city: 'Mumbai', initial: 'V' },
  ];
  return (
    <section id="reviews" style={{ padding: '80px 0', background: C.white }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 40px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: C.primary, marginBottom: 10 }}>Reviews</div>
        <div style={{ fontSize: 36, fontWeight: 900, marginBottom: 12 }}>What customers say</div>
        <div style={{ fontSize: 16, color: C.gray, marginBottom: 48 }}>Real experiences from verified bookings across India.</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
          {list.map(r => (
            <div key={r.name} style={{ background: C.cream, borderRadius: 20, padding: '28px 24px' }}>
              <div style={{ color: '#f59e0b', fontSize: 18, marginBottom: 14 }}>★★★★★</div>
              <p style={{ fontSize: 14, color: C.gray, lineHeight: 1.7, marginBottom: 20, fontStyle: 'italic' }}>{r.text}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: C.primary, color: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16 }}>{r.initial}</div>
                <div><div style={{ fontWeight: 700, fontSize: 14 }}>{r.name}</div><div style={{ fontSize: 12, color: C.gray }}>{r.city}</div></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer({ open }) {
  return (
    <footer style={{ background: '#1a2e44', color: '#8aacbf' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 40px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40, marginBottom: 48 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <img src="/logo.png" alt="TapTrust" style={{ width: 32, height: 32, objectFit: 'contain' }} onError={e => e.target.style.display = 'none'} />
              <span style={{ fontWeight: 900, fontSize: 20, color: C.white }}><span style={{ color: C.primary }}>Tap</span>Trust</span>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.7, maxWidth: 280 }}>Connecting urban households with verified home service professionals. Transparent pricing. Quality guaranteed.</p>
          </div>
          {[
            { title: 'Services', links: ['Plumbing', 'Electrical', 'Deep Cleaning', 'Carpentry', 'AC & Appliances', 'Painting', 'Pest Control', 'Handyman', 'Moving & Packing'] },
            { title: 'Company', links: ['About Us', 'Careers', 'Blog', 'Press'] },
            { title: 'Support', links: ['Help Centre', 'Contact Us', 'Privacy Policy', 'Terms of Service'] },
          ].map(col => (
            <div key={col.title}>
              <div style={{ fontWeight: 700, color: C.white, marginBottom: 16, fontSize: 15 }}>{col.title}</div>
              {col.links.map(l => <div key={l} style={{ fontSize: 14, marginBottom: 10, cursor: 'pointer' }}
                onClick={() => col.title === 'Services' && document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
                onMouseEnter={e => e.target.style.color = C.white} onMouseLeave={e => e.target.style.color = '#8aacbf'}
              >{l}</div>)}
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid #2a4a64', paddingTop: 24, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontSize: 13 }}>© 2026 TapTrust. Kalasalingam Academy of Research and Education, Tamil Nadu.</div>
          <div style={{ fontSize: 13, color: '#5a8aaa' }}>Tap once. Trust always.</div>
        </div>
      </div>
    </footer>
  );
}
