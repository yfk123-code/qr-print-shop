'use client'
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
}