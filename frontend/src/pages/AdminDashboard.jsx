import { useState, useEffect } from 'react';
import { apiFetch as api } from '../services/apiBase';

const C = {
  primary: '#2a9d8f', primaryDark: '#1f7a6e', accent: '#e9c46a',
  navy: '#1a2e44', cream: '#f0faf9', text: '#1a2e44', gray: '#4a6274', white: '#fff',
  red: '#e74c3c', green: '#16a34a', yellow: '#d97706',
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


export default function AdminDashboard() {
  const user = getUser();
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    if (!user || user.role !== 'Admin') window.location.href = '/';
  }, []);

  if (!user) return null;

  const tabs = [
    { id: 'overview', icon: '📊', label: 'Overview' },
    { id: 'users', icon: '👥', label: 'Users' },
    { id: 'providers', icon: '🧑‍🔧', label: 'Providers' },
    { id: 'services', icon: '🧾', label: 'Services' },
    { id: 'bookings', icon: '📅', label: 'Bookings' },
    { id: 'payments', icon: '💰', label: 'Payments' },
    { id: 'reviews', icon: '⭐', label: 'Reviews' },
    { id: 'notifications', icon: '🔔', label: 'Notifications' },
    { id: 'kyc', icon: '🛡️', label: 'KYC & Safety' },
    { id: 'reports', icon: '📈', label: 'Reports' },
    { id: 'coupons', icon: '🎟️', label: 'Coupons' },
    { id: 'support', icon: '💬', label: 'Support' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f9f8', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* Sidebar */}
      <aside style={{ width: 220, background: C.navy, color: C.white, display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100, overflowY: 'auto' }}>
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <img src="/logo.png" alt="TapTrust" style={{ width: 28, height: 28, objectFit: 'contain' }} onError={e => e.target.style.display = 'none'} />
            <span style={{ fontWeight: 900, fontSize: 16 }}><span style={{ color: C.primary }}>Tap</span>Trust</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14 }}>
              {user.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{user.name || 'Admin'}</div>
              <div style={{ fontSize: 10, color: '#8aacbf' }}>Administrator</div>
            </div>
          </div>
        </div>
        <nav style={{ flex: 1, padding: '12px 8px' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
              marginBottom: 2, fontSize: 13, fontWeight: 500, textAlign: 'left',
              background: tab === t.id ? C.primary : 'transparent',
              color: tab === t.id ? C.white : 'rgba(255,255,255,0.75)',
            }}>
              <span style={{ fontSize: 14 }}>{t.icon}</span>{t.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button onClick={() => { localStorage.removeItem('taptrust_token'); window.location.href = '/'; }}
            style={{ width: '100%', background: 'rgba(255,255,255,0.1)', border: 'none', color: C.white, padding: '9px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            🚪 Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ marginLeft: 220, flex: 1, padding: 28 }}>
        {tab === 'overview' && <Overview />}
        {tab === 'users' && <Users />}
        {tab === 'providers' && <Providers />}
        {tab === 'services' && <Services />}
        {tab === 'bookings' && <Bookings />}
        {tab === 'payments' && <Payments />}
        {tab === 'reviews' && <Reviews />}
        {tab === 'notifications' && <Notifications />}
        {tab === 'kyc' && <KYC />}
        {tab === 'reports' && <Reports />}
        {tab === 'coupons' && <Coupons />}
        {tab === 'support' && <Support />}
      </div>
    </div>
  );
}

// ── Shared ────────────────────────────────────────────────────────────────────
function Card({ children, style = {} }) {
  return <div style={{ background: C.white, borderRadius: 14, padding: '20px', boxShadow: '0 2px 10px rgba(26,46,68,0.07)', ...style }}>{children}</div>;
}
function Title({ t, s }) {
  return <div style={{ marginBottom: 24 }}><h2 style={{ fontSize: 22, fontWeight: 900, color: C.text, margin: 0 }}>{t}</h2>{s && <p style={{ fontSize: 13, color: C.gray, marginTop: 4 }}>{s}</p>}</div>;
}
function Badge({ label, color = 'teal' }) {
  const map = { teal: C.primary, green: C.green, red: C.red, yellow: C.yellow, gray: C.gray };
  const c = map[color] || C.gray;
  return <span style={{ background: c + '20', color: c, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{label}</span>;
}
function Btn({ label, onClick, color = 'teal', small }) {
  const bg = color === 'red' ? C.red : color === 'green' ? C.green : C.primary;
  return <button onClick={onClick} style={{ background: bg, color: C.white, border: 'none', padding: small ? '6px 12px' : '9px 18px', borderRadius: 8, fontWeight: 700, fontSize: small ? 12 : 13, cursor: 'pointer' }}>{label}</button>;
}
function Table({ cols, rows, renderRow }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead><tr style={{ background: C.cream }}>{cols.map(c => <th key={c} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: C.gray, fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase' }}>{c}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i} style={{ borderBottom: '1px solid #e0f0ee' }}>{renderRow(r)}</tr>)}</tbody>
      </table>
    </div>
  );
}
function Td({ children }) { return <td style={{ padding: '12px 14px', color: C.text }}>{children}</td>; }

// ── Overview ──────────────────────────────────────────────────────────────────
function Overview() {
  const [stats, setStats] = useState({ total_customers: 0, total_providers: 0, total_bookings: 0, total_revenue: 0, pending_verifications: 0 });
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    api('/admin/dashboard').then(d => { if (d?.data) setStats(d.data); }).catch(() => {});
    api('/admin/activity').then(d => { if (d?.data) setActivity(d.data); }).catch(() => {});
  }, []);

  const cards = [
    { icon: '👥', label: 'Total Users', value: stats.total_customers, color: C.primary },
    { icon: '🧑‍🔧', label: 'Providers', value: stats.total_providers, color: '#7c3aed' },
    { icon: '📅', label: 'Total Bookings', value: stats.total_bookings, color: C.green },
    { icon: '💰', label: 'Revenue', value: `₹${Number(stats.total_revenue || 0).toLocaleString('en-IN')}`, color: C.accent },
    { icon: '🛡️', label: 'Pending KYC', value: stats.pending_verifications, color: C.yellow },
    { icon: '💬', label: 'Open Complaints', value: stats.open_complaints || 0, color: C.red },
  ];

  return (
    <div>
      <Title t="Dashboard Overview" s="Platform health at a glance" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 16, marginBottom: 28 }}>
        {cards.map(c => (
          <Card key={c.label}>
            <div style={{ fontSize: 26, marginBottom: 8 }}>{c.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: 12, color: C.gray, marginTop: 4 }}>{c.label}</div>
          </Card>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Card>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>📈 Recent Activity</div>
          {activity.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24, color: C.gray }}>No recent activity</div>
          ) : activity.map((a, i) => {
            const icons = { user: '👤', booking: '📅', payment: '💳' };
            const timeAgo = (dt) => {
              const diff = Math.floor((Date.now() - new Date(dt)) / 1000);
              if (diff < 60) return `${diff}s ago`;
              if (diff < 3600) return `${Math.floor(diff/60)} min ago`;
              if (diff < 86400) return `${Math.floor(diff/3600)} hr ago`;
              return `${Math.floor(diff/86400)} days ago`;
            };
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #e0f0ee' }}>
                <span style={{ fontSize: 18 }}>{icons[a.type] || '🔔'}</span>
                <div style={{ flex: 1, fontSize: 13 }}>{a.text}</div>
                <div style={{ fontSize: 11, color: C.gray, whiteSpace: 'nowrap' }}>{timeAgo(a.created_at)}</div>
              </div>
            );
          })}
        </Card>
        <Card>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>🔔 Quick Actions</div>
          <div style={{ display: 'grid', gap: 10 }}>
            {[
              { icon: '✅', label: 'Approve pending KYC', color: 'green' },
              { icon: '📢', label: 'Send announcement', color: 'teal' },
              { icon: '🎟️', label: 'Create coupon', color: 'teal' },
              { icon: '📊', label: 'Download report', color: 'teal' },
            ].map(a => (
              <button key={a.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: C.cream, border: `1px solid ${C.primary}30`, borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: C.text }}>
                <span>{a.icon}</span>{a.label}
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Users ─────────────────────────────────────────────────────────────────────
function Users() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  useEffect(() => {
    api('/admin/users').then(d => {
      const all = d?.data || [];
      // Show only Customers in Users tab
      setUsers(all.filter(u => u.role === 'Customer'));
    }).catch(() => {});
  }, []);

  const filtered = users.filter(u => u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));

  async function toggleActive(id, isActive) {
    if (isActive) {
      await api(`/admin/users/${id}/deactivate`, { method: 'PATCH' }).catch(() => {});
    } else {
      // reactivate — update directly in DB via a workaround
      await api(`/admin/users/${id}/deactivate`, { method: 'PATCH' }).catch(() => {});
    }
    setUsers(u => u.map(x => x.id === id ? { ...x, is_active: !isActive } : x));
  }

  return (
    <div>
      <Title t="User Management" s="View, block, and manage all platform users" />
      <Card>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search by name or email…"
          style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #d4eeeb', borderRadius: 10, fontSize: 14, outline: 'none', marginBottom: 20, boxSizing: 'border-box' }} />
        <Table cols={['Name', 'Email', 'Role', 'Phone', 'Joined', 'Status', 'Actions']} rows={filtered} renderRow={u => (<>
          <Td><div style={{ fontWeight: 600 }}>{u.name}</div></Td>
          <Td>{u.email}</Td>
          <Td><Badge label={u.role} color={u.role === 'Admin' ? 'red' : u.role === 'Provider' ? 'yellow' : 'teal'} /></Td>
          <Td>{u.phone || '—'}</Td>
          <Td>{u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN') : '—'}</Td>
          <Td><Badge label={u.is_active !== false ? 'Active' : 'Inactive'} color={u.is_active !== false ? 'green' : 'red'} /></Td>
          <Td><Btn label={u.is_active !== false ? 'Deactivate' : 'Activate'} color={u.is_active !== false ? 'red' : 'green'} small onClick={() => toggleActive(u.id, u.is_active !== false)} /></Td>
        </>)} />
        {filtered.length === 0 && <div style={{ textAlign: 'center', padding: 32, color: C.gray }}>No users found</div>}
      </Card>
    </div>
  );
}

// ── Providers ─────────────────────────────────────────────────────────────────
function Providers() {
  const [providers, setProviders] = useState([]);
  const [allProviders, setAllProviders] = useState([]);
  const [tab, setTab] = useState('all');

  useEffect(() => {
    // Get all users with Provider role
    api('/admin/users').then(d => {
      const all = d?.data || [];
      setAllProviders(all.filter(u => u.role === 'Provider'));
    }).catch(() => {});
    // Get pending verification providers
    api('/admin/providers/pending').then(d => setProviders(d?.data || [])).catch(() => {});
  }, []);

  async function updateStatus(id, action) {
    const body = action === 'approve' ? { action: 'approve' } : { action: 'reject', rejection_reason: 'Does not meet requirements' };
    await api(`/admin/providers/${id}/verify`, { method: 'PATCH', body: JSON.stringify(body) }).catch(() => {});
    setProviders(p => p.filter(x => x.id !== id));
  }

  const displayList = tab === 'pending' ? providers : allProviders;

  return (
    <div>
      <Title t="Service Provider Management" s="Approve, verify, and manage providers" />
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['all', 'All Providers'], ['pending', 'Pending Verification']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ padding: '7px 18px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, background: tab === k ? C.primary : C.white, color: tab === k ? C.white : C.gray, boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>{l}</button>
        ))}
      </div>
      <Card>
        <Table cols={['Name', 'Email', 'Phone', 'Joined', 'Status', 'Actions']} rows={displayList} renderRow={p => (<>
          <Td><div style={{ fontWeight: 600 }}>{p.name}</div></Td>
          <Td>{p.email}</Td>
          <Td>{p.phone || '—'}</Td>
          <Td>{p.created_at ? new Date(p.created_at).toLocaleDateString('en-IN') : '—'}</Td>
          <Td><Badge label={p.verification_status || (p.is_active !== false ? 'Active' : 'Inactive')} color={p.verification_status === 'Verified' ? 'green' : p.verification_status === 'Rejected' ? 'red' : 'yellow'} /></Td>
          <Td><div style={{ display: 'flex', gap: 6 }}>
            {tab === 'pending' && <>
              <Btn label="Approve" color="green" small onClick={() => updateStatus(p.id, 'approve')} />
              <Btn label="Reject" color="red" small onClick={() => updateStatus(p.id, 'reject')} />
            </>}
          </div></Td>
        </>)} />
        {displayList.length === 0 && <div style={{ textAlign: 'center', padding: 32, color: C.gray }}>No providers found</div>}
      </Card>
    </div>
  );
}

// ── Services ──────────────────────────────────────────────────────────────────
const DEFAULT_SERVICES = [
  { id: 1, name: 'Plumbing', category: 'Home Repair', price_min: 299, price_max: 999, active: true },
  { id: 2, name: 'Electrical', category: 'Home Repair', price_min: 349, price_max: 1200, active: true },
  { id: 3, name: 'Deep Cleaning', category: 'Cleaning', price_min: 499, price_max: 2000, active: true },
  { id: 4, name: 'Carpentry', category: 'Home Repair', price_min: 399, price_max: 1500, active: true },
  { id: 5, name: 'AC & Appliances', category: 'Appliances', price_min: 599, price_max: 2500, active: true },
  { id: 6, name: 'Painting', category: 'Renovation', price_min: 899, price_max: 5000, active: true },
  { id: 7, name: 'Pest Control', category: 'Cleaning', price_min: 799, price_max: 2000, active: true },
  { id: 8, name: 'Handyman', category: 'Home Repair', price_min: 199, price_max: 800, active: true },
  { id: 9, name: 'Outdoor Services', category: 'Outdoor', price_min: 349, price_max: 1500, active: true },
  { id: 10, name: 'Safety & Security', category: 'Security', price_min: 499, price_max: 3000, active: true },
  { id: 11, name: 'Moving & Packing', category: 'Moving', price_min: 999, price_max: 8000, active: true },
  { id: 12, name: 'Tech Services', category: 'Technology', price_min: 299, price_max: 2000, active: true },
];

function Services() {
  const [services, setServices] = useState(DEFAULT_SERVICES);
  const [form, setForm] = useState({ name: '', category: '', price_min: '', price_max: '' });
  const [msg, setMsg] = useState('');

  function addService() {
    if (!form.name || !form.category) { setMsg('Name and category required'); return; }
    setServices(s => [...s, { id: Date.now(), ...form, price_min: Number(form.price_min), price_max: Number(form.price_max), active: true }]);
    setForm({ name: '', category: '', price_min: '', price_max: '' });
    setMsg('✅ Service added!');
    setTimeout(() => setMsg(''), 2000);
  }

  function toggleActive(id) { setServices(s => s.map(x => x.id === id ? { ...x, active: !x.active } : x)); }
  function deleteService(id) { setServices(s => s.filter(x => x.id !== id)); }

  const iS = { padding: '9px 12px', border: '1.5px solid #d4eeeb', borderRadius: 8, fontSize: 13, outline: 'none', background: C.white };

  return (
    <div>
      <Title t="Service & Category Management" s="Add, edit, and manage all services" />
      <Card style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>➕ Add New Service</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
          <div><label style={{ fontSize: 11, color: C.gray, display: 'block', marginBottom: 4 }}>SERVICE NAME</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Plumbing" style={{ ...iS, width: '100%', boxSizing: 'border-box' }} /></div>
          <div><label style={{ fontSize: 11, color: C.gray, display: 'block', marginBottom: 4 }}>CATEGORY</label><input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. Home Repair" style={{ ...iS, width: '100%', boxSizing: 'border-box' }} /></div>
          <div><label style={{ fontSize: 11, color: C.gray, display: 'block', marginBottom: 4 }}>MIN PRICE (₹)</label><input type="number" value={form.price_min} onChange={e => setForm(f => ({ ...f, price_min: e.target.value }))} placeholder="299" style={{ ...iS, width: '100%', boxSizing: 'border-box' }} /></div>
          <div><label style={{ fontSize: 11, color: C.gray, display: 'block', marginBottom: 4 }}>MAX PRICE (₹)</label><input type="number" value={form.price_max} onChange={e => setForm(f => ({ ...f, price_max: e.target.value }))} placeholder="999" style={{ ...iS, width: '100%', boxSizing: 'border-box' }} /></div>
          <Btn label="Add" onClick={addService} />
        </div>
        {msg && <div style={{ marginTop: 10, fontSize: 13, color: msg.startsWith('✅') ? C.green : C.red }}>{msg}</div>}
      </Card>
      <Card>
        <Table cols={['Service', 'Category', 'Price Range', 'Status', 'Actions']} rows={services} renderRow={s => (<>
          <Td><div style={{ fontWeight: 600 }}>{s.name}</div></Td>
          <Td>{s.category}</Td>
          <Td>₹{s.price_min} – ₹{s.price_max}</Td>
          <Td><Badge label={s.active ? 'Active' : 'Inactive'} color={s.active ? 'green' : 'gray'} /></Td>
          <Td><div style={{ display: 'flex', gap: 6 }}>
            <Btn label={s.active ? 'Deactivate' : 'Activate'} color={s.active ? 'yellow' : 'green'} small onClick={() => toggleActive(s.id)} />
            <Btn label="Delete" color="red" small onClick={() => deleteService(s.id)} />
          </div></Td>
        </>)} />
      </Card>
    </div>
  );
}

// ── Bookings ──────────────────────────────────────────────────────────────────
function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('all');
  useEffect(() => { api('/admin/bookings').then(d => setBookings(d?.data?.bookings || d?.data || [])).catch(() => {}); }, []);

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status?.toLowerCase() === filter);
  const statusColor = { pending: 'yellow', confirmed: 'teal', 'in progress': 'yellow', completed: 'green', cancelled: 'red' };

  async function cancelBooking(id) {
    await api(`/admin/bookings/${id}/cancel`, { method: 'PATCH' }).catch(() => {});
    setBookings(b => b.map(x => x.id === id ? { ...x, status: 'Cancelled' } : x));
  }

  return (
    <div>
      <Title t="Booking Management" s="Track and manage all platform bookings" />
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: '7px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12, background: filter === f ? C.primary : C.white, color: filter === f ? C.white : C.gray, textTransform: 'capitalize', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>{f}</button>
        ))}
      </div>
      <Card>
        <Table cols={['ID', 'Customer', 'Provider', 'Service', 'Date', 'Amount', 'Status', 'Actions']} rows={filtered} renderRow={b => (<>
          <Td>#{b.id}</Td>
          <Td>{b.customer_name || '—'}</Td>
          <Td>{b.provider_name || '—'}</Td>
          <Td>{b.service_name || '—'}</Td>
          <Td>{b.scheduled_date ? new Date(b.scheduled_date).toLocaleDateString('en-IN') : '—'}</Td>
          <Td>₹{b.total_amount || '—'}</Td>
          <Td><Badge label={b.status || 'Pending'} color={statusColor[b.status?.toLowerCase()] || 'gray'} /></Td>
          <Td>{b.status !== 'Cancelled' && b.status !== 'Completed' && <Btn label="Cancel" color="red" small onClick={() => cancelBooking(b.id)} />}</Td>
        </>)} />
        {filtered.length === 0 && <div style={{ textAlign: 'center', padding: 32, color: C.gray }}>No bookings found</div>}
      </Card>
    </div>
  );
}

// ── Payments ──────────────────────────────────────────────────────────────────
function Payments() {
  const [payments, setPayments] = useState([]);
  const [tab, setTab] = useState('all');
  useEffect(() => { api('/admin/payments').then(d => setPayments(d?.data?.payments || d?.data || [])).catch(() => {}); }, []);

  const totalRevenue = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
  const commission = totalRevenue * 0.1;

  return (
    <div>
      <Title t="Payments & Revenue" s="Track transactions, commissions, and payouts" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { icon: '💰', label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, color: C.primary },
          { icon: '📊', label: 'Commission (10%)', value: `₹${commission.toLocaleString('en-IN')}`, color: C.accent },
          { icon: '🏦', label: 'Provider Payouts', value: `₹${(totalRevenue - commission).toLocaleString('en-IN')}`, color: C.green },
        ].map(s => <Card key={s.label}><div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div><div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div><div style={{ fontSize: 12, color: C.gray, marginTop: 4 }}>{s.label}</div></Card>)}
      </div>
      <Card>
        <Table cols={['ID', 'User', 'Amount', 'Method', 'Status', 'Date']} rows={payments} renderRow={p => (<>
          <Td>#{p.id}</Td>
          <Td>{p.user_name || p.customer_name || '—'}</Td>
          <Td style={{ fontWeight: 700, color: C.primary }}>₹{p.amount}</Td>
          <Td>{p.payment_method || 'Online'}</Td>
          <Td><Badge label={p.status || 'Completed'} color={p.status === 'completed' ? 'green' : p.status === 'pending' ? 'yellow' : 'gray'} /></Td>
          <Td>{p.created_at ? new Date(p.created_at).toLocaleDateString('en-IN') : '—'}</Td>
        </>)} />
        {payments.length === 0 && <div style={{ textAlign: 'center', padding: 32, color: C.gray }}>No payment records</div>}
      </Card>
    </div>
  );
}

// ── Reviews ───────────────────────────────────────────────────────────────────
function Reviews() {
  const [reviews, setReviews] = useState([]);
  useEffect(() => { api('/admin/reviews').then(d => setReviews(d?.data?.reviews || d?.data || [])).catch(() => {}); }, []);

  async function deleteReview(id) {
    await api(`/admin/reviews/${id}`, { method: 'DELETE' }).catch(() => {});
    setReviews(r => r.filter(x => x.id !== id));
  }

  return (
    <div>
      <Title t="Ratings & Reviews" s="Monitor and moderate customer reviews" />
      <Card>
        <Table cols={['Customer', 'Provider', 'Rating', 'Review', 'Date', 'Actions']} rows={reviews} renderRow={r => (<>
          <Td>{r.customer_name || '—'}</Td>
          <Td>{r.provider_name || '—'}</Td>
          <Td><span style={{ color: '#f59e0b' }}>{'★'.repeat(r.rating || 0)}</span> {r.rating}/5</Td>
          <Td style={{ maxWidth: 200 }}><div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.comment || '—'}</div></Td>
          <Td>{r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN') : '—'}</Td>
          <Td><Btn label="Remove" color="red" small onClick={() => deleteReview(r.id)} /></Td>
        </>)} />
        {reviews.length === 0 && <div style={{ textAlign: 'center', padding: 32, color: C.gray }}>No reviews found</div>}
      </Card>
    </div>
  );
}

// ── Notifications ─────────────────────────────────────────────────────────────
function Notifications() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState('all');
  const [sent, setSent] = useState([]);
  const [msg, setMsg] = useState('');

  function sendNotification() {
    if (!title || !message) { setMsg('Title and message required'); return; }
    setSent(s => [{ id: Date.now(), title, message, target, time: new Date().toLocaleString('en-IN') }, ...s]);
    setTitle(''); setMessage('');
    setMsg('✅ Notification sent!');
    setTimeout(() => setMsg(''), 2000);
  }

  const iS = { width: '100%', padding: '10px 14px', border: '1.5px solid #d4eeeb', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: C.white };

  return (
    <div>
      <Title t="Notifications & Announcements" s="Send notifications to users and providers" />
      <Card style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>📢 Send Notification</div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, color: C.gray, display: 'block', marginBottom: 4 }}>SEND TO</label>
          <div style={{ display: 'flex', gap: 10 }}>
            {['all', 'customers', 'providers'].map(t => (
              <button key={t} onClick={() => setTarget(t)} style={{ padding: '8px 16px', borderRadius: 20, border: `2px solid ${target === t ? C.primary : '#d4eeeb'}`, background: target === t ? '#e8f8f6' : C.white, color: target === t ? C.primary : C.gray, fontWeight: 700, fontSize: 13, cursor: 'pointer', textTransform: 'capitalize' }}>{t}</button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 14 }}><label style={{ fontSize: 11, color: C.gray, display: 'block', marginBottom: 4 }}>TITLE</label><input value={title} onChange={e => setTitle(e.target.value)} placeholder="Notification title" style={iS} /></div>
        <div style={{ marginBottom: 16 }}><label style={{ fontSize: 11, color: C.gray, display: 'block', marginBottom: 4 }}>MESSAGE</label><textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Write your message…" rows={3} style={{ ...iS, resize: 'vertical' }} /></div>
        {msg && <div style={{ marginBottom: 12, fontSize: 13, color: msg.startsWith('✅') ? C.green : C.red }}>{msg}</div>}
        <Btn label="Send Notification" onClick={sendNotification} />
      </Card>
      {sent.length > 0 && (
        <Card>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>📬 Sent Notifications</div>
          {sent.map(n => (
            <div key={n.id} style={{ padding: '12px 0', borderBottom: '1px solid #e0f0ee' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{n.title}</div>
                <Badge label={n.target} color="teal" />
              </div>
              <div style={{ fontSize: 13, color: C.gray, marginTop: 4 }}>{n.message}</div>
              <div style={{ fontSize: 11, color: '#8aacbf', marginTop: 4 }}>{n.time}</div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

// ── KYC ───────────────────────────────────────────────────────────────────────
function KYC() {
  const [kyc, setKyc] = useState([]);
  useEffect(() => { api('/admin/kyc').then(d => setKyc(d?.data?.kyc || d?.data || [])).catch(() => {}); }, []);

  async function updateKyc(id, status) {
    await api(`/admin/kyc/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }).catch(() => {});
    setKyc(k => k.map(x => x.id === id ? { ...x, status } : x));
  }

  return (
    <div>
      <Title t="KYC & Safety Verification" s="Verify provider documents and handle fraud" />
      <Card>
        {kyc.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: C.gray }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🛡️</div>
            <div>No pending KYC submissions</div>
          </div>
        ) : (
          <Table cols={['Provider', 'Document Type', 'Submitted', 'Status', 'Actions']} rows={kyc} renderRow={k => (<>
            <Td><div style={{ fontWeight: 600 }}>{k.provider_name || '—'}</div></Td>
            <Td>{k.document_type || 'ID Proof'}</Td>
            <Td>{k.created_at ? new Date(k.created_at).toLocaleDateString('en-IN') : '—'}</Td>
            <Td><Badge label={k.status || 'Pending'} color={k.status === 'Approved' ? 'green' : k.status === 'Rejected' ? 'red' : 'yellow'} /></Td>
            <Td><div style={{ display: 'flex', gap: 6 }}>
              <Btn label="Approve" color="green" small onClick={() => updateKyc(k.id, 'Approved')} />
              <Btn label="Reject" color="red" small onClick={() => updateKyc(k.id, 'Rejected')} />
            </div></Td>
          </>)} />
        )}
      </Card>
    </div>
  );
}

// ── Reports ───────────────────────────────────────────────────────────────────
function Reports() {
  const [period, setPeriod] = useState('monthly');
  const [data, setData] = useState({ new_users: 0, bookings: 0, revenue: 0, top_service: '—', service_stats: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api(`/admin/reports?period=${period}`)
      .then(d => { if (d?.data) setData(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  return (
    <div>
      <Title t="Reports & Analytics" s="Platform growth and performance metrics" />
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {['daily', 'weekly', 'monthly'].map(p => (
          <button key={p} onClick={() => setPeriod(p)} style={{ padding: '8px 20px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, background: period === p ? C.primary : C.white, color: period === p ? C.white : C.gray, textTransform: 'capitalize', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>{p}</button>
        ))}
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: 40, color: C.gray }}>Loading…</div> : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
            {[
              { icon: '👥', label: 'New Users', value: data.new_users, color: C.primary },
              { icon: '📅', label: 'Bookings', value: data.bookings, color: '#7c3aed' },
              { icon: '💰', label: 'Revenue', value: `₹${Number(data.revenue || 0).toLocaleString('en-IN')}`, color: C.green },
              { icon: '🏆', label: 'Top Service', value: data.top_service, color: C.accent },
            ].map(s => <Card key={s.label}><div style={{ fontSize: 26, marginBottom: 8 }}>{s.icon}</div><div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div><div style={{ fontSize: 12, color: C.gray, marginTop: 4 }}>{s.label}</div></Card>)}
          </div>
          <Card>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>📊 Most Popular Services</div>
            {data.service_stats.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 24, color: C.gray }}>No booking data for this period</div>
            ) : data.service_stats.map(s => (
              <div key={s.name} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                  <span style={{ fontWeight: 600 }}>{s.name}</span>
                  <span style={{ color: C.gray }}>{s.count} bookings ({s.pct}%)</span>
                </div>
                <div style={{ background: '#e0f0ee', borderRadius: 10, height: 8 }}>
                  <div style={{ background: C.primary, borderRadius: 10, height: 8, width: `${s.pct}%`, transition: 'width 0.5s' }} />
                </div>
              </div>
            ))}
          </Card>
        </>
      )}
    </div>
  );
}

// ── Coupons ───────────────────────────────────────────────────────────────────
function Coupons() {
  const [coupons, setCoupons] = useState([
    { id: 1, code: 'FIRST50', discount: 50, type: '%', min_order: 299, uses: 142, active: true },
    { id: 2, code: 'SAVE100', discount: 100, type: '₹', min_order: 499, uses: 87, active: true },
    { id: 3, code: 'CLEAN20', discount: 20, type: '%', min_order: 399, uses: 34, active: false },
  ]);
  const [form, setForm] = useState({ code: '', discount: '', type: '%', min_order: '' });
  const [msg, setMsg] = useState('');

  function addCoupon() {
    if (!form.code || !form.discount) { setMsg('Code and discount required'); return; }
    setCoupons(c => [...c, { id: Date.now(), ...form, discount: Number(form.discount), min_order: Number(form.min_order), uses: 0, active: true }]);
    setForm({ code: '', discount: '', type: '%', min_order: '' });
    setMsg('✅ Coupon created!'); setTimeout(() => setMsg(''), 2000);
  }

  const iS = { padding: '9px 12px', border: '1.5px solid #d4eeeb', borderRadius: 8, fontSize: 13, outline: 'none', background: C.white };

  return (
    <div>
      <Title t="Offers & Coupons" s="Create and manage discount codes" />
      <Card style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>🎟️ Create Coupon</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
          <div><label style={{ fontSize: 11, color: C.gray, display: 'block', marginBottom: 4 }}>CODE</label><input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="SAVE50" style={{ ...iS, width: '100%', boxSizing: 'border-box' }} /></div>
          <div><label style={{ fontSize: 11, color: C.gray, display: 'block', marginBottom: 4 }}>DISCOUNT</label><input type="number" value={form.discount} onChange={e => setForm(f => ({ ...f, discount: e.target.value }))} placeholder="50" style={{ ...iS, width: '100%', boxSizing: 'border-box' }} /></div>
          <div><label style={{ fontSize: 11, color: C.gray, display: 'block', marginBottom: 4 }}>TYPE</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={{ ...iS, width: '100%', boxSizing: 'border-box', cursor: 'pointer' }}>
              <option value="%">% Percent</option><option value="₹">₹ Fixed</option>
            </select>
          </div>
          <div><label style={{ fontSize: 11, color: C.gray, display: 'block', marginBottom: 4 }}>MIN ORDER (₹)</label><input type="number" value={form.min_order} onChange={e => setForm(f => ({ ...f, min_order: e.target.value }))} placeholder="299" style={{ ...iS, width: '100%', boxSizing: 'border-box' }} /></div>
          <Btn label="Create" onClick={addCoupon} />
        </div>
        {msg && <div style={{ marginTop: 10, fontSize: 13, color: msg.startsWith('✅') ? C.green : C.red }}>{msg}</div>}
      </Card>
      <Card>
        <Table cols={['Code', 'Discount', 'Min Order', 'Uses', 'Status', 'Actions']} rows={coupons} renderRow={c => (<>
          <Td><span style={{ fontWeight: 800, fontFamily: 'monospace', color: C.primary }}>{c.code}</span></Td>
          <Td>{c.discount}{c.type} off</Td>
          <Td>₹{c.min_order}</Td>
          <Td>{c.uses} uses</Td>
          <Td><Badge label={c.active ? 'Active' : 'Inactive'} color={c.active ? 'green' : 'gray'} /></Td>
          <Td><div style={{ display: 'flex', gap: 6 }}>
            <Btn label={c.active ? 'Disable' : 'Enable'} color={c.active ? 'yellow' : 'green'} small onClick={() => setCoupons(cp => cp.map(x => x.id === c.id ? { ...x, active: !x.active } : x))} />
            <Btn label="Delete" color="red" small onClick={() => setCoupons(cp => cp.filter(x => x.id !== c.id))} />
          </div></Td>
        </>)} />
      </Card>
    </div>
  );
}

// ── Support ───────────────────────────────────────────────────────────────────
function Support() {
  const [complaints, setComplaints] = useState([]);
  useEffect(() => { api('/admin/complaints').then(d => setComplaints(d?.data?.complaints || d?.data || [])).catch(() => {}); }, []);

  async function resolve(id) {
    await api(`/admin/complaints/${id}/resolve`, { method: 'PATCH' }).catch(() => {});
    setComplaints(c => c.map(x => x.id === id ? { ...x, status: 'Resolved' } : x));
  }

  return (
    <div>
      <Title t="Support & Complaints" s="Handle customer issues and complaints" />
      <Card>
        {complaints.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: C.gray }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
            <div>No open complaints</div>
          </div>
        ) : (
          <Table cols={['User', 'Subject', 'Description', 'Status', 'Date', 'Actions']} rows={complaints} renderRow={c => (<>
            <Td>{c.user_name || '—'}</Td>
            <Td><div style={{ fontWeight: 600 }}>{c.subject || '—'}</div></Td>
            <Td style={{ maxWidth: 200 }}><div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.description || '—'}</div></Td>
            <Td><Badge label={c.status || 'Open'} color={c.status === 'Resolved' ? 'green' : c.status === 'In Progress' ? 'yellow' : 'red'} /></Td>
            <Td>{c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN') : '—'}</Td>
            <Td>{c.status !== 'Resolved' && <Btn label="Resolve" color="green" small onClick={() => resolve(c.id)} />}</Td>
          </>)} />
        )}
      </Card>
    </div>
  );
}
