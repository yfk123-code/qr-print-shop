'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import QRCode from 'qrcode'

export default function CustomerPrint() {
  const [owner, setOwner] = useState(null)
  
  // UI Tabs State
  const [activeTab, setActiveTab] = useState('document')
  
  // File States - ID Card ab SINGLE object hoga with BOTH images
  const [files, setFiles] = useState([]) 
  const [idFront, setIdFront] = useState(null)
  const [idBack, setIdBack] = useState(null)
  const [passportPhoto, setPassportPhoto] = useState(null)
  const [passportCopies, setPassportCopies] = useState('6') // NAYA OPTION

  // Settings & Payment
  const [settings, setSettings] = useState({ copies: 1, color_mode: 'color', paper_size: 'A4', sides: 'single' })
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(null)
  const [step, setStep] = useState(1)
  const [qrDataUrl, setQrDataUrl] = useState(null)
  const [paidConfirmed, setPaidConfirmed] = useState(false)

  useEffect(() => {
    supabase.from('owner').select('*').limit(1).single().then(({ data }) => setOwner(data))
  }, [])

  // ==================== FILE HANDLERS ====================
  const handleNormalFiles = (e) => {
    const selected = Array.from(e.target.files || [])
    if (!selected.length) return
    const newFiles = []
    for (const f of selected) {
      if (f.size > 25 * 1024 * 1024) {
        alert(`${f.name} 25MB se badi hai!`)
        continue
      }
      newFiles.push({
        type: 'document',
        file: f, name: f.name, size: f.size,
        pageCount: f.type === 'application/pdf' ? Math.max(1, Math.ceil(f.size / 80000)) : 1,
        pageRange: ''
      })
    }
    setFiles(prev => [...prev, ...newFiles])
    setStep(2)
    e.target.value = null
  }

  // ID CARD AB EK HI FILE BHEJEGA with SPECIAL TYPE
  const handleAddIdCard = () => {
    if (!idFront || !idBack) return alert('Please Aadhaar/PAN ka Front aur Back DONO upload karein!')
    
    // EK object banao jo dono contain kare
    const idCardEntry = {
      type: 'idcard_single', // YE IMPORTANT HAI - Admin panel ye dekhenge
      name: 'ID_CARD_AADHAAR_PAN', 
      size: idFront.size + idBack.size,
      pageCount: 1, // Single page maanke chalayenge admin
      frontFile: idFront,
      backFile: idBack,
      passportMode: false,
      idCopies: 1
    }
    
    setFiles(prev => [...prev, idCardEntry])
    setIdFront(null); setIdBack(null);
    setStep(2)
  }

  const handleAddPassport = () => {
    if (!passportPhoto) return alert('Please Passport photo upload karein!')
    
    const passportEntry = {
      type: 'passport_photo', // Passport type
      file: passportPhoto,
      name: 'PASSPORT_' + passportPhoto.name,
      size: passportPhoto.size,
      pageCount: parseInt(passportCopies), // Itni photos print karni hain
      passportCount: parseInt(passportCopies),
      pageRange: ''
    }
    
    setFiles(prev => [...prev, passportEntry])
    setPassportPhoto(null)
    setStep(2)
  }

  const removeFile = (idx) => {
    const newFiles = files.filter((_, i) => i !== idx)
    setFiles(newFiles)
    if (newFiles.length === 0) setStep(1)
  }

  const updateFileField = (idx, field, value) => {
    setFiles(prev => prev.map((f, i) => i === idx ? { ...f, [field]: value } : f))
  }

  // ==================== CALCULATION ====================
  const pricePerPage = settings.color_mode === 'color' ? (owner?.color_price || 10) : (owner?.bw_price || 2)
  
  const totalPrice = () => {
    let total = 0
    files.forEach(f => {
      if (f.type === 'idcard_single') {
        total += pricePerPage * f.idCopies * 2 // Front+Back dono ke liye
      } else if (f.type === 'passport_photo') {
        total += pricePerPage * f.passportCount // Photo count ke hisaab
      } else {
        total += (f.pageCount || 0) * pricePerPage * settings.copies
      }
    })
    return total
  }
  
  const totalAmount = totalPrice()

  const upiUrl = owner?.upi_id
    ? 'upi://pay?pa=' + owner.upi_id + '&pn=' + encodeURIComponent(owner?.shop_name || 'Print Shop') + '&am=' + totalAmount + '&cu=INR&tn=SmartPrint'
    : null

  useEffect(() => {
    if (paymentMethod === 'online' && upiUrl && totalAmount > 0) {
      QRCode.toDataURL(upiUrl, { width: 220, margin: 1 }).then(setQrDataUrl).catch(() => setQrDataUrl(null))
    } else {
      setQrDataUrl(null)
    }
  }, [paymentMethod, upiUrl, totalAmount])

  // ==================== SUBMIT ORDER ====================
  const handleSubmit = async () => {
    if (!files.length) return alert('Pehle files upload karein!')
    if (totalAmount <= 0) return alert('Amount calculate nahi hua!')
    if (paymentMethod === 'online' && !owner?.upi_id) return alert('Shop ne UPI ID set nahi ki hai.')
    if (paymentMethod === 'online' && !paidConfirmed) return alert('Payment verify check box tick karein!')

    setUploading(true)
    try {
      const { data: last } = await supabase.from('orders').select('token_number').order('created_at', { ascending: false }).limit(1).single()
      const token = (last?.token_number || 0) + 1
      const rows = []

      for (const f of files) {
        
        // ✅ CASE 1: ID CARD (FRONT+BACK COMBINED)
        if (f.type === 'idcard_single') {
          const fname_front = Date.now() + '_ID_FRONT.' + f.frontFile.name.split('.').pop()
          const fname_back = Date.now() + '_ID_BACK.' + f.backFile.name.split('.').pop()
          
          await supabase.storage.from('prints').upload(fname_front, f.frontFile)
          await supabase.storage.from('prints').upload(fname_back, f.backFile)
          
          const url_f = supabase.storage.from('prints').getPublicUrl(fname_front).data.publicUrl
          const url_b = supabase.storage.from('prints').getPublicUrl(fname_back).data.publicUrl
          
          rows.push({
            token_number: token,
            file_url: url_f, // Main URL front wali le lo
            secondary_file_url: url_b, // BACK URL yahan hai
            file_name: '[ID CARD] Front+Back',
            file_size: ((f.size/1024)).toFixed(1)+'KB',
            pages: 1, page_range: '',
            copies: f.idCopies || 1,
            color_mode: settings.color_mode,
            paper_size: settings.paper_size,
            sides: settings.sides,
            total_pages: 2, // Front+Back=2 sides essentially
            amount: pricePerPage * f.idCopies * 2,
            payment_method: paymentMethod,
            payment_status: paymentMethod==='online'?'pending_verification':'pending',
            order_status: 'pending',
            is_id_card: true, // ⭐ YE FLAG PYTHON ADMIN KO BATAYEGI KI YEH ID CARD HAI
            is_passport: false
          })
        } 
        
        // ✅ CASE 2: PASSPORT PHOTO
        else if (f.type === 'passport_photo') {
          const fname = Date.now() + '_PASSPORT.' + f.file.name.split('.').pop()
          await supabase.storage.from('prints').upload(fname, f.file)
          const url = supabase.storage.from('prints').getPublicUrl(fname).data.publicUrl
          
          rows.push({
            token_number: token,
            file_url: url,
            file_name: `[PASSPORT x${f.passportCount}] ${f.name}`,
            file_size: ((f.size/1024)).toFixed(1)+'KB',
            pages: 1, page_range: '',
            copies: f.passportCount, // ITNI COPIES
            color_mode: settings.color_mode,
            paper_size: settings.paper_size,
            sides: settings.sides,
            total_pages: f.passportCount,
            amount: pricePerPage * f.passportCount,
            payment_method: paymentMethod,
            payment_status: paymentMethod==='online'?'pending_verification':'pending',
            order_status: 'pending',
            is_id_card: false,
            is_passport: true, // ⭐ YE FLAG PYTHON KO BATAYEGI PASSPORT HAI
            passport_copies: f.passportCount
          })
        }
        
        // ✅ CASE 3: NORMAL DOCUMENT
        else {
          const fileName = Date.now() + '_' + f.name.replace(/[^a-zA-Z0-9._-]/g, '_')
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
            payment_status: paymentMethod==='online'?'pending_verification':'pending',
            order_status: 'pending',
            is_id_card: false,
            is_passport: false
          })
        }
      }

      const { error: oe } = await supabase.from('orders').insert(rows)
      if (oe) throw new Error('Order failed!')

      setSuccess({ token, amount: totalAmount, method: paymentMethod, count: files.length })
    } catch (e) {
      alert(e.message || 'Error occurred!')
    }
    setUploading(false)
  }

  const resetAll = () => {
    setSuccess(null); setFiles([]); setStep(1); setPaidConfirmed(false); setPaymentMethod('cash')
  }

  if (!owner) return <div style={styles.loader}>⏳ Loading...</div>

  return (
    <div style={styles.page}>
      
      {/* SUCCESS MODAL */}
      {success && (
        <div style={styles.overlay} onClick={resetAll}>
          <div style={styles.successModal} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '70px', marginBottom: '10px' }}>🎉</div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#101C34' }}>Order Submitted!</h2>
            <div style={styles.tokenBox}>
              <div style={{ fontSize: '14px', opacity: 0.8 }}>Your Token No.</div>
              <div style={{ fontSize: '50px', fontWeight: '900' }}>#{success.token}</div>
            </div>
            <p style={{ fontSize: '18px', fontWeight: '700', color: '#333' }}>Total: ₹{success.amount}</p>
            <button style={styles.primaryBtn} onClick={resetAll}>✅ New Order</button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div style={styles.header}>
        <h1 style={{ fontSize: '28px', fontWeight: '900', margin: 0 }}>🖨️ {owner.shop_name}</h1>
        <p style={{ opacity: 0.9, marginTop: '5px' }}>📍 {owner.address || 'Smart Print System'}</p>
      </div>

      <div style={styles.container}>
        
        <div style={styles.progressRow}>
          {[1,2,3].map(s => (
            <div key={s} style={{ ...styles.progressDot, background: s<=step ? '#4F46E5' : '#D1D5DB', width: s===step?'40px':'12px' }} />
          ))}
        </div>

        <div style={styles.card}>
          <div style={styles.tabHeader}>
            <div style={{ ...styles.tab, borderBottom: activeTab==='document'?'3px solid #4F46E5':'none', color: activeTab==='document'?'#4F46E5':'#6B7280' }} onClick={()=>setActiveTab('document')}>📄 Document</div>
            <div style={{ ...styles.tab, borderBottom: activeTab==='idcard'?'3px solid #7C3AED':'none', color: activeTab==='idcard'?'#7C3AED':'#6B7280' }} onClick={()=>setActiveTab('idcard')}>🪪 ID Card</div>
            <div style={{ ...styles.tab, borderBottom: activeTab==='passport'?'3px solid #DB2777':'none', color: activeTab==='passport'?'#DB2777':'#6B7280' }} onClick={()=>setActiveTab('passport')}>📸 Passport</div>
          </div>

          <div style={styles.tabContent}>
            
            {/* DOCUMENT TAB */}
            {activeTab === 'document' && (
              <div>
                <h3 style={styles.title}>Upload Documents</h3>
                <p style={styles.subtitle}>PDF, Word ya Images upload karein</p>
                <label style={styles.dropzoneNormal}>
                  <div style={{ fontSize: '35px' }}>📁</div>
                  <div style={{ fontWeight: 'bold', color: '#4F46E5', marginTop: '8px' }}>Tap to Select Files</div>
                  <input type="file" multiple accept=".pdf,.jpg,.png,.doc" style={{ display:'none' }} onChange={handleNormalFiles} />
                </label>
              </div>
            )}

            {/* ID CARD TAB */}
            {activeTab === 'idcard' && (
              <div>
                <h3 style={styles.title}>Aadhaar / PAN Print</h3>
                <p style={styles.subtitle}>Dono side ek saath Ek Page pe print hogi! 🔄</p>
                <div style={styles.grid2}>
                  <label style={styles.dropzonePurple}>
                    {idFront ? (
                      <span style={styles.fileSelected}>✅ Front Done</span>
                    ) : (<div style={styles.iconTxt}>💳<br/><small>Upload FRONT</small></div>)}
                    <input type="file" accept="image/*" style={{ display:'none' }} onChange={(e)=>setIdFront(e.target.files[0])} />
                  </label>
                  <label style={styles.dropzonePurple}>
                    {idBack ? (
                      <span style={styles.fileSelected}>✅ Back Done</span>
                    ) : (<div style={styles.iconTxt}>💳<br/><small>Upload BACK</small></div>)}
                    <input type="file" accept="image/*" style={{ display:'none' }} onChange={(e)=>setIdBack(e.target.files[0])} />
                  </label>
                </div>
                {idFront && idBack && (
                  <button style={{ ...styles.primaryBtn, background: '#7C3AED', marginTop:'15px' }} onClick={handleAddIdCard}>
                    ✓ Confirm ID Card (Single Page Print)
                  </button>
                )}
              </div>
            )}

            {/* PASSPORT TAB WITH COPY OPTIONS */}
            {activeTab === 'passport' && (
              <div>
                <h3 style={styles.title}>Passport Size Photo</h3>
                <p style={styles.subtitle}>Ek page pe kitne photos chahiye?</p>
                <label style={styles.dropzonePink}>
                  {passportPhoto ? (
                    <span style={styles.fileSelected}>✅ Photo Selected</span>
                  ) : (<div style={styles.iconTxt}>📸<br/>Select Photo</div>)}
                  <input type="file" accept="image/*" style={{ display:'none' }} onChange={(e)=>setPassportPhoto(e.target.files[0])} />
                </label>

                {passportPhoto && (
                  <div style={{ background:'#FDF2F8', padding:'15px', borderRadius:'12px', marginTop:'15px' }}>
                    <label style={{ display:'block', fontSize:'14px', fontWeight:'bold', color:'#BE185D', marginBottom:'8px' }}>
                      🖼️ Kitne Copies Per Page? (Total Photos on A4):
                    </label>
                    <select value={passportCopies} onChange={(e)=>setPassportCopies(e.target.value)} style={{ width:'100%', padding:'12px', border:'2px dashed #F9A8D4', borderRadius:'10px', fontSize:'16px', fontWeight:'bold', color:'#9D174D', background:'white', cursor:'pointer', outline:'none' }}>
                      <option value="1">1 Photo</option>
                      <option value="2">2 Photos</option>
                      <option value="4">4 Photos (Standard)</option>
                      <option value="6">6 Photos (Standard)</option>
                      <option value="8">8 Photos</option>
                      <option value="10">10 Photos</option>
                      <option value="15">15 Photos</option>
                      <option value="20">20 Photos</option>
                      <option value="30">30 Photos</option>
                      <option value="40">40 Photos</option>
                      <option value="50">50 Photos</option>
                    </select>
                    <button style={{ ...styles.primaryBtn, background:'#DB2777', marginTop:'12px', width:'100%' }} onClick={handleAddPassport}>
                      ✓ Add Passport Job ({passportCopies} Photos/Page)
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* FILE LIST */}
          {files.length > 0 && (
            <div style={{ borderTop:'1px solid #E5E7EB', paddingTop:'15px', marginTop:'15px' }}>
              <h4 style={{ fontSize:'14px', color:'#374151', marginBottom:'10px' }}>Selected Items ({files.length}):</h4>
              {files.map((f, idx) => (
                <div key={idx} style={{ background:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:'12px', padding:'12px', marginBottom:'8px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ overflow:'hidden' }}>
                    <p style={{ fontWeight:'bold', margin:0, fontSize:'14px', whiteSpace:'nowrap', textOverflow:'ellipsis', maxWidth:'300px' }}>
                      {f.type === 'idcard_single' ? '🪪 [ID CARD] Front + Back (Single Page)' : 
                       f.type === 'passport_photo' ? `📸 [PASSPORT] x${f.passportCount} copies` : 
                       `📄 ${f.name}`}
                    </p>
                    <p style={{ color:'#6B7280', fontSize:'11px', margin:0 }}>{((f.size||0)/1024/1024).toFixed(2)} MB</p>
                  </div>
                  <button onClick={()=>removeFile(idx)} style={{ background:'#FEE2E2', color:'#EF4444', border:'none', borderRadius:'6px', padding:'4px 8px', cursor:'pointer', fontSize:'12px', fontWeight:'bold' }}>Remove</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* STEP 2: SETTINGS */}
        {step >= 2 && files.length > 0 && (
          <div style={styles.card}>
            <h3 style={styles.title}>⚙️ Print Settings</h3>
            
            <div style={{ marginBottom:'18px' }}>
              <label style={{ ...styles.labelBold, marginBottom:'8px', display:'block' }}>Color Mode</label>
              <div style={{ ...styles.toggleGroup, gap:'8px' }}>
                <button style={{ ...styles.toggleBtn, ...(settings.color_mode==='bw'?{background:'#EEF2FF', borderColor:'#6366F1', color:'#4F46E5'}:{}) }} onClick={()=>setSettings({...settings,color_mode:'bw'})}>⬛ B/W (₹{owner.bw_price})</button>
                <button style={{ ...styles.toggleBtn, ...(settings.color_mode==='color'?{background:'#FFF1F2', borderColor:'#E11D48', color:'#E11D48'}:{}) }} onClick={()=>setSettings({...settings,color_mode:'color'})}>🎨 Color (₹{owner.color_price})</button>
              </div>
            </div>

            <div style={{ marginBottom:'18px' }}>
              <label style={{ ...styles.labelBold, marginBottom:'8px', display:'block' }}>Paper & Sides</label>
              <div style={{ display:'flex', gap:'10px' }}>
                <select value={settings.paper_size} onChange={e=>setSettings({...settings,paper_size:e.target.value})} style={styles.selectBox}>
                  <option value="A4">A4</option><option value="Legal">Legal</option>
                </select>
                <select value={settings.sides} onChange={e=>setSettings({...settings,sides:e.target.value})} style={styles.selectBox}>
                  <option value="single">Single Side</option><option value="double">Double Side</option>
                </select>
              </div>
            </div>

            {step === 2 && <button style={styles.primaryBtn} onClick={()=>setStep(3)}>Continue to Payment ➔</button>}
          </div>
        )}

        {/* STEP 3: PAYMENT */}
        {step >= 3 && files.length > 0 && (
          <div style={styles.card}>
            <h3 style={styles.title}>💰 Summary & Pay</h3>
            
            <div style={{ background:'linear-gradient(135deg,#111827 0%,#374151 100%)', color:'white', padding:'25px', borderRadius:'16px', textAlign:'center', marginBottom:'20px' }}>
              <div style={{ fontSize:'14px', opacity:0.8 }}>Total Amount To Pay</div>
              <div style={{ fontSize:'42px', fontWeight:'900', letterSpacing:'-1px' }}>₹{totalAmount}</div>
              <div style={{ fontSize:'13px', opacity:0.6, marginTop:'5px' }}>{files.length} Item(s)</div>
            </div>

            <div style={styles.toggleGroup}>
              <button style={{ ...styles.toggleBtn, ...(paymentMethod==='cash'?{background:'#FFF7ED', borderColor:'#EA580C', color:'#EA580C'}:{}) }} onClick={()=>{setPaymentMethod('cash');setPaidConfirmed(false)}}>💵 Cash</button>
              <button style={{ ...styles.toggleBtn, ...(paymentMethod==='online'?{background:'#ECFDF5', borderColor:'#059669', color:'#059669'}:{}) }} onClick={()=>{ if(!owner.upi_id){alert('UPI not available');return}; setPaymentMethod('online') }}>📱 UPI Online</button>
            </div>

            {paymentMethod === 'online' && owner.upi_id && (
              <div style={{ background:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:'16px', padding:'20px', textAlign:'center', marginTop:'20px' }}>
                <p style={{ fontWeight:'bold', color:'#374151', marginBottom:'10px' }}>Scan QR or Tap Button</p>
                <div style={{ background:'white', padding:'15px', borderRadius:'12px', display:'inline-block', boxShadow:'0 4px 10px rgba(0,0,0,0.05)', marginBottom:'15px' }}>
                  {qrDataUrl ? <img src={qrDataUrl} alt="UPI QR" width="180" height="180" /> : <p>Loading...</p>}
                </div>
                <a href={upiUrl} style={{ display:'inline-block', background:'white', color:'#4F46E5', padding:'12px 24px', borderRadius:'10px', fontWeight:'bold', textDecoration:'none', border:'1px solid #E5E7EB' }}>Open UPI App</a>
                
                <label style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', marginTop:'20px', background:'#ECFDF5', padding:'15px', borderRadius:'10px', cursor:'pointer', border:'1px solid #A7F3D0' }}>
                  <input type="checkbox" checked={paidConfirmed} onChange={e=>setPaidConfirmed(e.target.checked)} style={{ transform:'scale(1.4)' }} />
                  <span style={{ fontWeight:'bold', color:'#047857' }}>✅ I have Paid Successfully</span>
                </label>
              </div>
            )}

            <button style={styles.submitBtn} onClick={handleSubmit} disabled={uploading} style={{...styles.submitBtn, background: uploading?'#9CA3AF':'#111827' }}>
              {uploading ? '⏳ Processing...' : `Submit Order - ₹${totalAmount}`}
            </button>
          </div>
        )}
        
        <p style={{ textAlign:'center', color:'#9CA3AF', fontSize:'12px', marginTop:'20px' }}>Powered by Smart Print System ❤️</p>
      </div>
    </div>
  )
}

// STYLES OBJECT
const styles = {
  page: { minHeight:'100vh', background:'#F3F4F6', paddingBottom:'50px', fontFamily:'system-ui,-apple-system,sans-serif' },
  loader: { display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#4F46E5', color:'white', fontSize:'16px' },
  header: { background:'#ffffff', padding:'30px 20px', textAlign:'center', borderBottom:'1px solid #E5E7EB' },
  container: { maxWidth:'600px', margin:'0 auto', padding:'0 16px' },
  progressRow: { display:'flex', justifyContent:'center', gap:'8px', marginBottom:'24px' },
  progressDot: { height:'8px', borderRadius:'4px', transition:'all 0.3s' },
  card: { background:'white', borderRadius:'20px', boxShadow:'0 4px 20px rgba(0,0,0,0.03)', overflow:'hidden', marginBottom:'20px' },
  tabHeader: { display:'flex', background:'#F9FAFB', borderBottom:'1px solid #F3F4F6' },
  tab: { flex:1, textAlign:'center', padding:'14px 0', fontWeight:'700', fontSize:'14px', cursor:'pointer', transition:'all 0.2s', color:'#6B7280' },
  title: { fontSize:'18px', fontWeight:'800', color:'#111827', margin:'0 0 4px 0' },
  subtitle: { fontSize:'13px', color:'#6B7280', margin:'0 0 20px 0' },
  dropzoneNormal: { border:'2px dashed #CBD5E1', background:'#F8FAFC', borderRadius:'16px', padding:'35px 20px', textAlign:'center', display:'block', cursor:'pointer', transition:'0.2s' },
  dropzonePurple: { border:'2px dashed #C4B5FD', background:'#F5F3FF', borderRadius:'14px', padding:'25px 10px', textAlign:'center', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' },
  dropzonePink: { border:'2px dashed #F472B6', background:'#FFF1F2', borderRadius:'16px', padding:'35px 20px', textAlign:'center', display:'block', cursor:'pointer' },
  iconTxt: { color:'#6366F1', fontWeight:'bold', fontSize:'13px', lineHeight:'1.4' },
  fileSelected: { color:'#059669', fontWeight:'bold', fontSize:'16px' },
  grid2: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'12px' },
  primaryBtn: { width:'100%', padding:'14px', background:'#4F46E5', color:'white', border:'none', borderRadius:'12px', fontSize:'15px', fontWeight:'700', cursor:'pointer', transition:'0.2s' },
  submitBtn: { width:'100%', padding:'16px', background:'#111827', color:'white', border:'none', borderRadius='12px', fontSize:'16px', fontWeight:'800', cursor:'pointer', marginTop:'20px', boxShadow:'0 4px 15px rgba(17,24,39,0.2)' },
  toggleGroup: { display:'flex', gap:'8px' },
  toggleBtn: { flex:1, padding:'11px', background:'white', border:'2px solid #E5E7EB', borderRadius:'12px', fontSize:'14px', fontWeight:'600', cursor:'pointer', transition:'0.2s' },
  selectBox: { flex:1, padding:'11px', border:'1px solid #D1D5DB', borderRadius:'10px', fontSize:'14px', fontWeight:'500', color:'#374151', background:'white', outline:'none' },
  labelBold: { fontSize:'13px', fontWeight:'600', color:'#374151', display:'block', marginBottom:'8px' },
  overlay: { position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:999, padding:'20px' },
  successModal: { background:'white', padding:'40px 30px', borderRadius:'24px', textAlign:'center', maxWidth:'380px', width:'100%', boxShadow:'0 25px 50px rgba(0,0,0,0.15)' },
  tokenBox: { background:'#EFF6FF', border:'2px dashed #60A5FA', color:'#0070F3', padding:'20px', borderRadius:'14px', margin:'20px 0' }
};
