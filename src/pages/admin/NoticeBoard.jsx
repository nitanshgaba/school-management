import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const TABS = ['Create Notice', 'Notice Board']

export default function NoticeBoard() {
  const [activeTab, setActiveTab] = useState('Create Notice')

  return (
    <div>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Notice Board</h1>
      </div>

      <div style={styles.card}>
        <div style={styles.tabs}>
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                ...styles.tab,
                borderBottom: activeTab === tab ? '2px solid #22c55e' : '2px solid transparent',
                color: activeTab === tab ? '#22c55e' : '#6b7280',
                fontWeight: activeTab === tab ? '600' : '400',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'Create Notice' && <CreateNotice onCreated={() => setActiveTab('Notice Board')} />}
        {activeTab === 'Notice Board' && <ViewNotices />}
      </div>
    </div>
  )
}

// ─── CREATE NOTICE ─────────────────────────────────────────
function CreateNotice({ onCreated }) {
  const [form, setForm] = useState({ title: '', body: '', importance: 'green', target: 'all' })
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handlePost = async () => {
    if (!form.title.trim()) {
      setMessage('Notice title is required.')
      return
    }
    setLoading(true)
    setMessage('')

    let fileUrl = null
    let fileSize = null

    if (file) {
      const ext = file.name.split('.').pop()
      const fileName = `notice_${Date.now()}.${ext}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('notices-files')
        .upload(fileName, file)

      if (uploadError) {
        setMessage('File upload failed: ' + uploadError.message)
        setLoading(false)
        return
      }

      const { data: urlData } = supabase.storage.from('notices-files').getPublicUrl(fileName)
      fileUrl = urlData.publicUrl
      fileSize = (file.size / 1024).toFixed(0) + 'KB (' + ext + ')'
    }

    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('notices').insert({
      title: form.title.trim(),
      body: form.body.trim(),
      importance: form.importance,
      target: form.target,
      file_url: fileUrl,
      file_size: fileSize,
      created_by: user.id,
    })

    if (error) {
      setMessage('Error: ' + error.message)
    } else {
      setMessage('✅ Notice posted!')
      setForm({ title: '', body: '', importance: 'green' })
      setFile(null)
      setTimeout(() => onCreated(), 1000)
    }
    setLoading(false)
  }

  const handleReset = () => {
    setForm({ title: '', body: '', importance: 'green' })
    setFile(null)
    setMessage('')
  }

  return (
    <div>
      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>📋 Create Notice</h2>
      </div>

      <div style={styles.form}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Notice Title</label>
          <input
            style={styles.input}
            placeholder="title of notice"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Notice Body</label>
          <textarea
            style={styles.textarea}
            placeholder="Write notice body..."
            value={form.body}
            onChange={e => setForm({ ...form, body: e.target.value })}
            rows={5}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Any file</label>
          <input
            type="file"
            style={styles.fileInput}
            onChange={e => setFile(e.target.files[0])}
          />
          {file && <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>Selected: {file.name}</p>}
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Send To</label>
          <div style={{ display: 'flex', gap: '12px' }}>
            {[
              { value: 'all', label: '👥 Everyone', color: '#4f46e5' },
              { value: 'teachers', label: '👨‍🏫 Teachers Only', color: '#22c55e' },
              { value: 'students', label: '👨‍🎓 Students Only', color: '#f59e0b' },
            ].map(opt => (
              <div key={opt.value} onClick={() => setForm({ ...form, target: opt.value })}
                style={{ padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                  backgroundColor: form.target === opt.value ? opt.color : '#f3f4f6',
                  color: form.target === opt.value ? '#fff' : '#6b7280',
                  border: form.target === opt.value ? `2px solid ${opt.color}` : '2px solid transparent',
                }}>
                {opt.label}
              </div>
            ))}
          </div>
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Importance</label>
          <div style={styles.importanceRow}>
            {['green', 'yellow', 'red'].map(color => (
              <div
                key={color}
                onClick={() => setForm({ ...form, importance: color })}
                style={{
                  ...styles.importanceDot,
                  backgroundColor: color === 'green' ? '#22c55e' : color === 'yellow' ? '#eab308' : '#ef4444',
                  border: form.importance === color ? '3px solid #1a1a2e' : '3px solid transparent',
                  cursor: 'pointer',
                }}
              >
                {form.importance === color && <span style={{ color: '#fff', fontSize: '12px' }}>✓</span>}
              </div>
            ))}
          </div>
        </div>

        {message && (
          <p style={{ color: message.startsWith('✅') ? '#22c55e' : '#ef4444', fontSize: '14px' }}>{message}</p>
        )}

        <div style={styles.formButtons}>
          <button style={styles.resetBtn} onClick={handleReset}>Reset</button>
          <button style={styles.submitBtn} onClick={handlePost} disabled={loading}>
            {loading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── VIEW NOTICES ──────────────────────────────────────────
function ViewNotices() {
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [editNotice, setEditNotice] = useState(null)
  const [saving, setSaving] = useState(false)
  const [page, setPage] = useState(1)
  const PER_PAGE = 9

  useEffect(() => { fetchNotices() }, [])

  const fetchNotices = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('notices')
      .select('*')
      .order('created_at', { ascending: false })
    setNotices(data || [])
    setLoading(false)
  }

  const handleDelete = async (id, fileUrl) => {
    if (!confirm('Delete this notice?')) return
    if (fileUrl) {
      const fileName = fileUrl.split('/').pop()
      await supabase.storage.from('notices-files').remove([fileName])
    }
    await supabase.from('notices').delete().eq('id', id)
    setNotices(notices.filter(n => n.id !== id))
  }

  const handleEdit = async () => {
    setSaving(true)
    const { error } = await supabase.from('notices').update({
      title: editNotice.title,
      body: editNotice.body,
      importance: editNotice.importance,
      target: editNotice.target,
    }).eq('id', editNotice.id)
    if (!error) {
      setNotices(notices.map(n => n.id === editNotice.id ? { ...n, ...editNotice } : n))
      setEditNotice(null)
    }
    setSaving(false)
  }

  const importanceColor = (imp) => {
    if (imp === 'green') return '#22c55e'
    if (imp === 'yellow') return '#eab308'
    return '#ef4444'
  }

  const paginated = notices.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const totalPages = Math.ceil(notices.length / PER_PAGE)

  return (
    <div>
      {/* Edit Modal */}
      {editNotice && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.formTitle}>Edit Notice</h3>
            <div style={styles.formGroup}>
              <label style={styles.label}>Title</label>
              <input style={styles.input} value={editNotice.title}
                onChange={e => setEditNotice({ ...editNotice, title: e.target.value })} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Body</label>
              <textarea style={styles.textarea} rows={4} value={editNotice.body || ''}
                onChange={e => setEditNotice({ ...editNotice, body: e.target.value })} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Send To</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                {[
                  { value: 'all', label: '👥 Everyone', color: '#4f46e5' },
                  { value: 'teachers', label: '👨‍🏫 Teachers', color: '#22c55e' },
                  { value: 'students', label: '👨‍🎓 Students', color: '#f59e0b' },
                ].map(opt => (
                  <div key={opt.value} onClick={() => setEditNotice({ ...editNotice, target: opt.value })}
                    style={{ padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                      backgroundColor: editNotice.target === opt.value ? opt.color : '#f3f4f6',
                      color: editNotice.target === opt.value ? '#fff' : '#6b7280',
                      border: editNotice.target === opt.value ? `2px solid ${opt.color}` : '2px solid transparent',
                    }}>
                    {opt.label}
                  </div>
                ))}
              </div>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Importance</label>
              <div style={styles.importanceRow}>
                {['green', 'yellow', 'red'].map(color => (
                  <div
                    key={color}
                    onClick={() => setEditNotice({ ...editNotice, importance: color })}
                    style={{
                      ...styles.importanceDot,
                      backgroundColor: color === 'green' ? '#22c55e' : color === 'yellow' ? '#eab308' : '#ef4444',
                      border: editNotice.importance === color ? '3px solid #1a1a2e' : '3px solid transparent',
                      cursor: 'pointer',
                    }}
                  >
                    {editNotice.importance === color && <span style={{ color: '#fff', fontSize: '12px' }}>✓</span>}
                  </div>
                ))}
              </div>
            </div>
            <div style={styles.formButtons}>
              <button style={styles.resetBtn} onClick={() => setEditNotice(null)}>Cancel</button>
              <button style={styles.submitBtn} onClick={handleEdit} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>📋 Notice Board</h2>
      </div>

      {loading ? (
        <p style={{ color: '#9ca3af' }}>Loading...</p>
      ) : notices.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={{ fontSize: '64px' }}>📢</div>
          <p style={{ color: '#9ca3af', marginTop: '12px' }}>No notices yet</p>
        </div>
      ) : (
        <>
          <div style={styles.noticeGrid}>
            {paginated.map(n => (
              <div key={n.id} style={styles.noticeCard}>
                {/* Card Header */}
                <div style={styles.noticeCardHeader}>
                  <div>
                    <h3 style={styles.noticeCardTitle}>{n.title}</h3>
                    <p style={styles.noticeCardDate}>
                      <span style={{ backgroundColor: n.target === 'teachers' ? '#dcfce7' : n.target === 'students' ? '#fef9c3' : '#dbeafe', color: n.target === 'teachers' ? '#16a34a' : n.target === 'students' ? '#ca8a04' : '#1d4ed8', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', marginRight: '6px' }}>{n.target === 'teachers' ? '👨‍🏫 Teachers' : n.target === 'students' ? '👨‍🎓 Students' : '👥 Everyone'}</span>
                      {new Date(n.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div style={{
                    width: '14px', height: '14px', borderRadius: '50%',
                    backgroundColor: importanceColor(n.importance), flexShrink: 0,
                  }} />
                </div>

                {/* Body */}
                {n.body && (
                  <p style={{ ...styles.noticeCardBody, color: importanceColor(n.importance) }}>
                    {n.body}
                  </p>
                )}

                {/* Footer */}
                <div style={styles.noticeCardFooter}>
                  <div style={styles.noticeCardActions}>
                    {n.file_url && (
                      <>
                        <a href={n.file_url} target="_blank" rel="noreferrer" style={styles.iconBtn} title="View">👁</a>
                        <a href={n.file_url} download style={styles.iconBtn} title="Download">⬇️</a>
                        <span style={{ fontSize: '12px', color: '#9ca3af' }}>{n.file_size}</span>
                      </>
                    )}
                  </div>
                  <div style={styles.noticeCardActions}>
                    <button style={styles.iconBtn} onClick={() => setEditNotice(n)} title="Edit">✏️</button>
                    <button style={{ ...styles.iconBtn, color: '#ef4444' }} onClick={() => handleDelete(n.id, n.file_url)} title="Delete">🗑</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div style={styles.pagination}>
              <button style={styles.pageBtn} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>prev</button>
              <span style={styles.pageNum}>{page}</span>
              <button style={styles.pageBtn} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>next</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

const styles = {
  pageHeader: { marginBottom: '24px' },
  pageTitle: { fontSize: '28px', fontWeight: '700', color: '#1a1a2e', margin: 0 },
  card: { backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  tabs: { display: 'flex', gap: '4px', borderBottom: '1px solid #e5e7eb', marginBottom: '24px' },
  tab: { padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  sectionTitle: { fontSize: '16px', fontWeight: '700', color: '#1a1a2e' },
  form: { maxWidth: '560px', display: 'flex', flexDirection: 'column', gap: '20px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#374151' },
  input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none' },
  textarea: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none', resize: 'vertical', fontFamily: 'inherit' },
  fileInput: { padding: '8px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px' },
  importanceRow: { display: 'flex', gap: '12px', alignItems: 'center' },
  importanceDot: { width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border 0.2s' },
  formButtons: { display: 'flex', gap: '12px' },
  resetBtn: { padding: '10px 24px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '14px', color: '#eab308', fontWeight: '600' },
  submitBtn: { padding: '10px 24px', borderRadius: '8px', border: 'none', backgroundColor: '#4f46e5', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  noticeGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' },
  noticeCard: { backgroundColor: '#f9fafb', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid #e5e7eb' },
  noticeCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' },
  noticeCardTitle: { fontSize: '15px', fontWeight: '700', color: '#1a1a2e', margin: 0 },
  noticeCardDate: { fontSize: '12px', color: '#9ca3af', margin: '4px 0 0' },
  noticeCardBody: { fontSize: '13px', margin: 0 },
  noticeCardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' },
  noticeCardActions: { display: 'flex', alignItems: 'center', gap: '8px' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', padding: '2px', textDecoration: 'none' },
  pagination: { display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', marginTop: '20px' },
  pageBtn: { padding: '6px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '13px' },
  pageNum: { padding: '6px 12px', borderRadius: '6px', backgroundColor: '#4f46e5', color: '#fff', fontSize: '13px' },
  emptyState: { textAlign: 'center', padding: '60px 0' },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal: { backgroundColor: '#fff', borderRadius: '12px', padding: '28px', width: '460px', display: 'flex', flexDirection: 'column', gap: '16px' },
  formTitle: { fontSize: '18px', fontWeight: '700', color: '#1a1a2e' },
}