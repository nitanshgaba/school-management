import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

// Expanded dictionary to catch all types of system activities
const ACTION_ICONS = {
  'Login':             '🔑',
  'Logout':            '🚪',
  'Student Created':   '👨‍🎓',
  'Student Updated':   '✏️',
  'Student Deleted':   '🗑️',
  'Teacher Created':   '👨‍🏫',
  'Teacher Updated':   '✏️',
  'Teacher Deleted':   '🗑️',
  'Attendance Marked': '✅',
  'Fee Collected':     '💰',
  'Exam Created':      '📝',
  'Marks Uploaded':    '🏆',
  'Notice Posted':     '📢',
  'Paper Published':   '📄',
  'Leave Applied':     '🏖️',
  'CSV Import':        '📥',
  'System Error':      '⚠️',
  'DEFAULT':           '⚡'
}

const ACTION_COLORS = {
  'Login':             '#3b82f6',
  'Logout':            '#64748b',
  'Student Created':   '#16a34a',
  'Student Updated':   '#f59e0b',
  'Student Deleted':   '#ef4444',
  'Teacher Created':   '#6366f1',
  'Teacher Updated':   '#f59e0b',
  'Teacher Deleted':   '#ef4444',
  'Attendance Marked': '#10b981',
  'Fee Collected':     '#16a34a',
  'Exam Created':      '#8b5cf6',
  'Marks Uploaded':    '#d946ef',
  'Notice Posted':     '#f59e0b',
  'Paper Published':   '#0ea5e9',
  'Leave Applied':     '#f59e0b',
  'CSV Import':        '#0ea5e9',
  'System Error':      '#ef4444',
  'DEFAULT':           '#475569'
}

export default function ActivityLog() {
  const [logs, setLogs] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [selAction, setSelAction] = useState('')
  const [selRole, setSelRole] = useState('')
  const [selDate, setSelDate] = useState('')
  const [search, setSearch] = useState('')
  
  // Pagination
  const [page, setPage] = useState(1)
  const PER_PAGE = 15

  useEffect(() => { loadLogs() }, [])

  // Apply filters whenever dependencies change
  useEffect(() => { 
    applyFilters() 
    setPage(1) // Reset to page 1 when filters change
  }, [logs, selAction, selRole, selDate, search])

  const loadLogs = async () => {
    setLoading(true)
    // Fetching the latest 1000 logs for a good audit trail
    const { data } = await supabase.from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000) 
      
    setLogs(data || [])
    setLoading(false)
  }

  const applyFilters = () => {
    let f = [...logs]
    if (selAction) f = f.filter(l => l.action === selAction)
    if (selRole)   f = f.filter(l => (l.role || '').toLowerCase() === selRole.toLowerCase())
    if (selDate)   f = f.filter(l => l.created_at?.startsWith(selDate))
    if (search) {
      const q = search.toLowerCase()
      f = f.filter(l =>
        (l.performed_by_name || '').toLowerCase().includes(q) ||
        (l.target_name || '').toLowerCase().includes(q) ||
        (l.details || '').toLowerCase().includes(q) ||
        (l.action || '').toLowerCase().includes(q)
      )
    }
    setFiltered(f)
  }

  const clearFilters = () => { 
    setSelAction(''); setSelRole(''); setSelDate(''); setSearch('') 
  }

  const fmt = (ts) => {
    if (!ts) return '—'
    const d = new Date(ts)
    return {
      date: d.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }),
      time: d.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })
    }
  }

  // Extract unique actions from actual DB data to populate dropdown
  const uniqueActions = [...new Set(logs.map(l => l.action))].filter(Boolean).sort()

  // Pagination Logic
  const paginatedLogs = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const totalPages = Math.ceil(filtered.length / PER_PAGE)

  // Stats Calculations
  const todayStr = new Date().toISOString().split('T')[0]
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  return (
    <div style={styles.container}>
      <div style={styles.pageHeader}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={styles.pageTitle}>System Audit Log</h1>
            <p style={styles.pageSubtitle}>Monitor all activities, logins, and changes across the ERP</p>
          </div>
          <button style={styles.refreshBtn} onClick={loadLogs} title="Refresh Logs">
            🔄 Refresh Data
          </button>
        </div>
      </div>

      {/* Premium Stats Row */}
      <div style={styles.statsRow}>
        {[
          { label: 'Total Logs', value: logs.length, color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
          { label: 'Today\'s Activity', value: logs.filter(l => l.created_at?.startsWith(todayStr)).length, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
          { label: 'Past 7 Days', value: logs.filter(l => new Date(l.created_at) > weekAgo).length, color: '#8b5cf6', bg: '#faf5ff', border: '#e9d5ff' },
          { label: 'Filtered Results', value: filtered.length, color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
        ].map(s => (
          <div key={s.label} style={{ ...styles.statCard, backgroundColor: s.bg, border: `1px solid ${s.border}` }}>
            <p style={styles.statLabel}>{s.label}</p>
            <p style={{ ...styles.statValue, color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h2 style={styles.sectionTitle}>🎯 Filter & Search</h2>
        </div>

        {/* Advanced Filters */}
        <div style={styles.filterBox}>
          <div style={styles.filterRow}>
            <div style={{ ...styles.filterGroup, flex: '2' }}>
              <label style={styles.label}>Search Logs</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '12px', fontSize: '14px' }}>🔍</span>
                <input 
                  style={{ ...styles.input, paddingLeft: '36px' }} 
                  placeholder="Search names, targets, or details..." 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                />
              </div>
            </div>
            
            <div style={styles.filterGroup}>
              <label style={styles.label}>Action Type</label>
              <select style={styles.input} value={selAction} onChange={e => setSelAction(e.target.value)}>
                <option value="">All Actions</option>
                {uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.label}>User Role</label>
              <select style={styles.input} value={selRole} onChange={e => setSelRole(e.target.value)}>
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="teacher">Teacher</option>
                <option value="student">Student</option>
              </select>
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.label}>Specific Date</label>
              <input style={styles.input} type="date" value={selDate} onChange={e => setSelDate(e.target.value)} />
            </div>

            {(selAction || selRole || selDate || search) && (
              <button style={styles.clearBtn} onClick={clearFilters}>
                ✕ Clear
              </button>
            )}
          </div>
        </div>

        {/* Data Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>⏳ Fetching latest activity logs...</div>
        ) : filtered.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyStateIcon}>📭</div>
            <h3 style={{ color: '#374151', margin: '0 0 8px 0' }}>No Activity Found</h3>
            <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>Adjust your filters to see more results.</p>
          </div>
        ) : (
          <div style={styles.fadeIn}>
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Timestamp</th>
                    <th style={styles.th}>Action Performed</th>
                    <th style={styles.th}>Initiated By</th>
                    <th style={styles.th}>Target</th>
                    <th style={styles.th}>Additional Details</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLogs.map(log => {
                    const color = ACTION_COLORS[log.action] || ACTION_COLORS['DEFAULT']
                    const icon  = ACTION_ICONS[log.action]  || ACTION_ICONS['DEFAULT']
                    const ts = fmt(log.created_at)

                    return (
                      <tr key={log.id} style={styles.tr}>
                        <td style={styles.td}>
                          <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '13px' }}>{ts.date}</div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{ts.time}</div>
                        </td>
                        <td style={styles.td}>
                          <span style={{ 
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            backgroundColor: `${color}15`, color: color, 
                            border: `1px solid ${color}30`,
                            padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap' 
                          }}>
                            <span>{icon}</span> {log.action}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '13px' }}>{log.performed_by_name || 'System / Unknown'}</div>
                          <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginTop: '2px', fontWeight: '700', letterSpacing: '0.5px' }}>
                            {log.role || '—'}
                          </div>
                        </td>
                        <td style={{ ...styles.td, fontWeight: '500', color: '#334155' }}>
                          {log.target_name || '—'}
                        </td>
                        <td style={{ ...styles.td, color: '#475569', fontSize: '13px', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={log.details}>
                          {log.details || '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={styles.pagination}>
                <button 
                  style={{ ...styles.pageBtn, opacity: page === 1 ? 0.5 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer' }} 
                  onClick={() => setPage(p => Math.max(1, p - 1))} 
                  disabled={page === 1}
                >
                  ← Previous
                </button>
                <span style={styles.pageNum}>Page {page} of {totalPages}</span>
                <button 
                  style={{ ...styles.pageBtn, opacity: page === totalPages ? 0.5 : 1, cursor: page === totalPages ? 'not-allowed' : 'pointer' }} 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                  disabled={page === totalPages}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── STYLES ────────────────────────────────────────────────
const styles = {
  container: { maxWidth: '1150px', margin: '0 auto', padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' },
  pageHeader: { marginBottom: '24px' },
  pageTitle: { fontSize: '32px', fontWeight: '800', color: '#111827', margin: '0 0 8px 0', letterSpacing: '-0.5px' },
  pageSubtitle: { fontSize: '15px', color: '#6b7280', margin: 0 },
  
  refreshBtn: { padding: '10px 16px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#475569', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', transition: 'all 0.2s' },
  
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' },
  statCard: { borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', textAlign: 'left' },
  statLabel: { margin: 0, fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' },
  statValue: { margin: '8px 0 0', fontSize: '32px', fontWeight: '800', lineHeight: 1 },
  
  card: { backgroundColor: '#fff', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', border: '1px solid #f3f4f6' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  sectionTitle: { fontSize: '18px', fontWeight: '700', color: '#1f2937', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' },
  
  filterBox: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '24px' },
  filterRow: { display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: '8px', flex: '1', minWidth: '160px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', backgroundColor: '#fff', color: '#1e293b', transition: 'border-color 0.2s', width: '100%' },
  
  clearBtn: { padding: '12px 20px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', height: '44px', display: 'flex', alignItems: 'center', transition: 'all 0.2s' },
  
  fadeIn: { opacity: 1, transition: 'opacity 0.3s ease-in' },
  
  tableWrapper: { borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'x-auto' },
  table: { width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff' },
  th: { textAlign: 'left', fontSize: '12px', color: '#64748b', fontWeight: '700', padding: '16px 20px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' },
  tr: { borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s ease' },
  td: { padding: '16px 20px', fontSize: '14px', color: '#1e293b', verticalAlign: 'middle' },
  
  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e2e8f0' },
  pageBtn: { padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', color: '#334155', fontWeight: '600', fontSize: '14px', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
  pageNum: { fontSize: '14px', fontWeight: '600', color: '#64748b' },
  
  emptyState: { textAlign: 'center', padding: '60px 20px', border: '2px dashed #e2e8f0', borderRadius: '12px', backgroundColor: '#fafaf9', marginTop: '16px' },
  emptyStateIcon: { fontSize: '56px', marginBottom: '16px', opacity: 0.8 },
}