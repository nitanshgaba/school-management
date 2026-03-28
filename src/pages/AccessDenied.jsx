// src/pages/AccessDenied.jsx
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AccessDenied() {
  const { profile } = useAuth()
  const navigate = useNavigate()

  const goHome = () => {
    if (profile?.role === 'admin') navigate('/admin/dashboard')
    else if (profile?.role === 'teacher') navigate('/teacher/dashboard')
    else if (profile?.role === 'student') navigate('/student/dashboard')
    else navigate('/login')
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100vh', background:'#f1f5f9', fontFamily:'inherit' }}>
      <div style={{ background:'#fff', borderRadius:'16px', padding:'48px', textAlign:'center', boxShadow:'0 4px 20px rgba(0,0,0,0.08)', maxWidth:'420px', width:'90%' }}>
        <div style={{ fontSize:'64px', marginBottom:'16px' }}>🚫</div>
        <h1 style={{ margin:'0 0 8px', fontSize:'28px', fontWeight:'800', color:'#1e293b' }}>Access Denied</h1>
        <p style={{ margin:'0 0 8px', fontSize:'15px', color:'#64748b' }}>
          You don't have permission to view this page.
        </p>
        <p style={{ margin:'0 0 28px', fontSize:'13px', color:'#94a3b8' }}>
          Logged in as: <strong style={{ color:'#6366f1', textTransform:'capitalize' }}>{profile?.role || 'Unknown'}</strong>
        </p>
        <button onClick={goHome} style={{ padding:'12px 28px', background:'#6366f1', color:'#fff', border:'none', borderRadius:'8px', fontSize:'15px', fontWeight:'700', cursor:'pointer' }}>
          Go to My Dashboard
        </button>
      </div>
    </div>
  )
}
