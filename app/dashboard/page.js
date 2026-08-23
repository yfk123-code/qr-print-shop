'use client'
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
}