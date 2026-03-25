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

  useEffect(() => {
    fetchAll()
  }, [])

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
    if (!form.title || !form.message) { setMessage("Title and message are required"); return }
    if (form.target_type === "class" && !form.class_id) { setMessage("Please select a class"); return }
    if (form.target_type === "student" && !form.student_id) { setMessage("Please select a student"); return }
    setSaving(true)
    setMessage("")
    const payload = {
      title: form.title,
      message: form.message,
      teacher_id: profile.id,
      target_type: form.target_type,
      class_id: form.target_type !== "all_my_classes" && form.class_id ? parseInt(form.class_id) : null,
      student_id: form.target_type === "student" && form.student_id ? form.student_id : null,
    }
    const { error } = await supabase.from("announcements").insert(payload)
    setSaving(false)
    if (error) { setMessage("Error: " + error.message); return }
    setShowModal(false)
    setForm({ title: "", message: "", target_type: "all_my_classes", class_id: "", student_id: "" })
    fetchAll()
  }

  const handleDelete = async () => {
    await supabase.from("announcements").delete().eq("id", deleteId)
    setDeleteId(null)
    fetchAll()
  }

  const openModal = () => {
    setForm({ title: "", message: "", target_type: "all_my_classes", class_id: "", student_id: "" })
    setStudentsInClass([])
    setMessage("")
    setShowModal(true)
  }

  const targetLabel = (ann) => {
    if (ann.target_type === "all_my_classes") return { text: "All My Classes", bg: "#dbeafe", color: "#1d4ed8" }
    if (ann.target_type === "class") return { text: "Class " + (ann.classes?.name || ""), bg: "#dcfce7", color: "#166534" }
    if (ann.target_type === "student") return { text: ann.students?.profiles?.name || "Student", bg: "#fef9c3", color: "#92400e" }
    return { text: "—", bg: "#f3f4f6", color: "#6b7280" }
  }

  const timeAgo = (ts) => {
    const diff = Math.floor((Date.now() - new Date(ts)) / 1000)
    if (diff < 60) return "Just now"
    if (diff < 3600) return Math.floor(diff/60) + "m ago"
    if (diff < 86400) return Math.floor(diff/3600) + "h ago"
    return Math.floor(diff/86400) + "d ago"
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1 style={S.title}>Announcements</h1>
        <button style={S.addBtn} onClick={openModal}>+ New Announcement</button>
      </div>

      {loading ? <p style={{ color: "#9ca3af" }}>Loading...</p> : announcements.length === 0 ? (
        <div style={S.empty}>
          <p style={{ fontSize: "40px", margin: "0 0 12px" }}>📢</p>
          <p style={{ color: "#6b7280" }}>No announcements yet. Make your first one!</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {announcements.map(ann => {
            const badge = targetLabel(ann)
            return (
              <div key={ann.id} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px", flexWrap: "wrap" }}>
                      <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#1a1a2e", margin: 0 }}>{ann.title}</h3>
                      <span style={{ backgroundColor: badge.bg, color: badge.color, padding: "2px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "600" }}>{badge.text}</span>
                    </div>
                    <p style={{ fontSize: "14px", color: "#374151", lineHeight: "1.6", margin: "0 0 8px" }}>{ann.message}</p>
                    <p style={{ fontSize: "12px", color: "#9ca3af", margin: 0 }}>{timeAgo(ann.created_at)}</p>
                  </div>
                  <button style={S.deleteBtn} onClick={() => setDeleteId(ann.id)}>🗑️</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#1a1a2e" }}>📢 New Announcement</h2>
              <button onClick={() => setShowModal(false)} style={S.closeBtn}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={S.label}>Title *</label>
                <input style={S.input} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Homework reminder" />
              </div>
              <div>
                <label style={S.label}>Message *</label>
                <textarea style={{ ...S.input, minHeight: "100px", resize: "vertical" }} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Write your announcement..." />
              </div>
              <div>
                <label style={S.label}>Send To</label>
                <select style={S.input} value={form.target_type} onChange={e => { setForm({ ...form, target_type: e.target.value, class_id: "", student_id: "" }); setStudentsInClass([]) }}>
                  <option value="all_my_classes">All My Classes</option>
                  <option value="class">Specific Class</option>
                  <option value="student">Specific Student</option>
                </select>
              </div>
              {(form.target_type === "class" || form.target_type === "student") && (
                <div>
                  <label style={S.label}>Select Class *</label>
                  <select style={S.input} value={form.class_id} onChange={e => handleClassChange(e.target.value)}>
                    <option value="">-- Select Class --</option>
                    {myClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}
              {form.target_type === "student" && form.class_id && (
                <div>
                  <label style={S.label}>Select Student *</label>
                  <select style={S.input} value={form.student_id} onChange={e => setForm({ ...form, student_id: e.target.value })}>
                    <option value="">-- Select Student --</option>
                    {studentsInClass.map(s => <option key={s.id} value={s.id}>{s.profiles?.name} ({s.roll_no})</option>)}
                  </select>
                </div>
              )}
            </div>
            {message && <p style={{ color: "#ef4444", fontSize: "13px", marginTop: "12px" }}>{message}</p>}
            <div style={{ display: "flex", gap: "10px", marginTop: "20px", justifyContent: "flex-end" }}>
              <button style={S.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
              <button style={S.saveBtn} onClick={handleSave} disabled={saving}>{saving ? "Sending..." : "Send Announcement"}</button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div style={S.overlay}>
          <div style={{ ...S.modal, maxWidth: "400px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "12px" }}>Delete Announcement?</h3>
            <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "20px" }}>This cannot be undone.</p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button style={S.cancelBtn} onClick={() => setDeleteId(null)}>Cancel</button>
              <button style={{ ...S.saveBtn, backgroundColor: "#ef4444" }} onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const S = {
  title: { fontSize: "24px", fontWeight: "700", color: "#1a1a2e", margin: 0 },
  addBtn: { padding: "10px 20px", backgroundColor: "#4f46e5", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "600" },
  card: { backgroundColor: "#fff", borderRadius: "12px", padding: "18px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" },
  deleteBtn: { background: "none", border: "none", cursor: "pointer", fontSize: "16px", color: "#ef4444", flexShrink: 0 },
  empty: { textAlign: "center", padding: "60px 0" },
  overlay: { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" },
  modal: { backgroundColor: "#fff", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "500px", maxHeight: "90vh", overflowY: "auto" },
  closeBtn: { background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#6b7280" },
  label: { fontSize: "13px", fontWeight: "600", color: "#374151", display: "block", marginBottom: "6px" },
  input: { width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "14px", outline: "none", boxSizing: "border-box" },
  cancelBtn: { padding: "10px 20px", backgroundColor: "#f3f4f6", color: "#374151", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "600" },
  saveBtn: { padding: "10px 20px", backgroundColor: "#4f46e5", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "600" },
}
