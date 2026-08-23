'use client'
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
}