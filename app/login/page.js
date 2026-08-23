'use client'
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
}