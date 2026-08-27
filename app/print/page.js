'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import QRCode from 'qrcode'

export default function CustomerPrint() {
  const [owner, setOwner] = useState(null)
  const [activeTab, setActiveTab] = useState('document') 
  
  const [files, setFiles] = useState([]) 
  const [idFront, setIdFront] = useState(null)
  const [idBack, setIdBack] = useState(null)
  const [passportPhoto, setPassportPhoto] = useState(null)
  const [passportCopies, setPassportCopies] = useState("6")
  
  const [settings, setSettings] = useState({ copies: 1, color_mode: 'color', paper_size: 'A4', sides: 'single' })
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [uploading, setUploading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(null)
  const [step, setStep] = useState(1) 
  const [qrDataUrl, setQrDataUrl] = useState(null)
  const [paidConfirmed, setPaidConfirmed] = useState(false)

  useEffect(() => {
    supabase.from('owner').select('*').limit(1).single().then(({ data }) => setOwner(data))
  }, [])

  // ================= SMART IMAGE ROTATION & MERGING (CANVAS) =================
  const drawSmartImage = (ctx, img, x, y, targetW, targetH) => {
    ctx.save();
    if (img.height > img.width && targetW > targetH) {
      // Portrait image for Landscape box -> Rotate
      ctx.translate(x + targetW / 2, y + targetH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.drawImage(img, -targetH / 2, -targetW / 2, targetH, targetW);
    } else if (img.width > img.height && targetH > targetW) {
      // Landscape image for Portrait box -> Rotate
      ctx.translate(x + targetW / 2, y + targetH / 2);
      ctx.rotate(Math.PI / 2);
      ctx.drawImage(img, -targetH / 2, -targetW / 2, targetH, targetW);
    } else {
      ctx.drawImage(img, x, y, targetW, targetH);
    }
    ctx.restore();
  }

  const generateIdCanvas = (frontFile, backFile) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 2480; canvas.height = 3508; // A4 at 300dpi
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'white'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const imgF = new Image(); const imgB = new Image();
      imgF.src = URL.createObjectURL(frontFile);
      imgB.src = URL.createObjectURL(backFile);
      
      imgF.onload = () => {
        imgB.onload = () => {
          const CW = 1011, CH = 638, MARGIN = 100, HGAP = 40, VGAP = 60;
          
          // Set 1 (Top)
          drawSmartImage(ctx, imgF, MARGIN, MARGIN, CW, CH);
          drawSmartImage(ctx, imgB, MARGIN + CW + HGAP, MARGIN, CW, CH);
          
          // Set 2 (Bottom)
          let y2 = MARGIN + CH + VGAP;
          drawSmartImage(ctx, imgF, MARGIN, y2, CW, CH);
          drawSmartImage(ctx, imgB, MARGIN + CW + HGAP, y2, CW, CH);

          canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9);
        }
      }
    });
  }

  const generatePassportCanvas = (photoFile, copiesNum) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 2480; canvas.height = 3508;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'white'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const img = new Image();
      img.src = URL.createObjectURL(photoFile);
      
      img.onload = () => {
        const PW = 413, PH = 531, MARGIN = 60, GAP = 20;
        let col = 0, row = 0;
        
        for(let i=0; i<copiesNum; i++) {
          let x = MARGIN + col * (PW + GAP);
          let y = MARGIN + row * (PH + GAP);
          if (y + PH > canvas.height - MARGIN) break; // Max 30 fit on A4
          
          drawSmartImage(ctx, img, x, y, PW, PH);
          
          col++;
          if(col >= 5) { col = 0; row++; }
        }
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9);
      }
    });
  }

  // ================= FILE HANDLERS =================
  const handleNormalFiles = (e) => {
    const selected = Array.from(e.target.files || [])
    if (!selected.length) return
    const newFiles = []
    for (const f of selected) {
      if (f.size > 25 * 1024 * 1024) continue
      newFiles.push({
        file: f, name: f.name, size: f.size,
        pageCount: f.type === 'application/pdf' ? Math.max(1, Math.ceil(f.size / 80000)) : 1,
        pageRange: ''
      })
    }
    setFiles(prev => [...prev, ...newFiles]); setStep(2)
  }

  const handleAddIdCard = async () => {
    if (!idFront || !idBack) return alert('Front aur Back dono upload karein!')
    setProcessing(true)
    try {
      const mergedBlob = await generateIdCanvas(idFront, idBack);
      mergedBlob.name = 'Merged_ID_Card.jpg';
      setFiles(prev => [...prev, { file: mergedBlob, name: 'ID_Card_Print.jpg', size: mergedBlob.size, pageCount: 1, pageRange: '' }])
      setIdFront(null); setIdBack(null); setStep(2)
    } catch(e) { alert("Error generating ID Card") }
    setProcessing(false)
  }

  const handleAddPassport = async () => {
    if (!passportPhoto) return alert('Photo upload karein!')
    setProcessing(true)
    try {
      const mergedBlob = await generatePassportCanvas(passportPhoto, parseInt(passportCopies));
      mergedBlob.name = 'Merged_Passport.jpg';
      setFiles(prev => [...prev, { file: mergedBlob, name: `Passport_${passportCopies}_Copies.jpg`, size: mergedBlob.size, pageCount: 1, pageRange: '' }])
      setPassportPhoto(null); setStep(2)
    } catch(e) { alert("Error generating Passport") }
    setProcessing(false)
  }

  const removeFile = (idx) => {
    const newFiles = files.filter((_, i) => i !== idx)
    setFiles(newFiles); if (newFiles.length === 0) setStep(1)
  }

  const updateFileField = (idx, field, value) => {
    setFiles(prev => prev.map((f, i) => i === idx ? { ...f, [field]: value } : f))
  }

  // ================= CALCULATIONS =================
  const pricePerPage = settings.color_mode === 'color' ? (owner?.color_price || 10) : (owner?.bw_price || 2)
  const totalPages = files.reduce((sum, f) => sum + (f.pageCount || 0), 0) * settings.copies
  const totalAmount = totalPages * pricePerPage
  const upiUrl = owner?.upi_id ? `upi://pay?pa=${owner.upi_id}&pn=${encodeURIComponent(owner?.shop_name || 'Print')}&am=${totalAmount}&cu=INR` : null

  useEffect(() => {
    if (paymentMethod === 'online' && upiUrl && totalAmount > 0) {
      QRCode.toDataURL(upiUrl, { width: 220, margin: 1 }).then(setQrDataUrl)
    } else setQrDataUrl(null)
  }, [paymentMethod, upiUrl, totalAmount])

  const handleSubmit = async () => {
    if (!files.length) return alert('Files upload karein!')
    if (paymentMethod === 'online' && !owner?.upi_id) return alert('Shop UPI set nahi hai. Cash use karein.')
    if (paymentMethod === 'online' && !paidConfirmed) return alert('Please verify payment check box!')

    setUploading(true)
    try {
      const { data: last } = await supabase.from('orders').select('token_number').order('created_at', { ascending: false }).limit(1).single()
      const token = (last?.token_number || 0) + 1
      const rows = []

      for (const f of files) {
        const fileName = Date.now() + '_' + f.name.replace(/[^a-zA-Z0-9._-]/g, '_')
        await supabase.storage.from('prints').upload(fileName, f.file)
        const { data: { publicUrl } } = supabase.storage.from('prints').getPublicUrl(fileName)

        rows.push({
          token_number: token, file_url: publicUrl, file_name: f.name,
          file_size: (f.size / 1024).toFixed(1) + 'KB', pages: f.pageCount,
          page_range: f.pageRange || '', copies: settings.copies,
          color_mode: settings.color_mode, paper_size: settings.paper_size,
          sides: settings.sides, total_pages: f.pageCount * settings.copies,
          amount: f.pageCount * settings.copies * pricePerPage,
          payment_method: paymentMethod, order_status: 'pending',
          payment_status: paymentMethod === 'online' ? 'pending_verification' : 'pending'
        })
      }
      await supabase.from('orders').insert(rows)
      setSuccess({ token, amount: totalAmount, method: paymentMethod, count: files.length })
    } catch (e) { alert(e.message || 'Error occurred!') }
    setUploading(false)
  }

  const resetAll = () => { setSuccess(null); setFiles([]); setStep(1); setPaidConfirmed(false); setPaymentMethod('cash') }

  if (!owner) return <div style={styles.loader}>⏳ Loading Shop Data...</div>

  return (
    <div style={styles.page}>
      {processing && <div style={styles.overlay}><h2 style={{color:'white'}}>⏳ Generating Perfect Layout...</h2></div>}
      
      {success && (
        <div style={styles.overlay} onClick={resetAll}>
          <div style={styles.successModal} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '70px', marginBottom: '10px' }}>🎉</div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#101C34' }}>Order Submitted!</h2>
            <div style={styles.tokenBox}>
              <div style={{ fontSize: '14px', opacity: 0.8 }}>Your Token No.</div>
              <div style={{ fontSize: '50px', fontWeight: '900' }}>#{success.token}</div>
            </div>
            <p style={{ fontSize: '18px', fontWeight: '700', color: '#333' }}>Total: ₹{success.amount} ({success.count} files)</p>
            <p style={{ color: '#666', marginTop: '10px' }}>
              {success.method === 'cash' ? '💵 Counter pe cash do aur print le lo!' : '📱 Shop owner payment verify karke print dega!'}
            </p>
            <button style={styles.primaryBtn} onClick={resetAll}>Print More Documents</button>
          </div>
        </div>
      )}

      <div style={styles.header}>
        <h1 style={{ fontSize: '28px', fontWeight: '900', margin: 0 }}>🖨️ {owner.shop_name}</h1>
        <p style={{ opacity: 0.9, marginTop: '5px' }}>📍 {owner.address}</p>
      </div>

      <div style={styles.container}>
        <div style={styles.progressRow}>
          {[1, 2, 3].map(s => <div key={s} style={{ ...styles.progressDot, background: s <= step ? '#4F46E5' : '#D1D5DB', width: s === step ? '40px' : '12px' }} />)}
        </div>

        <div style={styles.card}>
          <div style={styles.tabHeader}>
            <div style={{ ...styles.tab, borderBottom: activeTab === 'document' ? '3px solid #4F46E5' : 'none', color: activeTab === 'document' ? '#4F46E5' : '#6B7280' }} onClick={() => setActiveTab('document')}>📄 Document</div>
            <div style={{ ...styles.tab, borderBottom: activeTab === 'idcard' ? '3px solid #7C3AED' : 'none', color: activeTab === 'idcard' ? '#7C3AED' : '#6B7280' }} onClick={() => setActiveTab('idcard')}>🪪 ID Card</div>
            <div style={{ ...styles.tab, borderBottom: activeTab === 'passport' ? '3px solid #DB2777' : 'none', color: activeTab === 'passport' ? '#DB2777' : '#6B7280' }} onClick={() => setActiveTab('passport')}>📸 Passport</div>
          </div>

          <div style={styles.tabContent}>
            {activeTab === 'document' && (
              <div>
                <h3 style={styles.title}>Upload Documents</h3>
                <p style={styles.subtitle}>PDF, DOCX, ya Photos upload karein</p>
                <label style={styles.dropzoneNormal}>
                  <div style={{ fontSize: '40px' }}>📁</div>
                  <div style={{ fontWeight: 'bold', color: '#4F46E5', marginTop: '10px' }}>Tap to Select Files</div>
                  <input type="file" multiple accept=".pdf,.jpg,.png,.doc,.docx" style={{ display: 'none' }} onChange={handleNormalFiles} />
                </label>
              </div>
            )}

            {activeTab === 'idcard' && (
              <div>
                <h3 style={styles.title}>Aadhaar / PAN Print</h3>
                <p style={styles.subtitle}>Front aur Back automatically ek page pe aayenge!</p>
                <div style={styles.grid2}>
                  <label style={styles.dropzonePurple}>
                    {idFront ? <span style={styles.fileSelected}>✅ Front Selected</span> : <div style={styles.iconTxt}>💳 Upload FRONT</div>}
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => setIdFront(e.target.files[0])} />
                  </label>
                  <label style={styles.dropzonePurple}>
                    {idBack ? <span style={styles.fileSelected}>✅ Back Selected</span> : <div style={styles.iconTxt}>💳 Upload BACK</div>}
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => setIdBack(e.target.files[0])} />
                  </label>
                </div>
                {idFront && idBack && <button style={{ ...styles.primaryBtn, background: '#7C3AED' }} onClick={handleAddIdCard}>+ Generate ID Layout</button>}
              </div>
            )}

            {activeTab === 'passport' && (
              <div>
                <h3 style={styles.title}>Passport Size Photo</h3>
                <label style={styles.dropzonePink}>
                  {passportPhoto ? <span style={styles.fileSelected}>✅ Photo Selected</span> : <div style={styles.iconTxt}>📸 Select Photo</div>}
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => setPassportPhoto(e.target.files[0])} />
                </label>
                {passportPhoto && (
                  <div style={{ marginTop: '15px' }}>
                    <label style={styles.labelBold}>Kitni Copies chahiye?</label>
                    <select value={passportCopies} onChange={e=>setPassportCopies(e.target.value)} style={styles.selectBox}>
                      {['1','2','3','4','5','6','8','10','12','15','20','25','30'].map(v => <option key={v} value={v}>{v} Photos</option>)}
                    </select>
                    <button style={{ ...styles.primaryBtn, background: '#DB2777' }} onClick={handleAddPassport}>+ Generate Passport Sheet</button>
                  </div>
                )}
              </div>
            )}
          </div>

          {files.length > 0 && (
            <div style={styles.fileListSection}>
              <h4 style={{ fontSize: '15px', color: '#374151', marginBottom: '10px' }}>Selected Files ({files.length}):</h4>
              {files.map((f, idx) => (
                <div key={idx} style={styles.fileItem}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ overflow: 'hidden' }}>
                      <p style={{ fontWeight: 'bold', margin: 0, fontSize: '14px' }}>{f.name}</p>
                      <p style={{ color: '#6B7280', fontSize: '12px', margin: 0 }}>{(f.size/1024/1024).toFixed(2)} MB</p>
                    </div>
                    <button onClick={() => removeFile(idx)} style={styles.removeBtn}>❌</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {step >= 2 && files.length > 0 && (
          <div style={styles.card}>
            <h3 style={styles.title}>⚙️ Print Settings</h3>
            <div style={styles.settingRow}>
              <label style={styles.labelBold}>Color Mode</label>
              <div style={styles.toggleGroup}>
                <button style={{ ...styles.toggleBtn, ...(settings.color_mode === 'bw' ? styles.toggleActive : {}) }} onClick={() => setSettings({ ...settings, color_mode: 'bw' })}>⬛ B/W (₹{owner.bw_price})</button>
                <button style={{ ...styles.toggleBtn, ...(settings.color_mode === 'color' ? styles.toggleActiveColor : {}) }} onClick={() => setSettings({ ...settings, color_mode: 'color' })}>🎨 Color (₹{owner.color_price})</button>
              </div>
            </div>
            <div style={styles.settingRow}>
              <label style={styles.labelBold}>Print Sets (Sabhi files ki copies)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <button style={styles.circleBtn} onClick={() => setSettings({ ...settings, copies: Math.max(1, settings.copies - 1) })}>-</button>
                <span style={{ fontSize: '20px', fontWeight: 'bold' }}>{settings.copies}</span>
                <button style={styles.circleBtn} onClick={() => setSettings({ ...settings, copies: settings.copies + 1 })}>+</button>
              </div>
            </div>
            {step === 2 && <button style={styles.primaryBtn} onClick={() => setStep(3)}>Continue to Payment ➔</button>}
          </div>
        )}

        {step >= 3 && files.length > 0 && (
          <div style={styles.card}>
            <h3 style={styles.title}>💰 Payment Summary</h3>
            <div style={styles.billBox}>
              <div style={{ fontSize: '15px', opacity: 0.9 }}>Total Amount</div>
              <div style={{ fontSize: '40px', fontWeight: '900', margin: '5px 0' }}>₹{totalAmount}</div>
              <div style={{ fontSize: '13px', opacity: 0.8 }}>{totalPages} pages × ₹{pricePerPage}</div>
            </div>
            <div style={styles.toggleGroup}>
              <button style={{ ...styles.toggleBtn, ...(paymentMethod === 'cash' ? styles.toggleActiveOrange : {}) }} onClick={() => { setPaymentMethod('cash'); setPaidConfirmed(false) }}>💵 Cash</button>
              <button style={{ ...styles.toggleBtn, ...(paymentMethod === 'online' ? styles.toggleActiveGreen : {}) }} onClick={() => { if(!owner.upi_id){alert('Shop ne UPI set nahi ki hai.'); return}; setPaymentMethod('online') }}>📱 UPI Online</button>
            </div>

            {paymentMethod === 'online' && owner.upi_id && (
              <div style={styles.qrSection}>
                <p style={{ fontWeight: 'bold' }}>Scan QR to Pay ₹{totalAmount}</p>
                <div style={styles.qrCodeBox}>{qrDataUrl ? <img src={qrDataUrl} alt="UPI QR" width="200" height="200" /> : <p>Loading QR...</p>}</div>
                <a href={upiUrl} style={styles.upiLinkBtn}>📱 Open UPI App</a>
                <label style={styles.checkboxWrap}>
                  <input type="checkbox" checked={paidConfirmed} onChange={e => setPaidConfirmed(e.target.checked)} style={{ transform: 'scale(1.3)' }} />
                  <span style={{ fontWeight: 'bold', color: '#10B981' }}>Maine Pay Kar Diya Hai</span>
                </label>
              </div>
            )}
            <button style={styles.submitBtn} onClick={handleSubmit} disabled={uploading}>{uploading ? '⏳ Uploading...' : `🖨️ Submit Print Order`}</button>
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)', paddingBottom: '50px', fontFamily: 'system-ui, sans-serif' },
  loader: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#4F46E5', color: 'white', fontSize: '20px', fontWeight: 'bold' },
  header: { background: '#4F46E5', color: 'white', padding: '40px 20px', textAlign: 'center', borderBottomLeftRadius: '30px', borderBottomRightRadius: '30px' },
  container: { maxWidth: '600px', margin: '0 auto', padding: '0 20px', marginTop: '-20px' },
  progressRow: { display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px' },
  progressDot: { height: '8px', borderRadius: '4px', transition: 'all 0.3s' },
  card: { background: 'white', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', overflow: 'hidden', marginBottom: '25px', padding: '25px' },
  tabHeader: { display: 'flex', background: '#F3F4F6', margin: '-25px -25px 25px -25px', borderBottom: '1px solid #E5E7EB' },
  tab: { flex: 1, textAlign: 'center', padding: '15px 0', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s' },
  title: { fontSize: '20px', fontWeight: '800', color: '#111827', margin: '0 0 5px 0' },
  subtitle: { fontSize: '13px', color: '#6B7280', margin: '0 0 20px 0' },
  dropzoneNormal: { border: '2px dashed #818CF8', background: '#EEF2FF', borderRadius: '15px', padding: '40px 20px', textAlign: 'center', display: 'block', cursor: 'pointer' },
  dropzonePurple: { border: '2px dashed #A78BFA', background: '#F5F3FF', borderRadius: '15px', padding: '20px 10px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  dropzonePink: { border: '2px dashed #F472B6', background: '#FDF2F8', borderRadius: '15px', padding: '30px 20px', textAlign: 'center', display: 'block', cursor: 'pointer' },
  iconTxt: { color: '#4B5563', fontWeight: 'bold', fontSize: '14px' },
  fileSelected: { color: '#10B981', fontWeight: 'bold', fontSize: '14px' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' },
  primaryBtn: { width: '100%', padding: '16px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '15px' },
  submitBtn: { width: '100%', padding: '18px', background: '#111827', color: 'white', border: 'none', borderRadius: '12px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', marginTop: '25px' },
  fileListSection: { marginTop: '25px', borderTop: '1px solid #E5E7EB', paddingTop: '15px' },
  fileItem: { background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '12px', marginBottom: '10px' },
  removeBtn: { background: '#FEE2E2', color: '#EF4444', border: 'none', borderRadius: '8px', width: '30px', height: '30px', cursor: 'pointer' },
  settingRow: { marginBottom: '20px' },
  labelBold: { fontSize: '14px', fontWeight: 'bold', color: '#374151', display: 'block', marginBottom: '10px' },
  toggleGroup: { display: 'flex', gap: '10px' },
  toggleBtn: { flex: 1, padding: '12px', background: '#F3F4F6', border: '2px solid transparent', borderRadius: '12px', fontSize: '14px', fontWeight: 'bold', color: '#4B5563', cursor: 'pointer' },
  toggleActive: { background: '#EEF2FF', border: '2px solid #6366F1', color: '#4F46E5' },
  toggleActiveColor: { background: '#FFF1F2', border: '2px solid #E11D48', color: '#E11D48' },
  toggleActiveOrange: { background: '#FFF7ED', border: '2px solid #EA580C', color: '#EA580C' },
  toggleActiveGreen: { background: '#ECFDF5', border: '2px solid #10B981', color: '#10B981' },
  circleBtn: { width: '40px', height: '40px', borderRadius: '20px', background: '#F3F4F6', border: 'none', fontSize: '20px', fontWeight: 'bold', cursor: 'pointer' },
  selectBox: { width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '10px', fontSize: '14px', fontWeight: 'bold', marginBottom:'10px' },
  billBox: { background: 'linear-gradient(135deg, #111827 0%, #374151 100%)', color: 'white', padding: '25px', borderRadius: '15px', textAlign: 'center', marginBottom: '25px' },
  qrSection: { background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '15px', padding: '20px', textAlign: 'center', marginTop: '20px' },
  qrCodeBox: { background: 'white', padding: '15px', borderRadius: '12px', display: 'inline-block', margin: '15px 0' },
  upiLinkBtn: { display: 'block', background: 'white', color: '#4F46E5', padding: '12px', borderRadius: '10px', fontWeight: 'bold', textDecoration: 'none', border: '1px solid #E5E7EB', margin: '10px 0 20px 0' },
  checkboxWrap: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: '#ECFDF5', padding: '15px', borderRadius: '10px', border: '1px solid #A7F3D0', cursor: 'pointer' },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  successModal: { background: 'white', padding: '40px 30px', borderRadius: '25px', textAlign: 'center', maxWidth: '400px', width: '100%' },
  tokenBox: { background: '#EEF2FF', border: '2px dashed #818CF8', color: '#4F46E5', padding: '20px', borderRadius: '15px', margin: '20px 0' }
}
