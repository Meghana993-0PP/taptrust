import { useState, useEffect } from 'react';
import { apiUrl } from '../services/apiBase';

const C = {
  primary: '#2a9d8f', primaryDark: '#1f7a6e', accent: '#e9c46a',
  navy: '#1a2e44', cream: '#f0faf9', text: '#1a2e44', gray: '#4a6274', white: '#fff',
};

function getUser() {
  try {
    const t = localStorage.getItem('taptrust_token');
    if (!t) return null;
    const p = JSON.parse(atob(t.split('.')[1]));
    if (p.exp && p.exp * 1000 < Date.now()) { localStorage.removeItem('taptrust_token'); return null; }
    return p;
  } catch { return null; }
}

function authHeaders() {
  const t = localStorage.getItem('taptrust_token');
  return t ? { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' } : {};
}

export default function ProviderDashboard() {
  const user = getUser();
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    if (!user || user.role !== 'Provider') { window.location.href = '/'; }
  }, []);

  if (!user) return null;

  const tabs = [
    { id: 'overview', icon: '📊', label: 'Overview' },
    { id: 'requests', icon: '📥', label: 'Requests' },
    { id: 'jobs', icon: '🔧', label: 'Active Jobs' },
    { id: 'earnings', icon: '💰', label: 'Earnings' },
    { id: 'payments', icon: '💳', label: 'Payments' },
    { id: 'settings', icon: '⚙️', label: 'Settings' },
    { id: 'notifications', icon: '🔔', label: 'Notifications' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f9f8', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* Sidebar */}
      <aside style={{ width: 240, background: C.navy, color: C.white, display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100 }}>
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <img src="/logo.png" alt="TapTrust" style={{ width: 32, height: 32, objectFit: 'contain' }} onError={e => e.target.style.display = 'none'} />
            <span style={{ fontWeight: 900, fontSize: 18 }}><span style={{ color: C.primary }}>Tap</span>Trust</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16 }}>
              {user.name?.[0]?.toUpperCase() || 'P'}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{user.name || 'Provider'}</div>
              <div style={{ fontSize: 11, color: '#8aacbf' }}>Service Provider</div>
            </div>
          </div>
        </div>
        <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '11px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
              marginBottom: 4, fontSize: 14, fontWeight: 500, textAlign: 'left',
              background: tab === t.id ? C.primary : 'transparent',
              color: tab === t.id ? C.white : 'rgba(255,255,255,0.75)',
              transition: 'all 0.15s',
            }}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button onClick={() => { localStorage.removeItem('taptrust_token'); window.location.href = '/'; }}
            style={{ width: '100%', background: 'rgba(255,255,255,0.1)', border: 'none', color: C.white, padding: '10px', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
            🚪 Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ marginLeft: 240, flex: 1, padding: 32 }}>
        {tab === 'overview' && <Overview user={user} />}
        {tab === 'requests' && <Requests />}
        {tab === 'jobs' && <ActiveJobs />}
        {tab === 'earnings' && <Earnings />}
        {tab === 'payments' && <Payments />}
        {tab === 'settings' && <Settings user={user} />}
        {tab === 'notifications' && <Notifications />}
      </div>
    </div>
  );
}

// ── Shared ────────────────────────────────────────────────────────────────────
function Card({ children, style = {} }) {
  return <div style={{ background: C.white, borderRadius: 16, padding: '24px', boxShadow: '0 2px 12px rgba(26,46,68,0.07)', ...style }}>{children}</div>;
}
function SectionTitle({ title, sub }) {
  return <div style={{ marginBottom: 28 }}><h2 style={{ fontSize: 24, fontWeight: 900, color: C.text, margin: 0 }}>{title}</h2>{sub && <p style={{ fontSize: 14, color: C.gray, marginTop: 6 }}>{sub}</p>}</div>;
}
function Badge({ label, color }) {
  const colors = { green: '#16a34a', teal: C.primary, yellow: '#d97706', red: '#e74c3c', gray: C.gray };
  const c = colors[color] || C.gray;
  return <span style={{ background: c + '20', color: c, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{label}</span>;
}

// ── Overview ──────────────────────────────────────────────────────────────────
function Overview({ user }) {
  const [stats, setStats] = useState({ total_bookings: 0, completed: 0, pending: 0, total_earnings: 0, avg_rating: 0, total_reviews: 0 });
  useEffect(() => {
    fetch(apiUrl('/providers/stats'), { headers: authHeaders() })
      .then(r => r.json()).then(d => { if (d?.data) setStats(d.data); }).catch(() => {});
  }, []);

  const statCards = [
    { icon: '📋', label: 'Total Bookings', value: stats.total_bookings, color: C.primary },
    { icon: '✅', label: 'Completed', value: stats.completed, color: '#16a34a' },
    { icon: '⏳', label: 'Pending', value: stats.pending, color: '#d97706' },
    { icon: '💰', label: 'Total Earnings', value: `₹${Number(stats.total_earnings || 0).toLocaleString('en-IN')}`, color: C.accent },
    { icon: '⭐', label: 'Avg Rating', value: stats.avg_rating ? Number(stats.avg_rating).toFixed(1) : '—', color: '#f59e0b' },
    { icon: '💬', label: 'Reviews', value: stats.total_reviews, color: C.navy },
  ];

  return (
    <div>
      <SectionTitle title={`Welcome back, ${user.name || 'Provider'} 👋`} sub="Here's your performance at a glance." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 20, marginBottom: 32 }}>
        {statCards.map(s => (
          <Card key={s.label}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>{s.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 13, color: C.gray, marginTop: 4 }}>{s.label}</div>
          </Card>
        ))}
      </div>
      <OnlineToggle />
    </div>
  );
}

function OnlineToggle() {
  const [online, setOnline] = useState(false);
  return (
    <Card style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <div style={{ fontWeight: 700, fontSize: 16 }}>Availability Status</div>
        <div style={{ fontSize: 13, color: C.gray, marginTop: 4 }}>Toggle to accept new booking requests</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: online ? '#16a34a' : C.gray }}>{online ? '🟢 Online' : '🔴 Offline'}</span>
        <div onClick={() => setOnline(o => !o)} style={{ width: 52, height: 28, borderRadius: 14, background: online ? C.primary : '#ddd', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
          <div style={{ width: 22, height: 22, borderRadius: '50%', background: C.white, position: 'absolute', top: 3, left: online ? 27 : 3, transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
        </div>
      </div>
    </Card>
  );
}

// ── Requests ──────────────────────────────────────────────────────────────────
function Requests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(apiUrl('/bookings?status=pending'), { headers: authHeaders() })
      .then(r => r.json()).then(d => setRequests(d?.data?.bookings || d?.data || []))
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function respond(id, action) {
    await fetch(apiUrl(`/bookings/${id}/${action}`), { method: 'PUT', headers: authHeaders() }).catch(() => {});
    setRequests(r => r.filter(b => b.id !== id));
  }

  return (
    <div>
      <SectionTitle title="Booking Requests" sub="Review and respond to incoming service requests." />
      {loading ? <div style={{ textAlign: 'center', padding: 40, color: C.gray }}>Loading…</div> :
        requests.length === 0 ? <Card><div style={{ textAlign: 'center', padding: 40, color: C.gray }}>📥 No pending requests</div></Card> :
        <div style={{ display: 'grid', gap: 16 }}>
          {requests.map(b => (
            <Card key={b.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{b.service_name || 'Service'}</div>
                <div style={{ fontSize: 13, color: C.gray, marginTop: 4 }}>Customer: {b.customer_name || 'Customer'}</div>
                <div style={{ fontSize: 13, color: C.gray }}>📅 {b.scheduled_date ? new Date(b.scheduled_date).toLocaleDateString('en-IN') : 'TBD'} · ₹{b.total_amount || '—'}</div>
                <div style={{ fontSize: 12, color: C.gray, marginTop: 4 }}>📍 {b.address || 'Address not provided'}</div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => respond(b.id, 'accept')} style={{ background: C.primary, color: C.white, border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>✅ Accept</button>
                <button onClick={() => respond(b.id, 'reject')} style={{ background: '#fff0f0', color: '#e74c3c', border: '1px solid #ffd5d5', padding: '10px 20px', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>❌ Reject</button>
              </div>
            </Card>
          ))}
        </div>
      }
    </div>
  );
}

// ── Active Jobs ───────────────────────────────────────────────────────────────
function ActiveJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(apiUrl('/bookings?status=confirmed'), { headers: authHeaders() })
      .then(r => r.json()).then(d => setJobs(d?.data?.bookings || d?.data || []))
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function updateStatus(id, status) {
    await fetch(apiUrl(`/bookings/${id}/status`), { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ status }) }).catch(() => {});
    setJobs(j => j.map(b => b.id === id ? { ...b, status } : b));
  }

  const statusColor = { confirmed: 'teal', in_progress: 'yellow', completed: 'green' };

  return (
    <div>
      <SectionTitle title="Active Jobs" sub="Track and manage your ongoing service jobs." />
      {loading ? <div style={{ textAlign: 'center', padding: 40, color: C.gray }}>Loading…</div> :
        jobs.length === 0 ? <Card><div style={{ textAlign: 'center', padding: 40, color: C.gray }}>🔧 No active jobs</div></Card> :
        <div style={{ display: 'grid', gap: 16 }}>
          {jobs.map(b => (
            <Card key={b.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{b.service_name || 'Service'}</div>
                    <Badge label={b.status || 'confirmed'} color={statusColor[b.status] || 'teal'} />
                  </div>
                  <div style={{ fontSize: 13, color: C.gray }}>👤 {b.customer_name || 'Customer'}</div>
                  <div style={{ fontSize: 13, color: C.gray }}>📅 {b.scheduled_date ? new Date(b.scheduled_date).toLocaleDateString('en-IN') : 'TBD'}</div>
                  <div style={{ fontSize: 13, color: C.gray }}>📍 {b.address || '—'}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.primary, marginTop: 8 }}>₹{b.total_amount || '—'}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {b.status === 'confirmed' && <button onClick={() => updateStatus(b.id, 'in_progress')} style={{ background: C.accent, color: C.navy, border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>▶ Start Job</button>}
                  {b.status === 'in_progress' && <button onClick={() => updateStatus(b.id, 'completed')} style={{ background: '#16a34a', color: C.white, border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>✅ Mark Complete</button>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      }
    </div>
  );
}

// ── Earnings ──────────────────────────────────────────────────────────────────
function Earnings() {
  const [period, setPeriod] = useState('monthly');
  const [data, setData] = useState({ total: 0, jobs: 0, avg: 0, history: [] });

  useEffect(() => {
    fetch(`/api/v1/providers/earnings?period=${period}`, { headers: authHeaders() })
      .then(r => r.json()).then(d => { if (d?.data) setData(d.data); }).catch(() => {});
  }, [period]);

  return (
    <div>
      <SectionTitle title="Earnings" sub="Track your income across different time periods." />
      <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
        {['daily', 'weekly', 'monthly'].map(p => (
          <button key={p} onClick={() => setPeriod(p)} style={{ padding: '8px 20px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, background: period === p ? C.primary : C.white, color: period === p ? C.white : C.gray, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', textTransform: 'capitalize' }}>{p}</button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20, marginBottom: 32 }}>
        {[
          { icon: '💰', label: `${period.charAt(0).toUpperCase() + period.slice(1)} Earnings`, value: `₹${Number(data.total || 0).toLocaleString('en-IN')}`, color: C.primary },
          { icon: '✅', label: 'Jobs Completed', value: data.jobs || 0, color: '#16a34a' },
          { icon: '📊', label: 'Avg per Job', value: `₹${Number(data.avg || 0).toLocaleString('en-IN')}`, color: C.accent },
        ].map(s => (
          <Card key={s.label}><div style={{ fontSize: 28, marginBottom: 10 }}>{s.icon}</div><div style={{ fontSize: 26, fontWeight: 900, color: s.color }}>{s.value}</div><div style={{ fontSize: 13, color: C.gray, marginTop: 4 }}>{s.label}</div></Card>
        ))}
      </div>
      <Card>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Earnings History</div>
        {(data.history || []).length === 0 ? <div style={{ textAlign: 'center', padding: 24, color: C.gray }}>No earnings data for this period</div> :
          <div style={{ display: 'grid', gap: 12 }}>
            {(data.history || []).map((h, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #e0f0ee' }}>
                <div><div style={{ fontWeight: 600 }}>{h.service_name || 'Service'}</div><div style={{ fontSize: 12, color: C.gray }}>{h.date ? new Date(h.date).toLocaleDateString('en-IN') : ''}</div></div>
                <div style={{ fontWeight: 800, color: C.primary }}>₹{h.amount || 0}</div>
              </div>
            ))}
          </div>
        }
      </Card>
    </div>
  );
}

// ── Payments ──────────────────────────────────────────────────────────────────
function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [withdrawAmt, setWithdrawAmt] = useState('');
  const [withdrawMsg, setWithdrawMsg] = useState('');

  useEffect(() => {
    fetch('/api/v1/payments', { headers: authHeaders() })
      .then(r => r.json()).then(d => setPayments(d?.data?.payments || d?.data || []))
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function requestWithdraw() {
    if (!withdrawAmt || isNaN(withdrawAmt)) { setWithdrawMsg('Enter a valid amount'); return; }
    try {
      const res = await fetch('/api/v1/payments/withdraw', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ amount: Number(withdrawAmt) }) });
      const d = await res.json();
      setWithdrawMsg(res.ok ? '✅ Withdrawal request submitted!' : d.message || 'Failed');
      setWithdrawAmt('');
    } catch { setWithdrawMsg('Request failed'); }
  }

  const pending = payments.filter(p => p.status === 'pending');
  const completed = payments.filter(p => p.status === 'completed');

  return (
    <div>
      <SectionTitle title="Payments" sub="Manage your earnings, pending payments, and withdrawals." />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
        <Card>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>💳 Pending Payments</div>
          {pending.length === 0 ? <div style={{ color: C.gray, fontSize: 14 }}>No pending payments</div> :
            pending.map((p, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #e0f0ee' }}>
                <div style={{ fontSize: 14 }}>{p.description || 'Payment'}</div>
                <div style={{ fontWeight: 700, color: '#d97706' }}>₹{p.amount}</div>
              </div>
            ))
          }
        </Card>
        <Card>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>🏦 Withdraw Earnings</div>
          <div style={{ fontSize: 13, color: C.gray, marginBottom: 12 }}>Request a withdrawal to your bank account</div>
          <input type="number" value={withdrawAmt} onChange={e => setWithdrawAmt(e.target.value)} placeholder="Enter amount (₹)"
            style={{ width: '100%', padding: '12px', border: '1.5px solid #d4eeeb', borderRadius: 10, fontSize: 15, outline: 'none', boxSizing: 'border-box', marginBottom: 12 }}
            onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = '#d4eeeb'} />
          <button onClick={requestWithdraw} style={{ width: '100%', background: C.primary, color: C.white, border: 'none', padding: '12px', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>Request Withdrawal</button>
          {withdrawMsg && <div style={{ marginTop: 10, fontSize: 13, color: withdrawMsg.startsWith('✅') ? '#16a34a' : '#e74c3c' }}>{withdrawMsg}</div>}
        </Card>
      </div>
      <Card>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>📜 Payment History</div>
        {loading ? <div style={{ textAlign: 'center', padding: 24, color: C.gray }}>Loading…</div> :
          completed.length === 0 ? <div style={{ textAlign: 'center', padding: 24, color: C.gray }}>No payment history</div> :
          completed.map((p, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #e0f0ee' }}>
              <div><div style={{ fontWeight: 600, fontSize: 14 }}>{p.description || 'Payment'}</div><div style={{ fontSize: 12, color: C.gray }}>{p.created_at ? new Date(p.created_at).toLocaleDateString('en-IN') : ''}</div></div>
              <div style={{ fontWeight: 800, color: C.primary }}>₹{p.amount}</div>
            </div>
          ))
        }
      </Card>
    </div>
  );
}

// ── Settings ──────────────────────────────────────────────────────────────────
function Settings({ user }) {
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [location, setLocation] = useState('');
  const [pricing, setPricing] = useState('');
  const [slots, setSlots] = useState([]);
  const [msg, setMsg] = useState('');

  const timeSlots = ['08:00-10:00', '10:00-12:00', '12:00-14:00', '14:00-16:00', '16:00-18:00', '18:00-20:00'];

  useEffect(() => {
    fetch('/api/v1/providers/profile', { headers: authHeaders() })
      .then(r => r.json())
      .then(d => {
        if (d?.data) {
          setProfile(d.data);
          setPricing(d.data.hourly_rate ? String(d.data.hourly_rate) : '');
        }
      })
      .catch(() => {})
      .finally(() => setLoadingProfile(false));
  }, []);

  function toggleSlot(s) { setSlots(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]); }

  async function saveSettings() {
    try {
      const res = await fetch('/api/v1/providers/profile', {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ hourly_rate: Number(pricing) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to save');
      if (data?.data) setProfile(data.data);
      setMsg('✅ Settings saved!');
    } catch (err) { setMsg(err.message || 'Failed to save'); }
    setTimeout(() => setMsg(''), 3000);
  }

  return (
    <div>
      <SectionTitle title="Settings" sub="Configure your working preferences and availability." />
      <div style={{ display: 'grid', gap: 24 }}>
        <Card style={{ background: 'linear-gradient(135deg, #effaf8, #ffffff)', border: '1px solid #d9efeb' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, color: C.text }}>🧑‍🔧 Provider Profile</div>
              <div style={{ fontSize: 13, color: C.gray, marginTop: 4 }}>Your visible service details are shown here for quick reference.</div>
            </div>
            {profile?.verification_status && <Badge label={profile.verification_status} color={profile.verification_status === 'Verified' ? 'green' : 'yellow'} />}
          </div>
          {loadingProfile ? (
            <div style={{ fontSize: 14, color: C.gray }}>Loading profile details…</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
              <div style={{ background: C.white, borderRadius: 14, padding: '16px 18px', border: '1px solid #e2f1ee' }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.gray, marginBottom: 6 }}>SERVICE CATEGORY</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{profile?.service_category || 'Not set yet'}</div>
              </div>
              <div style={{ background: C.white, borderRadius: 14, padding: '16px 18px', border: '1px solid #e2f1ee' }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.gray, marginBottom: 6 }}>EXPERIENCE</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>
                  {profile?.years_experience !== undefined && profile?.years_experience !== null
                    ? `${profile.years_experience} year${Number(profile.years_experience) === 1 ? '' : 's'}`
                    : 'Not set yet'}
                </div>
              </div>
              <div style={{ background: C.white, borderRadius: 14, padding: '16px 18px', border: '1px solid #e2f1ee' }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.gray, marginBottom: 6 }}>CURRENT HOURLY RATE</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.primary }}>{profile?.hourly_rate ? `₹${profile.hourly_rate}/hr` : 'Not set yet'}</div>
              </div>
            </div>
          )}
        </Card>
        <Card>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>📍 Working Location</div>
          <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Enter your service area (e.g. Hyderabad, Telangana)"
            style={{ width: '100%', padding: '12px 16px', border: '1.5px solid #d4eeeb', borderRadius: 10, fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
            onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = '#d4eeeb'} />
        </Card>
        <Card>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>💰 Set Pricing (₹/hr)</div>
          <div style={{ fontSize: 13, color: C.gray, marginBottom: 12 }}>Update your hourly rate here. This uses the same pricing field already present in the dashboard.</div>
          <input type="number" value={pricing} onChange={e => setPricing(e.target.value)} placeholder="e.g. 350"
            style={{ width: '100%', padding: '12px 16px', border: '1.5px solid #d4eeeb', borderRadius: 10, fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
            onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = '#d4eeeb'} />
        </Card>
        <Card>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>🕐 Available Time Slots</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {timeSlots.map(s => (
              <button key={s} onClick={() => toggleSlot(s)} style={{ padding: '8px 16px', borderRadius: 20, border: `2px solid ${slots.includes(s) ? C.primary : '#d4eeeb'}`, background: slots.includes(s) ? '#e8f8f6' : C.white, color: slots.includes(s) ? C.primary : C.gray, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>{s}</button>
            ))}
          </div>
        </Card>
        <button onClick={saveSettings} style={{ background: C.primary, color: C.white, border: 'none', padding: '14px', borderRadius: 12, fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>Save Settings</button>
        {msg && <div style={{ textAlign: 'center', color: msg.startsWith('✅') ? '#16a34a' : '#e74c3c', fontWeight: 600 }}>{msg}</div>}
      </div>
    </div>
  );
}

// ── Notifications ─────────────────────────────────────────────────────────────
function Notifications() {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/notifications', { headers: authHeaders() })
      .then(r => r.json()).then(d => setNotifs(d?.data?.notifications || d?.data || []))
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  const iconMap = { booking: '📋', payment: '💳', message: '💬', review: '⭐', system: '🔔' };

  return (
    <div>
      <SectionTitle title="Notifications" sub="Stay updated on bookings, payments, and messages." />
      {loading ? <div style={{ textAlign: 'center', padding: 40, color: C.gray }}>Loading…</div> :
        notifs.length === 0 ? <Card><div style={{ textAlign: 'center', padding: 40, color: C.gray }}>🔔 No notifications yet</div></Card> :
        <div style={{ display: 'grid', gap: 12 }}>
          {notifs.map((n, i) => (
            <Card key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, background: n.is_read ? C.white : '#e8f8f6', borderLeft: n.is_read ? 'none' : `4px solid ${C.primary}` }}>
              <div style={{ fontSize: 24, flexShrink: 0 }}>{iconMap[n.type] || '🔔'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{n.title || 'Notification'}</div>
                <div style={{ fontSize: 13, color: C.gray, marginTop: 4 }}>{n.message || n.body}</div>
                <div style={{ fontSize: 11, color: '#8aacbf', marginTop: 6 }}>{n.created_at ? new Date(n.created_at).toLocaleString('en-IN') : ''}</div>
              </div>
              {!n.is_read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.primary, flexShrink: 0, marginTop: 6 }} />}
            </Card>
          ))}
        </div>
      }
    </div>
  );
}
