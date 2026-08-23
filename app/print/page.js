'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import QRCode from 'qrcode'

export default function CustomerPrint() {
  const [owner, setOwner] = useState(null)
  const [files, setFiles] = useState([]) // [{file, name, size, pageCount, pageRange}]
  const [settings, setSettings] = useState({ copies: 1, color_mode: 'bw', paper_size: 'A4', sides: 'single' })
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(null)
  const [step, setStep] = useState(1)
  const [qrDataUrl, setQrDataUrl] = useState(null)
  const [paidConfirmed, setPaidConfirmed] = useState(false)

  useEffect(() => {
    supabase.from('owner').select('*').limit(1).single().then(({ data }) => setOwner(data))
  }, [])

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files || [])
    if (!selected.length) return

    const newFiles = []
    for (const f of selected) {
      if (f.size > 25 * 1024 * 1024) {
        alert(`${f.name} 25MB se badi hai, isko skip kiya!`)
        continue
      }
      newFiles.push({
        file: f,
        name: f.name,
        size: f.size,
        pageCount: f.type === 'application/pdf' ? Math.max(1, Math.ceil(f.size / 80000)) : 1,
        pageRange: ''
      })
    }
    setFiles(prev => [...prev, ...newFiles])
    if (newFiles.length) setStep(2)
    e.target.value = null
  }

  const removeFile = (idx) => {
    setFiles(prev => prev.filter((_, i) => i !== idx))
  }

  const updateFileField = (idx, field, value) => {
    setFiles(prev => prev.map((f, i) => i === idx ? { ...f, [field]: value } : f))
  }

  const pricePerPage = settings.color_mode === 'color' ? (owner?.color_price || 5) : (owner?.bw_price || 2)
  const totalPages = files.reduce((sum, f) => sum + (f.pageCount || 0), 0) * settings.copies
  const totalAmount = totalPages * pricePerPage

  const upiUrl = owner?.upi_id
    ? 'upi://pay?pa=' + owner.upi_id + '&pn=' + encodeURIComponent(owner?.shop_name || 'Print') + '&am=' + totalAmount + '&cu=INR&tn=Print-Order'
    : null

  useEffect(() => {
    if (paymentMethod === 'online' && upiUrl && totalAmount > 0) {
      QRCode.toDataURL(upiUrl, { width: 220, margin: 1 })
        .then(setQrDataUrl)
        .catch(() => setQrDataUrl(null))
    } else {
      setQrDataUrl(null)
    }
  }, [paymentMethod, upiUrl, totalAmount])

  const handleSubmit = async () => {
    if (!files.length) return alert('Pehle file upload karo!')
    if (totalAmount <= 0) return alert('Amount calculate nahi ho paya, page count check karo!')
    if (paymentMethod === 'online' && !owner?.upi_id) {
      return alert('Shop ne abhi UPI ID set nahi ki hai. Cash payment select karo.')
    }
    if (paymentMethod === 'online' && !paidConfirmed) {
      return alert('Pehle payment karo, phir "Maine Payment Kar Diya" checkbox tick karo.')
    }

    setUploading(true)
    try {
      const { data: last } = await supabase
        .from('orders')
        .select('token_number')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      const token = (last?.token_number || 0) + 1

      const rows = []
      for (const f of files) {
        const fileName = Date.now() + '_' + f.name.replace(/[^a-zA-Z0-9.]/g, '_')
        const { error: ue } = await supabase.storage.from('prints').upload(fileName, f.file)
        if (ue) throw new Error('Upload failed: ' + f.name)

        const { data: { publicUrl } } = supabase.storage.from('prints').getPublicUrl(fileName)

        rows.push({
          token_number: token,
          file_url: publicUrl,
          file_name: f.name,
          file_size: (f.size / 1024).toFixed(1) + 'KB',
          pages: f.pageCount,
          page_range: f.pageRange || '',
          copies: settings.copies,
          color_mode: settings.color_mode,
          paper_size: settings.paper_size,
          sides: settings.sides,
          total_pages: f.pageCount * settings.copies,
          amount: f.pageCount * settings.copies * pricePerPage,
          payment_method: paymentMethod,
          payment_status: paymentMethod === 'online' ? 'pending_verification' : 'pending',
          order_status: 'pending'
        })
      }

      const { error: oe } = await supabase.from('orders').insert(rows)
      if (oe) throw new Error('Order create failed!')

      setSuccess({ token, amount: totalAmount, method: paymentMethod, count: files.length })
    } catch (e) {
      alert(e.message || 'Kuch error aa gaya!')
    }
    setUploading(false)
  }

  const resetAll = () => {
    setSuccess(null)
    setFiles([])
    setStep(1)
    setPaidConfirmed(false)
    setSettings({ copies: 1, color_mode: 'bw', paper_size: 'A4', sides: 'single' })
    setPaymentMethod('cash')
  }

  if (!owner) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:'linear-gradient(180deg,#667EEA,#764BA2)',color:'white',fontSize:'20px'}}>⏳ Loading...</div>

  return (
    <div className="customer-page">
      {success && (
        <div className="success-overlay" onClick={resetAll}>
          <div className="success-modal" onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:'80px'}}>✅</div>
            <h2 style={{margin:'15px 0 5px'}}>Order Submitted!</h2>
            <div style={{background:'linear-gradient(135deg,#6C63FF,#5A52D5)',color:'white',padding:'20px',borderRadius:'16px',margin:'15px 0'}}>
              <div style={{fontSize:'14px',opacity:0.8}}>Your Token</div>
              <div style={{fontSize:'48px',fontWeight:'900'}}>#{success.token}</div>
            </div>
            <p style={{fontSize:'18px',fontWeight:'700'}}>₹{success.amount} ({success.count} file{success.count>1?'s':''})</p>
            <p style={{color:'var(--gray)',marginBottom:'15px'}}>
              {success.method==='cash' ? '💵 Counter pe cash do aur print lo!' : '📱 Payment verify hone ke baad print hoga!'}
            </p>
            <button className="btn btn-primary btn-full" onClick={resetAll}>🆕 New Order</button>
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
          <h3>📄 Step 1: Upload Documents (Multiple Allowed)</h3>
          <label className={'upload-zone ' + (files.length?'has-file':'')}>
            <div>
              <div className="upload-icon">📁</div>
              <p style={{fontWeight:'700'}}>Tap to Upload (Multiple Files)</p>
              <p style={{color:'var(--gray)',fontSize:'13px'}}>PDF, JPG, PNG, DOCX | Max 25MB per file</p>
            </div>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" multiple onChange={handleFiles} style={{display:'none'}} />
          </label>

          {files.map((f, idx) => (
            <div key={idx} style={{background:'rgba(0,0,0,0.03)',borderRadius:'12px',padding:'15px',marginTop:'12px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <p style={{fontWeight:'700',margin:0}}>✅ {f.name}</p>
                  <p style={{color:'var(--gray)',fontSize:'13px',margin:0}}>{(f.size/1024/1024).toFixed(2)} MB</p>
                </div>
                <button onClick={()=>removeFile(idx)} style={{background:'#C1666B',color:'white',border:0,borderRadius:'8px',padding:'6px 12px',cursor:'pointer'}}>Remove</button>
              </div>
              <div className="input-group" style={{marginTop:'10px'}}>
                <label>📑 Pages (edit if wrong)</label>
                <input type="number" className="input" value={f.pageCount} min="1" onChange={e=>updateFileField(idx,'pageCount',Math.max(1,parseInt(e.target.value)||1))}/>
              </div>
              <div className="input-group" style={{marginTop:'10px'}}>
                <label>🔢 Page Range (optional, e.g. 2-5 ya 1,3,7 — khali chhodo pura print karne ke liye)</label>
                <input type="text" className="input" placeholder="All pages" value={f.pageRange} onChange={e=>updateFileField(idx,'pageRange',e.target.value)}/>
              </div>
            </div>
          ))}
        </div>

        {step >= 2 && files.length > 0 && (
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
              <label style={{fontSize:'14px',fontWeight:'600',color:'var(--gray)',display:'block',marginBottom:'8px'}}>Copies (sabhi files par apply hoga)</label>
              <div className="counter">
                <button className="counter-btn" onClick={()=>setSettings({...settings,copies:Math.max(1,settings.copies-1)})}>-</button>
                <span className="counter-value">{settings.copies}</span>
                <button className="counter-btn" onClick={()=>setSettings({...settings,copies:settings.copies+1})}>+</button>
              </div>
            </div>
            <div style={{marginBottom:'18px'}}>
              <label style={{fontSize:'14px',fontWeight:'600',color:'var(--gray)',display:'block',marginBottom:'8px'}}>Paper</label>
              <div className="toggle-group">
                {['A4','Legal'].map(s=>(<button key={s} className={'toggle-btn '+(settings.paper_size===s?'active':'')} onClick={()=>setSettings({...settings,paper_size:s})}>{s}</button>))}
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

        {step >= 3 && files.length > 0 && (
          <>
            <div className="customer-card">
              <h3>💰 Step 3: Payment</h3>
              <div style={{background:'linear-gradient(135deg,#1A1A2E,#16213E)',borderRadius:'16px',padding:'25px',color:'white',textAlign:'center',marginBottom:'20px'}}>
                <div style={{fontSize:'14px',opacity:0.7}}>Total Amount ({files.length} file{files.length>1?'s':''})</div>
                <div className="total-amount">₹{totalAmount}</div>
                <div style={{fontSize:'13px',opacity:0.6}}>{totalPages} total pages x ₹{pricePerPage}</div>
              </div>
              <div className="toggle-group">
                <button className={'toggle-btn '+(paymentMethod==='cash'?'active-orange':'')} onClick={()=>{setPaymentMethod('cash');setPaidConfirmed(false)}}>💵 Cash<br/><small>Counter pe do</small></button>
                <button
                  className={'toggle-btn '+(paymentMethod==='online'?'active-green':'')}
                  onClick={()=>{
                    if (!owner.upi_id) { alert('Shop ne abhi UPI ID set nahi ki. Cash select karo.'); return }
                    setPaymentMethod('online')
                  }}
                >
                  📱 UPI<br/><small>Abhi pay karo</small>
                </button>
              </div>

              {paymentMethod === 'online' && !owner.upi_id && (
                <p style={{color:'#B23B3B',marginTop:'15px',fontWeight:'600'}}>⚠️ Shop ne UPI ID set nahi ki hai. Cash payment use karo.</p>
              )}

              {paymentMethod === 'online' && owner.upi_id && (
                <div className="payment-section" style={{marginTop:'20px'}}>
                  <h3>📱 Scan & Pay ₹{totalAmount}</h3>
                  <p style={{opacity:0.8,marginBottom:'15px',fontSize:'14px'}}>QR scan karo ya button dabao</p>
                  <div style={{background:'white',padding:'20px',borderRadius:'16px',display:'inline-block',marginBottom:'15px'}}>
                    {qrDataUrl
                      ? <img src={qrDataUrl} alt="UPI QR" width="220" height="220" />
                      : <p style={{color:'#333'}}>QR generate ho raha hai...</p>}
                  </div>
                  <p style={{fontSize:'14px',opacity:0.8}}>UPI: <strong>{owner.upi_id}</strong></p>
                  <a href={upiUrl} className="btn btn-large btn-full" style={{background:'white',color:'#764BA2',marginTop:'10px',fontWeight:'800',textDecoration:'none',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}}>
                    📱 Open UPI App & Pay ₹{totalAmount}
                  </a>

                  <label style={{display:'flex',alignItems:'center',gap:'10px',marginTop:'20px',fontSize:'14px',cursor:'pointer'}}>
                    <input type="checkbox" checked={paidConfirmed} onChange={e=>setPaidConfirmed(e.target.checked)} style={{width:'18px',height:'18px'}} />
                    ✅ Maine Payment Kar Diya Hai
                  </label>
                  <p style={{fontSize:'12px',opacity:0.6,marginTop:'8px'}}>⚠️ Payment karne ke baad checkbox tick karo, phir Submit dabao. Shop wala verify karega.</p>
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
