import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function AdminEvents() {
  const { profile } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editEvent, setEditEvent] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [form, setForm] = useState({ title: "", description: "", event_date: "", event_time: "", venue: "", target: "all", color: "#4f46e5" })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  const fetchEvents = async () => {
    setLoading(true)
    const { data } = await supabase.from("events").select("*").order("event_date", { ascending: true })
    setEvents(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchEvents() }, [])

  const openAdd = () => {
    setEditEvent(null)
    setForm({ title: "", description: "", event_date: "", event_time: "", venue: "", target: "all", color: "#4f46e5" })
    setShowModal(true)
  }

  const openEdit = (ev) => {
    setEditEvent(ev)
    setForm({ title: ev.title, description: ev.description || "", event_date: ev.event_date, event_time: ev.event_time || "", venue: ev.venue || "", target: ev.target, color: ev.color || "#4f46e5" })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.title || !form.event_date) { setMessage("Title and date are required"); return }
    setSaving(true)
    setMessage("")
    const payload = { ...form, created_by: profile.id }
    let error
    if (editEvent) {
      ;({ error } = await supabase.from("events").update(payload).eq("id", editEvent.id))
    } else {
      ;({ error } = await supabase.from("events").insert(payload))
    }
    setSaving(false)
    if (error) { setMessage("Error: " + error.message); return }
    setShowModal(false)
    fetchEvents()
  }

  const handleDelete = async () => {
    await supabase.from("events").delete().eq("id", deleteId)
    setDeleteId(null)
    fetchEvents()
  }

  const now = new Date().toISOString().split("T")[0]
  const upcoming = events.filter(e => e.event_date >= now)
  const past = events.filter(e => e.event_date < now)

  const targetBadge = (t) => {
    const map = { all: ["#dbeafe", "#1d4ed8", "Everyone"], teachers: ["#fef9c3", "#92400e", "Teachers"], students: ["#dcfce7", "#166534", "Students"] }
    const [bg, color, label] = map[t] || map.all
    return <span style={{ backgroundColor: bg, color, padding: "2px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "600" }}>{label}</span>
  }

  const formatDate = (d) => d ? new Date(d + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" }) : "-"
  const formatTime = (t) => {
    if (!t) return ""
    const [h, m] = t.split(":")
    const hr = parseInt(h)
    return (hr > 12 ? hr - 12 : hr || 12) + ":" + m + " " + (hr >= 12 ? "PM" : "AM")
  }

  const COLORS = ["#4f46e5","#0ea5e9","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#14b8a6"]

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1 style={S.title}>Events</h1>
        <button style={S.addBtn} onClick={openAdd}>+ Create Event</button>
      </div>

      {loading ? <p style={{ color: "#9ca3af" }}>Loading...</p> : (
        <>
          {upcoming.length > 0 && (
            <div style={{ marginBottom: "32px" }}>
              <h2 style={S.sectionHead}>Upcoming Events</h2>
              <div style={S.grid}>
                {upcoming.map(ev => (
                  <div key={ev.id} style={{ ...S.card, borderTop: "4px solid " + (ev.color || "#4f46e5") }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                      <h3 style={S.cardTitle}>{ev.title}</h3>
                      {targetBadge(ev.target)}
                    </div>
                    {ev.description && <p style={S.cardDesc}>{ev.description}</p>}
                    <div style={S.cardMeta}>
                      <span>Date: {formatDate(ev.event_date)}</span>
                      {ev.event_time && <span>Time: {formatTime(ev.event_time)}</span>}
                      {ev.venue && <span>Venue: {ev.venue}</span>}
                    </div>
                    <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
                      <button style={S.editBtn} onClick={() => openEdit(ev)}>Edit</button>
                      <button style={S.deleteBtn} onClick={() => setDeleteId(ev.id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h2 style={S.sectionHead}>Past Events</h2>
              <div style={S.grid}>
                {past.map(ev => (
                  <div key={ev.id} style={{ ...S.card, opacity: 0.7, borderTop: "4px solid #9ca3af" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                      <h3 style={S.cardTitle}>{ev.title}</h3>
                      {targetBadge(ev.target)}
                    </div>
                    {ev.description && <p style={S.cardDesc}>{ev.description}</p>}
                    <div style={S.cardMeta}>
                      <span>Date: {formatDate(ev.event_date)}</span>
                      {ev.event_time && <span>Time: {formatTime(ev.event_time)}</span>}
                      {ev.venue && <span>Venue: {ev.venue}</span>}
                    </div>
                    <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
                      <button style={S.editBtn} onClick={() => openEdit(ev)}>Edit</button>
                      <button style={S.deleteBtn} onClick={() => setDeleteId(ev.id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {events.length === 0 && (
            <div style={S.empty}>
              <p style={{ color: "#6b7280", fontSize: "16px" }}>No events yet. Create your first event!</p>
            </div>
          )}
        </>
      )}

      {showModal && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#1a1a2e" }}>{editEvent ? "Edit Event" : "Create Event"}</h2>
              <button onClick={() => setShowModal(false)} style={S.closeBtn}>x</button>
            </div>
            <div style={S.formGrid}>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={S.label}>Event Title *</label>
                <input style={S.input} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Annual Sports Day" />
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={S.label}>Description</label>
                <textarea style={{ ...S.input, minHeight: "80px", resize: "vertical" }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Event details..." />
              </div>
              <div>
                <label style={S.label}>Date *</label>
                <input style={S.input} type="date" value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })} />
              </div>
              <div>
                <label style={S.label}>Time</label>
                <input style={S.input} type="time" value={form.event_time} onChange={e => setForm({ ...form, event_time: e.target.value })} />
              </div>
              <div>
                <label style={S.label}>Venue</label>
                <input style={S.input} value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })} placeholder="e.g. School Auditorium" />
              </div>
              <div>
                <label style={S.label}>Visible To</label>
                <select style={S.input} value={form.target} onChange={e => setForm({ ...form, target: e.target.value })}>
                  <option value="all">Everyone</option>
                  <option value="teachers">Teachers Only</option>
                  <option value="students">Students Only</option>
                </select>
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={S.label}>Card Color</label>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "6px" }}>
                  {COLORS.map(c => (
                    <div key={c} onClick={() => setForm({ ...form, color: c })} style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: c, cursor: "pointer", border: form.color === c ? "3px solid #1a1a2e" : "2px solid transparent" }} />
                  ))}
                </div>
              </div>
            </div>
            {message && <p style={{ color: "#ef4444", fontSize: "13px", marginTop: "12px" }}>{message}</p>}
            <div style={{ display: "flex", gap: "10px", marginTop: "20px", justifyContent: "flex-end" }}>
              <button style={S.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
              <button style={S.saveBtn} onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editEvent ? "Update" : "Create"}</button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div style={S.overlay}>
          <div style={{ ...S.modal, maxWidth: "400px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "12px" }}>Delete Event?</h3>
            <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "20px" }}>This action cannot be undone.</p>
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
  sectionHead: { fontSize: "15px", fontWeight: "700", color: "#374151", marginBottom: "14px", paddingBottom: "8px", borderBottom: "2px solid #f3f4f6" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" },
  card: { backgroundColor: "#fff", borderRadius: "12px", padding: "18px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" },
  cardTitle: { fontSize: "16px", fontWeight: "700", color: "#1a1a2e", margin: 0, flex: 1, marginRight: "10px" },
  cardDesc: { fontSize: "13px", color: "#6b7280", lineHeight: "1.5", marginBottom: "10px" },
  cardMeta: { display: "flex", flexDirection: "column", gap: "4px", fontSize: "13px", color: "#374151" },
  editBtn: { padding: "6px 14px", backgroundColor: "#f3f4f6", color: "#374151", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px" },
  deleteBtn: { padding: "6px 14px", backgroundColor: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px" },
  empty: { textAlign: "center", padding: "60px 0" },
  overlay: { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" },
  modal: { backgroundColor: "#fff", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "560px", maxHeight: "90vh", overflowY: "auto" },
  closeBtn: { background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#6b7280" },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
  label: { fontSize: "13px", fontWeight: "600", color: "#374151", display: "block", marginBottom: "6px" },
  input: { width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "14px", outline: "none", boxSizing: "border-box" },
  cancelBtn: { padding: "10px 20px", backgroundColor: "#f3f4f6", color: "#374151", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "600" },
  saveBtn: { padding: "10px 20px", backgroundColor: "#4f46e5", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "600" },
}
