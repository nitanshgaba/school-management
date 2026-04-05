// import { useState } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { useAuth } from '../context/AuthContext'

// export default function Login() {
//   const { login } = useAuth()
//   const navigate = useNavigate()
//   const [uid, setUid] = useState('')
//   const [password, setPassword] = useState('')
//   const [error, setError] = useState('')
//   const [loading, setLoading] = useState(false)

//   const handleLogin = async (e) => {
//     e.preventDefault()
//     setError('')
//     setLoading(true)

//     const { data, error } = await login(uid.trim(), password)

//     if (error) {
//       setError(error.message)
//       setLoading(false)
//       return
//     }

//     // Role-based redirect handled by App.jsx RoleRedirect
//     navigate('/')
//   }

//   return (
//     <div style={styles.container}>
//       <div style={styles.card}>
//         {/* Logo */}
//         <div style={styles.logoArea}>
//           <div style={styles.logoIcon}>🏫</div>
//           <h1 style={styles.logoText}>ERP</h1>
//           <p style={styles.subtitle}>School Management System</p>
//         </div>

//         {/* Form */}
//         <form onSubmit={handleLogin} style={styles.form}>
//           <div style={styles.inputGroup}>
//             <label style={styles.label}>User ID</label>
//             <input
//               style={styles.input}
//               type="text"
//               placeholder="e.g. A9876543210"
//               value={uid}
//               onChange={(e) => setUid(e.target.value)}
//               required
//             />
//           </div>

//           <div style={styles.inputGroup}>
//             <label style={styles.label}>Password</label>
//             <input
//               style={styles.input}
//               type="password"
//               placeholder="Enter your password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               required
//             />
//           </div>

//           {error && <p style={styles.error}>{error}</p>}

//           <button style={styles.button} type="submit" disabled={loading}>
//             {loading ? 'Signing in...' : 'Sign In'}
//           </button>
//         </form>

//         <p style={styles.hint}>
//           Use your Admin / Teacher / Student ID to login
//         </p>
//       </div>
//     </div>
//   )
// }

// const styles = {
//   container: {
//     minHeight: '100vh',
//     backgroundColor: '#f3f4f6',
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'center',
//     fontFamily: 'Inter, sans-serif',
//   },
//   card: {
//     backgroundColor: '#fff',
//     borderRadius: '16px',
//     padding: '40px',
//     width: '100%',
//     maxWidth: '400px',
//     boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
//   },
//   logoArea: {
//     textAlign: 'center',
//     marginBottom: '32px',
//   },
//   logoIcon: {
//     fontSize: '48px',
//     marginBottom: '8px',
//   },
//   logoText: {
//     fontSize: '28px',
//     fontWeight: '800',
//     color: '#1a1a2e',
//     margin: '0',
//   },
//   subtitle: {
//     color: '#6b7280',
//     fontSize: '14px',
//     marginTop: '4px',
//   },
//   form: {
//     display: 'flex',
//     flexDirection: 'column',
//     gap: '16px',
//   },
//   inputGroup: {
//     display: 'flex',
//     flexDirection: 'column',
//     gap: '6px',
//   },
//   label: {
//     fontSize: '14px',
//     fontWeight: '600',
//     color: '#374151',
//   },
//   input: {
//     padding: '12px 14px',
//     borderRadius: '8px',
//     border: '1px solid #d1d5db',
//     fontSize: '14px',
//     outline: 'none',
//     transition: 'border 0.2s',
//   },
//   error: {
//     color: '#ef4444',
//     fontSize: '13px',
//     margin: '0',
//   },
//   button: {
//     padding: '12px',
//     backgroundColor: '#4f46e5',
//     color: '#fff',
//     border: 'none',
//     borderRadius: '8px',
//     fontSize: '15px',
//     fontWeight: '600',
//     cursor: 'pointer',
//     marginTop: '4px',
//   },
//   hint: {
//     textAlign: 'center',
//     color: '#9ca3af',
//     fontSize: '12px',
//     marginTop: '20px',
//   },
// }

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getSchoolSettings } from '../lib/schoolSettings'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [uid, setUid] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [schoolInfo, setSchoolInfo] = useState({ name: 'School ERP', logo: '', tagline: '' })

  useEffect(() => {
    fetchBranding()
  }, [])

  const fetchBranding = async () => {
    try {
      const data = await getSchoolSettings()
      if (data) {
        setSchoolInfo({
          name: data.school_name || 'Academic Portal',
          logo: data.logo_url || '',
          tagline: data.tagline || 'Empowering the leaders of tomorrow.'
        })
      }
    } catch (err) { console.error("Branding load failed", err) }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: loginErr } = await login(uid.trim(), password)

    if (loginErr) {
      setError(loginErr.message)
      setLoading(false)
      return
    }
    navigate('/')
  }

  return (
    <div style={styles.pageWrapper}>
      {/* Left Panel: The Branding/Legacy Side */}
      <div style={styles.leftPanel}>
        <div style={styles.overlay} />
        <div style={styles.brandingContent}>
          {schoolInfo.logo ? (
            <img src={schoolInfo.logo} alt="Logo" style={styles.mainLogo} />
          ) : (
            <div style={styles.logoPlaceholder}>🏫</div>
          )}
          <h1 style={styles.schoolName}>{schoolInfo.name}</h1>
          <div style={styles.divider} />
          <p style={styles.tagline}>{schoolInfo.tagline}</p>
          
          <div style={styles.featureGrid}>
            <div style={styles.featureItem}><span>✓</span> Digital Attendance</div>
            <div style={styles.featureItem}><span>✓</span> AI Focus Tracking</div>
            <div style={styles.featureItem}><span>✓</span> Resource Library</div>
          </div>
        </div>
        <div style={styles.footerNote}>© 2026 {schoolInfo.name}. All rights reserved.</div>
      </div>

      {/* Right Panel: The Login Side */}
      <div style={styles.rightPanel}>
        <div style={styles.loginContainer}>
          <div style={styles.mobileLogo}>
             {schoolInfo.logo ? <img src={schoolInfo.logo} style={{width:'50px'}} /> : '🏫'}
          </div>
          <h2 style={styles.welcomeText}>Welcome Back</h2>
          <p style={styles.loginSub}>Please enter your credentials to access the portal.</p>

          <form onSubmit={handleLogin} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>User ID</label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>👤</span>
                <input
                  style={styles.input}
                  type="text"
                  placeholder="Enter your unique ID"
                  value={uid}
                  onChange={(e) => setUid(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Password</label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>🔒</span>
                <input
                  style={styles.input}
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && (
              <div style={styles.errorBox}>
                <span>⚠️</span> {error}
              </div>
            )}

            <button style={styles.button} type="submit" disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign In to Portal'}
            </button>
          </form>

          <div style={styles.helpSection}>
            <p>Forgot password? Contact system administrator.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  pageWrapper: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    fontFamily: '"Inter", sans-serif',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  leftPanel: {
    flex: 1,
    position: 'relative',
    background: 'linear-gradient(135deg, #4f46e5 0%, #312e81 100%)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '60px',
    color: '#fff',
    // Background image could be added here
  },
  brandingContent: {
    position: 'relative',
    zIndex: 2,
    textAlign: 'center',
    maxWidth: '500px',
  },
  mainLogo: {
    width: '100px',
    height: '100px',
    borderRadius: '20px',
    marginBottom: '24px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
    backgroundColor: '#fff',
    padding: '10px'
  },
  logoPlaceholder: {
    fontSize: '64px',
    marginBottom: '20px'
  },
  schoolName: {
    fontSize: '42px',
    fontWeight: '900',
    margin: '0 0 16px 0',
    letterSpacing: '-1px',
    textTransform: 'uppercase'
  },
  divider: {
    width: '60px',
    height: '4px',
    backgroundColor: '#818cf8',
    margin: '0 auto 24px',
    borderRadius: '2px'
  },
  tagline: {
    fontSize: '18px',
    lineHeight: '1.6',
    color: '#c7d2fe',
    marginBottom: '40px',
    fontWeight: '400'
  },
  featureGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '12px',
    textAlign: 'left',
    width: 'fit-content',
    margin: '0 auto'
  },
  featureItem: {
    fontSize: '15px',
    color: '#e0e7ff',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  footerNote: {
    position: 'absolute',
    bottom: '30px',
    fontSize: '13px',
    color: '#818cf8'
  },
  rightPanel: {
    width: '550px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '80px',
    backgroundColor: '#fff',
    zIndex: 10,
    boxShadow: '-10px 0 50px rgba(0,0,0,0.05)'
  },
  loginContainer: {
    width: '100%',
    maxWidth: '380px',
    margin: '0 auto'
  },
  mobileLogo: {
    display: 'none', // Can be shown on mobile media queries
    marginBottom: '20px'
  },
  welcomeText: {
    fontSize: '32px',
    fontWeight: '800',
    color: '#1e293b',
    margin: '0 0 8px 0'
  },
  loginSub: {
    fontSize: '15px',
    color: '#64748b',
    marginBottom: '32px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  inputIcon: {
    position: 'absolute',
    left: '14px',
    fontSize: '16px',
    color: '#94a3b8'
  },
  input: {
    width: '100%',
    padding: '14px 14px 14px 42px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    fontSize: '15px',
    backgroundColor: '#f8fafc',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box'
  },
  button: {
    padding: '16px',
    backgroundColor: '#4f46e5',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.3)',
    marginTop: '10px'
  },
  errorBox: {
    padding: '12px',
    backgroundColor: '#fff1f2',
    color: '#be123c',
    borderRadius: '8px',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: '500',
    border: '1px solid #fecaca'
  },
  helpSection: {
    marginTop: '32px',
    textAlign: 'center',
    fontSize: '13px',
    color: '#94a3b8'
  }
}