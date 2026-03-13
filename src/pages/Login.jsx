import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [uid, setUid] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error } = await login(uid.trim(), password)

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Role-based redirect handled by App.jsx RoleRedirect
    navigate('/')
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoArea}>
          <div style={styles.logoIcon}>🏫</div>
          <h1 style={styles.logoText}>ERP</h1>
          <p style={styles.subtitle}>School Management System</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>User ID</label>
            <input
              style={styles.input}
              type="text"
              placeholder="e.g. A9876543210"
              value={uid}
              onChange={(e) => setUid(e.target.value)}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={styles.hint}>
          Use your Admin / Teacher / Student ID to login
        </p>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'Inter, sans-serif',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '40px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  },
  logoArea: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  logoIcon: {
    fontSize: '48px',
    marginBottom: '8px',
  },
  logoText: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#1a1a2e',
    margin: '0',
  },
  subtitle: {
    color: '#6b7280',
    fontSize: '14px',
    marginTop: '4px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    padding: '12px 14px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    outline: 'none',
    transition: 'border 0.2s',
  },
  error: {
    color: '#ef4444',
    fontSize: '13px',
    margin: '0',
  },
  button: {
    padding: '12px',
    backgroundColor: '#4f46e5',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '4px',
  },
  hint: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: '12px',
    marginTop: '20px',
  },
}