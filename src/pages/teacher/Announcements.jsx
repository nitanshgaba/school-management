import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function TeacherAnnouncements() {
  const { profile } = useAuth()
  const [announcements, setAnnouncements] = useState([])
  const [myClasses, setMyClasses] = useState([])
  const [studentsInClass, setStudentsInClass] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [form, setForm] = useState({ title: "", message: "", target_type: "all_my_classes", class_id: "", student_id: "" })
  const [message, setMessage] = useState("")

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const [{ data: ann }, { data: tc }] = await Promise.all([
      supabase.from("announcements").select("*, classes(name), students(id, roll_no, profiles(name))").eq("teacher_id", profile.id).order("created_at", { ascending: false }),
      supabase.from("teacher_classes").select("class_id, classes(id, name)").eq("teacher_id", profile.id),
    ])
    setAnnouncements(ann || [])
    const unique = {}
    tc?.forEach(a => { if (!unique[a.class_id]) unique[a.class_id] = a.classes })
    setMyClasses(Object.values(unique))
    setLoading(false)
  }

  const handleClassChange = async (classId) => {
    setForm(f => ({ ...f, class_id: classId, student_id: "" }))
    if (!classId) { setStudentsInClass([]); return }
    const { data } = await supabase.from("students").select("id, roll_no, profiles(name)").eq("class_id", classId)
    setStudentsInClass(data || [])
  }

  const handleSave = async () => {
    if (!form.title || !form.message) { setMessage("⚠️ Title and message are required"); return }
    setSaving(true)
    const payload = {
      title: form.title,
      message: form.message,
      teacher_id: profile.id,
      target_type: form.target_type,
      class_id: form.target_type !== "all_my_classes" && form.class_id ? parseInt(form.class_id) : null,
      student_id: form.target_type === "student" && form.student_id ? form.student_id : null,
    }
    const { error } = await supabase.from("announcements").insert(payload)
    if (!error) {
      setShowModal(false)
      fetchAll()
    } else {
      setMessage("❌ " + error.message)
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    await supabase.from("announcements").delete().eq("id", deleteId)
    setDeleteId(null)
    fetchAll()
  }

  const targetLabel = (ann) => {
    if (ann.target_type === "all_my_classes") return { text: "📢 All Classes", bg: "#eff6ff", color: "#2563eb" }
    if (ann.target_type === "class") return { text: `🏫 Class ${ann.classes?.name || ""}`, bg: "#f0fdf4", color: "#16a34a" }
    if (ann.target_type === "student") return { text: `👤 ${ann.students?.profiles?.name || "Student"}`, bg: "#fef2f2", color: "#dc2626" }
    return { text: "—", bg: "#f8fafc", color: "#64748b" }
  }

  const timeAgo = (ts) => {
    const diff = Math.floor((Date.now() - new Date(ts)) / 1000)
    if (diff < 60) return "Just now"
    if (diff < 3600) return Math.floor(diff/60) + "m ago"
    if (diff < 86400) return Math.floor(diff/3600) + "h ago"
    return Math.floor(diff/86400) + "d ago"
  }

  if (loading) return <div style={styles.loadingBox}>⌛ Loading announcements...</div>

  return (
    <div style={styles.container}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Announcements</h1>
          <p style={styles.pageSubtitle}>Broadcast messages to your classes or specific students</p>
        </div>
        <button style={styles.addBtn} onClick={() => { setMessage(""); setShowModal(true); }}>＋ New Post</button>
      </div>

      <div style={styles.feed}>
        {announcements.length === 0 ? (
          <div style={styles.emptyState}>No announcements posted yet. Start by clicking "New Post".</div>
        ) : (
          announcements.map(ann => {
            const badge = targetLabel(ann)
            return (
              <div key={ann.id} style={styles.slimCard}>
                <div style={styles.cardTop}>
                  <div style={styles.targetSection}>
                    <span style={{ ...styles.typeTag, backgroundColor: badge.bg, color: badge.color }}>
                      {badge.text}
                    </span>
                    <span style={styles.dot}>•</span>
                    <span style={styles.timeText}>{timeAgo(ann.created_at)}</span>
                  </div>
                  <button style={styles.trashBtn} onClick={() => setDeleteId(ann.id)}>🗑️</button>
                </div>
                <div style={styles.contentSection}>
                  <h3 style={styles.annTitle}>{ann.title}</h3>
                  <p style={styles.annMessage}>{ann.message}</p>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal logic remains same, styled with new S object */}
      {showModal && (
        <div style={styles.overlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>📢 Create Announcement</h2>
              <button onClick={() => setShowModal(false)} style={styles.closeBtn}>✕</button>
            </div>
            <div style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Heading / Title *</label>
                <input style={styles.input} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Test Results Postponed" />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Message Body *</label>
                <textarea style={styles.textarea} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Detailed message for students..." />
              </div>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Recipients</label>
                  <select style={styles.input} value={form.target_type} onChange={e => setForm({ ...form, target_type: e.target.value, class_id: "", student_id: "" })}>
                    <option value="all_my_classes">All My Classes</option>
                    <option value="class">Specific Class</option>
                    <option value="student">Specific Student</option>
                  </select>
                </div>
                {(form.target_type !== "all_my_classes") && (
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Select Class</label>
                    <select style={styles.input} value={form.class_id} onChange={e => handleClassChange(e.target.value)}>
                      <option value="">-- Choose Class --</option>
                      {myClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                )}
              </div>
              {form.target_type === "student" && form.class_id && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>Target Student</label>
                  <select style={styles.input} value={form.student_id} onChange={e => setForm({ ...form, student_id: e.target.value })}>
                    <option value="">-- Choose Student --</option>
                    {studentsInClass.map(s => <option key={s.id} value={s.id}>{s.profiles?.name} ({s.roll_no})</option>)}
                  </select>
                </div>
              )}
              {message && <p style={styles.errorText}>{message}</p>}
              <div style={styles.modalFooter}>
                <button style={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
                <button style={styles.saveBtn} onClick={handleSave} disabled={saving}>{saving ? "Publishing..." : "Publish Post"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation remains similar but styled */}
      {deleteId && (
        <div style={styles.overlay} onClick={() => setDeleteId(null)}>
          <div style={{ ...styles.modal, maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: '800' }}>Confirm Deletion</h3>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>Are you sure you want to remove this announcement? This action cannot be reversed.</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button style={styles.cancelBtn} onClick={() => setDeleteId(null)}>Cancel</button>
              <button style={{ ...styles.saveBtn, backgroundColor: '#ef4444' }} onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: { maxWidth: '900px', margin: '0 auto', padding: '20px', fontFamily: 'Inter, sans-serif' },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' },
  pageTitle: { fontSize: '32px', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-1px' },
  pageSubtitle: { fontSize: '15px', color: '#64748b', marginTop: '4px' },
  
  loadingBox: { textAlign: 'center', padding: '100px', color: '#64748b' },
  addBtn: { padding: '12px 24px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.4)' },
  
  feed: { display: 'flex', flexDirection: 'column', gap: '12px' },
  slimCard: { backgroundColor: '#fff', borderRadius: '12px', padding: '16px 20px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', position: 'relative' },
  
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  targetSection: { display: 'flex', alignItems: 'center', gap: '8px' },
  typeTag: { fontSize: '11px', fontWeight: '800', padding: '2px 10px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  dot: { color: '#cbd5e1' },
  timeText: { fontSize: '12px', color: '#94a3b8', fontWeight: '500' },
  trashBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', opacity: 0.5, transition: '0.2s', ':hover': { opacity: 1 } },
  
  contentSection: { paddingLeft: '0px' },
  annTitle: { fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0' },
  annMessage: { fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: 0 },
  
  emptyState: { textAlign: 'center', padding: '60px 20px', border: '2px dashed #e2e8f0', borderRadius: '16px', color: '#94a3b8' },

  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  modal: { backgroundColor: '#fff', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '550px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  modalTitle: { fontSize: '22px', fontWeight: '900', color: '#0f172a', margin: 0 },
  closeBtn: { background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', color: '#64748b', fontWeight: '700' },
  
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { padding: '12px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', backgroundColor: '#fff' },
  textarea: { padding: '12px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', height: '120px', resize: 'vertical', fontFamily: 'inherit' },
  
  modalFooter: { display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' },
  cancelBtn: { padding: '12px 24px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '14px' },
  saveBtn: { padding: '12px 24px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '14px' },
  errorText: { color: '#ef4444', fontSize: '13px', fontWeight: '600', margin: 0 }
}