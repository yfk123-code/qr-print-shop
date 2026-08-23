const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('\n🚀 QR Print System - Auto Setup Starting...\n');

// 1. FOLDERS CREATE
const dirs = ['lib', 'app', 'app/login', 'app/dashboard', 'app/print', 'public'];
dirs.forEach(dir => {
  fs.mkdirSync(path.join(process.cwd(), dir), { recursive: true });
  console.log('📁 Created: ' + dir + '/');
});

const files = {};

// 2. package.json
files['package.json'] = JSON.stringify({
  "name": "qr-print-shop",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.45.0",
    "next": "^14.2.5",
    "qrcode.react": "^3.1.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  }
}, null, 2);

// 3. .env.local
files['.env.local'] = `NEXT_PUBLIC_SUPABASE_URL=YAHAN_APNA_SUPABASE_URL_DALO
NEXT_PUBLIC_SUPABASE_ANON_KEY=YAHAN_APNI_SUPABASE_KEY_DALO
NEXT_PUBLIC_UPI_ID=rahul@okaxis
NEXT_PUBLIC_SHOP_NAME=Sharma Print House`;

// 4. lib/supabase.js
files['lib/supabase.js'] = `import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)`;

// 5. app/globals.css
files['app/globals.css'] = `:root {
  --primary: #6C63FF;
  --primary-dark: #5A52D5;
  --secondary: #2EC4B6;
  --danger: #FF6B6B;
  --success: #51CF66;
  --warning: #FFD43B;
  --dark: #1A1A2E;
  --darker: #16213E;
  --light: #F8F9FA;
  --gray: #6C757D;
  --light-gray: #E9ECEF;
  --card-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
}
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'Segoe UI',system-ui,sans-serif; background:var(--light); color:var(--dark); }
@keyframes fadeIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
@keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.03)} }
.fade-in { animation:fadeIn 0.6s ease-out; }
.navbar { background:linear-gradient(135deg,var(--dark),var(--darker)); padding:15px 30px; display:flex; justify-content:space-between; align-items:center; position:sticky; top:0; z-index:100; box-shadow:0 4px 20px rgba(0,0,0,0.3); }
.navbar-brand { color:white; font-size:22px; font-weight:800; text-decoration:none; }
.navbar-brand span { background:linear-gradient(135deg,var(--primary),var(--secondary)); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
.btn { padding:10px 22px; border:none; border-radius:10px; font-size:14px; font-weight:600; cursor:pointer; transition:all 0.3s; display:flex; align-items:center; gap:8px; text-decoration:none; }
.btn:hover { transform:translateY(-2px); box-shadow:var(--card-shadow); }
.btn-primary { background:linear-gradient(135deg,var(--primary),var(--primary-dark)); color:white; }
.btn-success { background:linear-gradient(135deg,var(--success),#40C057); color:white; }
.btn-danger { background:linear-gradient(135deg,var(--danger),#FA5252); color:white; }
.btn-secondary { background:linear-gradient(135deg,var(--secondary),#20B2AA); color:white; }
.btn-outline { background:transparent; border:2px solid white; color:white; }
.btn-outline:hover { background:white; color:var(--dark); }
.btn-large { padding:16px 32px; font-size:18px; border-radius:14px; }
.btn-full { width:100%; justify-content:center; }
.card { background:white; border-radius:16px; padding:25px; box-shadow:var(--card-shadow); }
.stats-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:20px; margin:20px 0; }
.stat-card { background:white; border-radius:16px; padding:20px 25px; box-shadow:var(--card-shadow); position:relative; overflow:hidden; transition:all 0.3s; }
.stat-card:hover { transform:translateY(-5px); }
.stat-card::before { content:''; position:absolute; top:0; left:0; width:5px; height:100%; }
.stat-card.blue::before { background:var(--primary); }
.stat-card.green::before { background:var(--success); }
.stat-card.orange::before { background:var(--warning); }
.stat-card.red::before { background:var(--danger); }
.stat-icon { font-size:36px; margin-bottom:10px; }
.stat-value { font-size:32px; font-weight:800; }
.stat-label { font-size:13px; color:var(--gray); text-transform:uppercase; letter-spacing:1px; }
.input { width:100%; padding:14px 16px; border:2px solid var(--light-gray); border-radius:12px; font-size:16px; transition:all 0.3s; }
.input:focus { outline:none; border-color:var(--primary); box-shadow:0 0 0 4px rgba(108,99,255,0.1); }
.input-group { margin-bottom:18px; }
.input-group label { display:block; font-size:14px; font-weight:600; color:var(--gray); margin-bottom:6px; }
.toggle-group { display:flex; gap:10px; flex-wrap:wrap; }
.toggle-btn { flex:1; min-width:100px; padding:14px 16px; border:2px solid var(--light-gray); border-radius:12px; background:white; cursor:pointer; text-align:center; font-weight:600; font-size:14px; transition:all 0.3s; }
.toggle-btn.active { border-color:var(--primary); background:linear-gradient(135deg,var(--primary),var(--primary-dark)); color:white; }
.toggle-btn.active-green { border-color:var(--success); background:linear-gradient(135deg,var(--success),#40C057); color:white; }
.toggle-btn.active-orange { border-color:#FF9800; background:linear-gradient(135deg,#FF9800,#F57C00); color:white; }
.order-card { background:white; border-radius:16px; padding:20px; margin-bottom:15px; box-shadow:var(--card-shadow); border-left:5px solid var(--primary); animation:fadeIn 0.4s ease-out; }
.order-card.cash { border-left-color:var(--warning); }
.order-card.online { border-left-color:var(--success); }
.order-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px; }
.order-token { font-size:20px; font-weight:800; color:var(--primary); }
.order-badge { padding:5px 14px; border-radius:20px; font-size:12px; font-weight:700; text-transform:uppercase; }
.badge-cash { background:#FFF3CD; color:#856404; }
.badge-online { background:#D4EDDA; color:#155724; }
.badge-pending { background:#FFF3E0; color:#E65100; }
.badge-approved { background:#E8F5E9; color:#2E7D32; }
.badge-rejected { background:#FFEBEE; color:#C62828; }
.order-details { display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:14px; color:var(--gray); margin-bottom:15px; }
.order-actions { display:flex; gap:10px; }
.tabs { display:flex; gap:5px; background:var(--light-gray); padding:5px; border-radius:14px; margin:20px 0; }
.tab { flex:1; padding:12px 20px; border:none; border-radius:10px; background:transparent; cursor:pointer; font-weight:600; font-size:14px; transition:all 0.3s; color:var(--gray); }
.tab.active { background:white; color:var(--primary); box-shadow:0 2px 10px rgba(0,0,0,0.1); }
.table-container { overflow-x:auto; border-radius:16px; box-shadow:var(--card-shadow); }
.table { width:100%; border-collapse:collapse; background:white; }
.table th { background:var(--dark); color:white; padding:14px 16px; text-align:left; font-size:13px; text-transform:uppercase; }
.table td { padding:14px 16px; border-bottom:1px solid var(--light-gray); font-size:14px; }
.table tr:hover td { background:#F8F7FF; }
.upload-zone { border:3px dashed var(--light-gray); border-radius:16px; padding:50px 30px; text-align:center; cursor:pointer; transition:all 0.3s; background:#FAFBFF; }
.upload-zone:hover { border-color:var(--primary); background:#F0EEFF; }
.upload-zone.has-file { border-color:var(--success); background:#F0FFF4; border-style:solid; }
.upload-icon { font-size:60px; margin-bottom:15px; animation:bounce 2s infinite; }
.qr-box { display:inline-block; background:white; padding:30px; border-radius:20px; border:3px solid var(--primary); box-shadow:var(--card-shadow); }
.container { max-width:1100px; margin:0 auto; padding:20px; }
.container-small { max-width:500px; margin:0 auto; padding:20px; }
.login-page { min-height:100vh; display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg,var(--dark),var(--darker)); }
.login-card { background:white; border-radius:24px; padding:50px 40px; width:100%; max-width:420px; box-shadow:0 20px 60px rgba(0,0,0,0.3); animation:fadeIn 0.8s ease-out; }
.customer-page { min-height:100vh; background:linear-gradient(180deg,#667EEA 0%,#764BA2 100%); padding:20px; }
.customer-header { text-align:center; color:white; padding:30px 0; }
.customer-card { background:white; border-radius:20px; padding:25px; margin-bottom:15px; box-shadow:0 10px 30px rgba(0,0,0,0.15); animation:fadeIn 0.6s ease-out; }
.counter { display:flex; align-items:center; gap:15px; justify-content:center; }
.counter-btn { width:44px; height:44px; border-radius:50%; border:2px solid var(--light-gray); background:white; font-size:22px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.2s; }
.counter-btn:hover { background:var(--primary); color:white; border-color:var(--primary); }
.counter-value { font-size:28px; font-weight:800; min-width:40px; text-align:center; }
.total-amount { font-size:42px; font-weight:900; text-align:center; margin:15px 0; }
.submit-btn { width:100%; padding:18px; border:none; border-radius:16px; font-size:20px; font-weight:700; cursor:pointer; background:linear-gradient(135deg,var(--success),#40C057); color:white; box-shadow:0 6px 20px rgba(81,207,102,0.4); transition:all 0.3s; }
.submit-btn:hover { transform:translateY(-3px); }
.submit-btn:disabled { background:var(--gray); cursor:not-allowed; transform:none; }
.success-overlay { position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.7); display:flex; align-items:center; justify-content:center; z-index:1000; }
.success-modal { background:white; border-radius:24px; padding:40px; text-align:center; max-width:380px; width:90%; animation:fadeIn 0.5s ease-out; }
.empty-state { text-align:center; padding:60px 20px; color:var(--gray); }
.payment-section { background:linear-gradient(135deg,#667EEA,#764BA2); border-radius:16px; padding:25px; color:white; text-align:center; }
@media(max-width:768px) {
  .stats-grid { grid-template-columns:repeat(2,1fr); gap:10px; }
  .stat-value { font-size:24px; }
  .order-details { grid-template-columns:1fr; }
  .order-actions { flex-direction:column; }
  .login-card { margin:20px; padding:30px 25px; }
}`;

// 6. app/layout.js
files['app/layout.js'] = `import './globals.css'
export const metadata = { title:'QR Print System', description:'Scan QR, Upload, Print!' }
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
      <body>{children}</body>
    </html>
  )
}`;

// 7. app/page.js
files['app/page.js'] = `'use client'
import { useRouter } from 'next/navigation'
export default function Home() {
  const router = useRouter()
  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#1A1A2E 0%,#16213E 50%,#0F3460 100%)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',color:'white',textAlign:'center',padding:'20px'}}>
      <div className="fade-in">
        <div style={{fontSize:'80px',marginBottom:'20px'}}>🖨️</div>
        <h1 style={{fontSize:'52px',fontWeight:'900',marginBottom:'10px',background:'linear-gradient(135deg,#6C63FF,#2EC4B6)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>QR Print System</h1>
        <p style={{fontSize:'20px',opacity:0.7,marginBottom:'50px',maxWidth:'500px'}}>Customer QR scan kare → Document upload kare → Print nikle!</p>
        <div style={{display:'flex',gap:'20px',justifyContent:'center',flexWrap:'wrap'}}>
          <button className="btn btn-primary btn-large" onClick={()=>router.push('/login')}>🔑 Owner Login</button>
          <button className="btn btn-secondary btn-large" onClick={()=>router.push('/print')}>📱 Customer Print Page</button>
        </div>
        <div style={{marginTop:'80px',display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'30px',maxWidth:'700px'}}>
          {[{icon:'📱',title:'QR Scan',desc:'Koi app nahi'},{icon:'📄',title:'Upload',desc:'PDF, JPG, PNG'},{icon:'🖨️',title:'Print',desc:'Auto print'}].map((item,i)=>(
            <div key={i} style={{background:'rgba(255,255,255,0.05)',padding:'30px 20px',borderRadius:'16px',border:'1px solid rgba(255,255,255,0.1)'}}>
              <div style={{fontSize:'40px',marginBottom:'10px'}}>{item.icon}</div>
              <h3>{item.title}</h3>
              <p style={{opacity:0.6,fontSize:'14px'}}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}`;

// 8. app/login/page.js
files['app/login/page.js'] = `'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
export default function Login() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data, error: err } = await supabase.from('owner').select('*').eq('phone', phone).eq('password', password).single()
    if (err || !data) { setError('Galat Phone ya Password!'); setLoading(false); return }
    localStorage.setItem('owner', JSON.stringify(data))
    router.push('/dashboard')
  }
  return (
    <div className="login-page">
      <div className="login-card">
        <div style={{textAlign:'center',marginBottom:'10px',fontSize:'50px'}}>🖨️</div>
        <h1 style={{fontSize:'28px',fontWeight:'800',textAlign:'center',marginBottom:'8px'}}>Welcome Back!</h1>
        <p style={{textAlign:'center',color:'var(--gray)',marginBottom:'30px'}}>Apni shop ka dashboard access karein</p>
        {error && <div style={{background:'#FFEBEE',color:'#C62828',padding:'12px',borderRadius:'10px',marginBottom:'15px',textAlign:'center'}}>❌ {error}</div>}
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>📞 Phone Number</label>
            <input type="tel" className="input" placeholder="9876543210" value={phone} onChange={e=>setPhone(e.target.value)} required />
          </div>
          <div className="input-group">
            <label>🔒 Password</label>
            <input type="password" className="input" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary btn-large btn-full" disabled={loading}>{loading ? '⏳ Checking...' : '🚀 Login'}</button>
        </form>
      </div>
    </div>
  )
}`;

// 9. app/dashboard/page.js
files['app/dashboard/page.js'] = `'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { QRCodeSVG } from 'qrcode.react'

export default function Dashboard() {
  const [owner, setOwner] = useState(null)
  const [orders, setOrders] = useState([])
  const [tab, setTab] = useState('orders')
  const [filter, setFilter] = useState('pending')
  const [stats, setStats] = useState({ total:0, online:0, cash:0, pages:0 })

  useEffect(() => {
    const o = JSON.parse(localStorage.getItem('owner'))
    if (!o) return window.location.href = '/login'
    setOwner(o)
  }, [])

  const loadOrders = useCallback(async () => {
    let q = supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(100)
    if (filter !== 'all') q = q.eq('order_status', filter)
    const { data } = await q
    setOrders(data || [])
    const today = new Date().toISOString().split('T')[0]
    const { data: td } = await supabase.from('orders').select('*').gte('created_at', today).eq('order_status', 'approved')
    if (td) {
      setStats({
        total: td.length,
        online: td.filter(o=>o.payment_method==='online').reduce((s,o)=>s+o.amount,0),
        cash: td.filter(o=>o.payment_method==='cash').reduce((s,o)=>s+o.amount,0),
        pages: td.reduce((s,o)=>s+o.total_pages,0)
      })
    }
  }, [filter])

  useEffect(() => {
    if (owner) { loadOrders(); const i = setInterval(loadOrders, 5000); return () => clearInterval(i) }
  }, [owner, loadOrders])

  const approveOrder = async (id) => {
    await supabase.from('orders').update({ order_status: 'approved' }).eq('id', id)
    loadOrders()
  }
  const rejectOrder = async (id) => {
    await supabase.from('orders').update({ order_status: 'rejected' }).eq('id', id)
    loadOrders()
  }
  const updatePricing = async (bw, color) => {
    await supabase.from('owner').update({ bw_price: bw, color_price: color }).eq('id', owner.id)
    const u = { ...owner, bw_price: bw, color_price: color }
    setOwner(u); localStorage.setItem('owner', JSON.stringify(u))
    alert('Pricing Updated!')
  }

  if (!owner) return null
  const qrUrl = typeof window !== 'undefined' ? window.location.origin + '/print' : ''
  const pendingCount = orders.filter(o => o.order_status === 'pending').length

  return (
    <div>
      <nav className="navbar">
        <div className="navbar-brand"><span>🖨️ QR Print</span> — {owner.shop_name}</div>
        <button className="btn btn-outline" onClick={()=>{localStorage.removeItem('owner');window.location.href='/login'}}>🚪 Logout</button>
      </nav>
      <div className="container">
        <div className="stats-grid fade-in">
          <div className="stat-card blue"><div className="stat-icon">📄</div><div className="stat-value">{stats.total}</div><div className="stat-label">Today Prints</div></div>
          <div className="stat-card green"><div className="stat-icon">💳</div><div className="stat-value">₹{stats.online}</div><div className="stat-label">Online Income</div></div>
          <div className="stat-card orange"><div className="stat-icon">💵</div><div className="stat-value">₹{stats.cash}</div><div className="stat-label">Cash Income</div></div>
          <div className="stat-card red"><div className="stat-icon">📑</div><div className="stat-value">{stats.pages}</div><div className="stat-label">Pages Printed</div></div>
        </div>

        {pendingCount > 0 && (
          <div style={{background:'linear-gradient(135deg,#FF6B6B,#EE5A24)',color:'white',padding:'15px 25px',borderRadius:'14px',marginBottom:'20px',display:'flex',justifyContent:'space-between',alignItems:'center',animation:'pulse 2s infinite',flexWrap:'wrap',gap:'10px'}}>
            <span style={{fontSize:'18px',fontWeight:'700'}}>🔔 {pendingCount} New Order(s)!</span>
            <button className="btn" style={{background:'white',color:'#EE5A24',fontWeight:'700'}} onClick={()=>{setTab('orders');setFilter('pending')}}>View →</button>
          </div>
        )}

        <div className="tabs">
          {['orders','qr','history','settings'].map(t=>(
            <button key={t} className={'tab ' + (tab===t?'active':'')} onClick={()=>setTab(t)}>
              {t==='orders'?'📋':t==='qr'?'📱':t==='history'?'📊':'⚙️'} {t.toUpperCase()}
            </button>
          ))}
        </div>

        {tab === 'orders' && (
          <div className="fade-in">
            <div style={{display:'flex',gap:'10px',marginBottom:'20px',flexWrap:'wrap'}}>
              {['pending','approved','rejected','all'].map(f=>(
                <button key={f} className={'toggle-btn '+(filter===f?'active':'')} onClick={()=>setFilter(f)}>
                  {f==='pending'?'⏳':f==='approved'?'✅':f==='rejected'?'❌':'📋'} {f.toUpperCase()}
                </button>
              ))}
            </div>
            {orders.length === 0 ? (
              <div className="empty-state"><div style={{fontSize:'80px',opacity:0.5}}>📭</div><h3>Koi order nahi</h3></div>
            ) : orders.map(order => (
              <div key={order.id} className={'order-card ' + order.payment_method}>
                <div className="order-header">
                  <div>
                    <span className="order-token">🎫 #{order.token_number||'-'}</span>
                    <span style={{marginLeft:'10px',fontSize:'12px',color:'var(--gray)'}}>{new Date(order.created_at).toLocaleString()}</span>
                  </div>
                  <div style={{display:'flex',gap:'8px'}}>
                    <span className={'order-badge '+(order.payment_method==='cash'?'badge-cash':'badge-online')}>{order.payment_method==='cash'?'💵 CASH':'💳 ONLINE'}</span>
                    <span className={'order-badge badge-'+order.order_status}>{order.order_status}</span>
                  </div>
                </div>
                <div className="order-details">
                  <div>📄 {order.file_name}</div>
                  <div>📑 {order.pages}pg x {order.copies} = {order.total_pages}pg</div>
                  <div>{order.color_mode==='color'?'🎨 Color':'⬛ B/W'}</div>
                  <div>📐 {order.paper_size} | {order.sides}</div>
                  <div>💰 <strong style={{fontSize:'18px'}}>₹{order.amount}</strong></div>
                  <div><a href={order.file_url} target="_blank" style={{color:'var(--primary)',fontWeight:'600'}}>⬇️ Download</a></div>
                </div>
                {order.order_status === 'pending' && (
                  <div className="order-actions">
                    <button className="btn btn-success" onClick={()=>approveOrder(order.id)}>✅ Approve & Print</button>
                    <button className="btn btn-danger" onClick={()=>rejectOrder(order.id)}>❌ Reject</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === 'qr' && (
          <div className="fade-in">
            <div className="card" style={{textAlign:'center',padding:'50px'}}>
              <h2>📱 Your Shop QR Code</h2>
              <p style={{color:'var(--gray)',marginBottom:'30px'}}>Print karke counter pe chipka do!</p>
              <div className="qr-box">
                <QRCodeSVG value={qrUrl} size={280} level="H" />
                <h3 style={{marginTop:'15px',color:'var(--primary)'}}>{owner.shop_name}</h3>
                <p style={{color:'var(--gray)',fontSize:'14px'}}>📱 Scan to Upload & Print</p>
              </div>
              <br/>
              <a href={'https://api.qrserver.com/v1/create-qr-code/?size=800x800&data='+encodeURIComponent(qrUrl)} download="shop-qr.png" className="btn btn-primary btn-large" style={{marginTop:'30px',display:'inline-flex'}}>⬇️ Download QR</a>
            </div>
          </div>
        )}

        {tab === 'history' && (
          <div className="fade-in">
            <div className="table-container">
              <table className="table">
                <thead><tr><th>Token</th><th>Date</th><th>File</th><th>Pages</th><th>Mode</th><th>Payment</th><th>Amount</th><th>Status</th></tr></thead>
                <tbody>
                  {orders.map(o=>(
                    <tr key={o.id}>
                      <td><strong>#{o.token_number||'-'}</strong></td>
                      <td>{new Date(o.created_at).toLocaleString()}</td>
                      <td>{o.file_name?.substring(0,20)}</td>
                      <td>{o.total_pages}</td>
                      <td>{o.color_mode==='color'?'🎨':'⬛'} {o.color_mode}</td>
                      <td><span className={'order-badge '+(o.payment_method==='cash'?'badge-cash':'badge-online')}>{o.payment_method}</span></td>
                      <td><strong>₹{o.amount}</strong></td>
                      <td><span className={'order-badge badge-'+o.order_status}>{o.order_status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'settings' && (
          <div className="fade-in">
            <div className="card" style={{maxWidth:'500px'}}>
              <h3 style={{marginBottom:'20px'}}>⚙️ Print Pricing</h3>
              <div className="input-group"><label>⬛ B/W Per Page (₹)</label><input type="number" className="input" id="bw" defaultValue={owner.bw_price}/></div>
              <div className="input-group"><label>🎨 Color Per Page (₹)</label><input type="number" className="input" id="cl" defaultValue={owner.color_price}/></div>
              <button className="btn btn-primary btn-large btn-full" onClick={()=>updatePricing(parseInt(document.getElementById('bw').value),parseInt(document.getElementById('cl').value))}>💾 Save</button>
            </div>
            <div className="card" style={{maxWidth:'500px',marginTop:'20px'}}>
              <h3 style={{marginBottom:'15px'}}>🏪 Shop Info</h3>
              <p>🏪 {owner.shop_name} | 👤 {owner.owner_name} | 📞 {owner.phone}</p>
              <p>💳 UPI: {owner.upi_id} | 📍 {owner.address||'Not set'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}`;

// 10. app/print/page.js
files['app/print/page.js'] = `'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function CustomerPrint() {
  const [owner, setOwner] = useState(null)
  const [file, setFile] = useState(null)
  const [settings, setSettings] = useState({ copies:1, color_mode:'bw', paper_size:'A4', sides:'single' })
  const [pageCount, setPageCount] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(null)
  const [step, setStep] = useState(1)

  useEffect(() => {
    supabase.from('owner').select('*').limit(1).single().then(({data}) => setOwner(data))
  }, [])

  const handleFile = (e) => {
    const f = e.target.files[0]
    if (!f) return
    if (f.size > 25*1024*1024) { alert('File 25MB se badi hai!'); return }
    setFile(f)
    setPageCount(f.type === 'application/pdf' ? Math.max(1, Math.ceil(f.size/80000)) : 1)
    setStep(2)
  }

  const pricePerPage = settings.color_mode === 'color' ? (owner?.color_price||5) : (owner?.bw_price||2)
  const totalAmount = pageCount * settings.copies * pricePerPage
  const upiUrl = 'upi://pay?pa=' + (owner?.upi_id||'') + '&pn=' + encodeURIComponent(owner?.shop_name||'Print') + '&am=' + totalAmount + '&cu=INR&tn=Print-Order'

  const handleSubmit = async () => {
    if (!file) return alert('Pehle file upload karo!')
    setUploading(true)
    const fileName = Date.now() + '_' + file.name.replace(/[^a-zA-Z0-9.]/g, '_')
    const { error: ue } = await supabase.storage.from('prints').upload(fileName, file)
    if (ue) { alert('Upload Error!'); setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('prints').getPublicUrl(fileName)
    const { data: last } = await supabase.from('orders').select('token_number').order('created_at',{ascending:false}).limit(1).single()
    const token = (last?.token_number || 0) + 1
    const { error: oe } = await supabase.from('orders').insert([{
      token_number: token, file_url: publicUrl, file_name: file.name,
      file_size: (file.size/1024).toFixed(1)+'KB', pages: pageCount,
      copies: settings.copies, color_mode: settings.color_mode,
      paper_size: settings.paper_size, sides: settings.sides,
      total_pages: pageCount * settings.copies, amount: totalAmount,
      payment_method: paymentMethod,
      payment_status: paymentMethod === 'online' ? 'paid' : 'pending',
      order_status: 'pending'
    }])
    if (oe) { alert('Order Error!') } else { setSuccess({ token, amount: totalAmount, method: paymentMethod }) }
    setUploading(false)
  }

  if (!owner) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:'linear-gradient(180deg,#667EEA,#764BA2)',color:'white',fontSize:'20px'}}>⏳ Loading...</div>

  return (
    <div className="customer-page">
      {success && (
        <div className="success-overlay" onClick={()=>{setSuccess(null);setFile(null);setStep(1);setSettings({copies:1,color_mode:'bw',paper_size:'A4',sides:'single'})}}>
          <div className="success-modal" onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:'80px'}}>✅</div>
            <h2 style={{margin:'15px 0 5px'}}>Order Submitted!</h2>
            <div style={{background:'linear-gradient(135deg,#6C63FF,#5A52D5)',color:'white',padding:'20px',borderRadius:'16px',margin:'15px 0'}}>
              <div style={{fontSize:'14px',opacity:0.8}}>Your Token</div>
              <div style={{fontSize:'48px',fontWeight:'900'}}>#{success.token}</div>
            </div>
            <p style={{fontSize:'18px',fontWeight:'700'}}>₹{success.amount}</p>
            <p style={{color:'var(--gray)',marginBottom:'15px'}}>
              {success.method==='cash' ? '💵 Counter pe cash do aur print lo!' : '💳 Payment done! Print ho raha hai!'}
            </p>
            <button className="btn btn-primary btn-full" onClick={()=>{setSuccess(null);setFile(null);setStep(1);setSettings({copies:1,color_mode:'bw',paper_size:'A4',sides:'single'})}}>🆕 New Order</button>
          </div>
        </div>
      )}

      <div className="customer-header">
        <h1 style={{fontSize:'28px',fontWeight:'800'}}>🖨️ {owner.shop_name}</h1>
        <p style={{opacity:0.8}}>📍 {owner.address || 'Scan & Print — No App!'}</p>
      </div>

      <div className="container-small">
        <div style={{display:'flex',justifyContent:'center',gap:'8px',marginBottom:'20px'}}>
          {[1,2,3].map(s=>(<div key={s} style={{width:s===step?'40px':'12px',height:'12px',borderRadius:'6px',transition:'all 0.3s',background:s<=step?'white':'rgba(255,255,255,0.3)'}}/>))}
        </div>

        <div className="customer-card">
          <h3>📄 Step 1: Upload Document</h3>
          <label className={'upload-zone ' + (file?'has-file':'')}>
            {file ? (
              <div>
                <div style={{fontSize:'50px'}}>✅</div>
                <p style={{fontWeight:'700',marginTop:'10px'}}>{file.name}</p>
                <p style={{color:'var(--gray)',fontSize:'14px'}}>{(file.size/1024/1024).toFixed(2)} MB | ~{pageCount} pg</p>
              </div>
            ) : (
              <div>
                <div className="upload-icon">📁</div>
                <p style={{fontWeight:'700'}}>Tap to Upload</p>
                <p style={{color:'var(--gray)',fontSize:'13px'}}>PDF, JPG, PNG, DOCX | Max 25MB</p>
              </div>
            )}
            <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleFile} style={{display:'none'}} />
          </label>
          {file && <div className="input-group" style={{marginTop:'15px'}}><label>📑 Pages (edit if wrong)</label><input type="number" className="input" value={pageCount} min="1" onChange={e=>setPageCount(Math.max(1,parseInt(e.target.value)||1))}/></div>}
        </div>

        {step >= 2 && (
          <div className="customer-card">
            <h3>⚙️ Step 2: Print Settings</h3>
            <div style={{marginBottom:'18px'}}>
              <label style={{fontSize:'14px',fontWeight:'600',color:'var(--gray)',display:'block',marginBottom:'8px'}}>Print Type</label>
              <div className="toggle-group">
                <button className={'toggle-btn '+(settings.color_mode==='bw'?'active':'')} onClick={()=>setSettings({...settings,color_mode:'bw'})}>⬛ B/W<br/><small>₹{owner.bw_price}/pg</small></button>
                <button className={'toggle-btn '+(settings.color_mode==='color'?'active':'')} onClick={()=>setSettings({...settings,color_mode:'color'})}>🎨 Color<br/><small>₹{owner.color_price}/pg</small></button>
              </div>
            </div>
            <div style={{marginBottom:'18px'}}>
              <label style={{fontSize:'14px',fontWeight:'600',color:'var(--gray)',display:'block',marginBottom:'8px'}}>Copies</label>
              <div className="counter">
                <button className="counter-btn" onClick={()=>setSettings({...settings,copies:Math.max(1,settings.copies-1)})}>-</button>
                <span className="counter-value">{settings.copies}</span>
                <button className="counter-btn" onClick={()=>setSettings({...settings,copies:settings.copies+1})}>+</button>
              </div>
            </div>
            <div style={{marginBottom:'18px'}}>
              <label style={{fontSize:'14px',fontWeight:'600',color:'var(--gray)',display:'block',marginBottom:'8px'}}>Paper</label>
              <div className="toggle-group">
                {['A4','A3','Legal','Letter'].map(s=>(<button key={s} className={'toggle-btn '+(settings.paper_size===s?'active':'')} onClick={()=>setSettings({...settings,paper_size:s})}>{s}</button>))}
              </div>
            </div>
            <div>
              <label style={{fontSize:'14px',fontWeight:'600',color:'var(--gray)',display:'block',marginBottom:'8px'}}>Sides</label>
              <div className="toggle-group">
                <button className={'toggle-btn '+(settings.sides==='single'?'active':'')} onClick={()=>setSettings({...settings,sides:'single'})}>1️⃣ Single</button>
                <button className={'toggle-btn '+(settings.sides==='double'?'active':'')} onClick={()=>setSettings({...settings,sides:'double'})}>2️⃣ Double</button>
              </div>
            </div>
            {step===2 && <button className="btn btn-primary btn-large btn-full" style={{marginTop:'20px'}} onClick={()=>setStep(3)}>Continue to Payment →</button>}
          </div>
        )}

        {step >= 3 && (
          <>
            <div className="customer-card">
              <h3>💰 Step 3: Payment</h3>
              <div style={{background:'linear-gradient(135deg,#1A1A2E,#16213E)',borderRadius:'16px',padding:'25px',color:'white',textAlign:'center',marginBottom:'20px'}}>
                <div style={{fontSize:'14px',opacity:0.7}}>Total Amount</div>
                <div className="total-amount">₹{totalAmount}</div>
                <div style={{fontSize:'13px',opacity:0.6}}>{pageCount}pg x {settings.copies} copies x ₹{pricePerPage}</div>
              </div>
              <div className="toggle-group">
                <button className={'toggle-btn '+(paymentMethod==='cash'?'active-orange':'')} onClick={()=>setPaymentMethod('cash')}>💵 Cash<br/><small>Counter pe do</small></button>
                <button className={'toggle-btn '+(paymentMethod==='online'?'active-green':'')} onClick={()=>setPaymentMethod('online')}>📱 UPI<br/><small>Abhi pay karo</small></button>
              </div>

              {paymentMethod === 'online' && (
                <div className="payment-section" style={{marginTop:'20px'}}>
                  <h3>📱 Scan & Pay ₹{totalAmount}</h3>
                  <p style={{opacity:0.8,marginBottom:'15px',fontSize:'14px'}}>QR scan karo ya button dabao</p>
                  <div style={{background:'white',padding:'20px',borderRadius:'16px',display:'inline-block',marginBottom:'15px'}}>
                    <img src={'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data='+encodeURIComponent(upiUrl)} alt="UPI QR" width="200" height="200" />
                  </div>
                  <p style={{fontSize:'14px',opacity:0.8}}>UPI: <strong>{owner.upi_id}</strong></p>
                  <a href={upiUrl} className="btn btn-large btn-full" style={{background:'white',color:'#764BA2',marginTop:'10px',fontWeight:'800',textDecoration:'none',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}}>
                    📱 Open UPI App & Pay ₹{totalAmount}
                  </a>
                  <p style={{fontSize:'12px',opacity:0.6,marginTop:'10px'}}>⚠️ Pay karne ke baad neeche Submit button dabao</p>
                </div>
              )}
            </div>
            <button className="submit-btn" onClick={handleSubmit} disabled={uploading} style={{marginTop:'10px',marginBottom:'30px'}}>
              {uploading ? '⏳ Uploading...' : '🖨️ Submit Print Order — ₹'+totalAmount}
            </button>
          </>
        )}
        <div style={{textAlign:'center',padding:'20px',color:'rgba(255,255,255,0.5)',fontSize:'13px'}}>Powered by QR Print System ❤️</div>
      </div>
    </div>
  )
}`;

// WRITE ALL FILES
console.log('\n📝 Writing files...\n');
Object.entries(files).forEach(([name, content]) => {
  const filePath = path.join(process.cwd(), name);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Created: ' + name);
});

// INSTALL DEPENDENCIES
console.log('\n📦 Installing dependencies (Thoda time lagega 1-2 min)...\n');
try {
  execSync('npm install', { stdio: 'inherit' });
} catch(e) {
  console.log('⚠️ npm install manually run karna padega agar issue aaye.');
}

console.log('\n🎉 SAB KUCH SETUP HO GAYA HAI!\n');
console.log('Ab chalao: npm run dev');