
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
    const map = { 
      all: ["#eff6ff", "#2563eb", "#bfdbfe", "👥 Everyone"], 
      teachers: ["#f0fdf4", "#16a34a", "#bbf7d0", "👨‍🏫 Teachers"], 
      students: ["#fffbeb", "#d97706", "#fde68a", "👨‍🎓 Students"] 
    }
    const [bg, color, border, label] = map[t] || map.all
    return <span style={{ backgroundColor: bg, color, border: `1px solid ${border}`, padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", whiteSpace: "nowrap" }}>{label}</span>
  }

  const formatDate = (d) => d ? new Date(d + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" }) : "-"
  const formatTime = (t) => {
    if (!t) return ""
    const [h, m] = t.split(":")
    const hr = parseInt(h)
    return (hr > 12 ? hr - 12 : hr || 12) + ":" + m + " " + (hr >= 12 ? "PM" : "AM")
  }

  const COLORS = ["#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"]

  return (
    <div style={styles.container}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Events & Calendar</h1>
          <p style={styles.pageSubtitle}>Manage upcoming activities, holidays, and school gatherings</p>
        </div>
        <button style={styles.addBtn} onClick={openAdd}>＋ Create Event</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>⏳ Loading events...</div>
      ) : (
        <div style={styles.fadeIn}>
          {upcoming.length > 0 && (
            <div style={{ marginBottom: "40px" }}>
              <h2 style={styles.sectionHead}>📅 Upcoming Events</h2>
              <div style={styles.grid}>
                {upcoming.map(ev => (
                  <div key={ev.id} style={{ ...styles.card, borderTop: `4px solid ${ev.color || "#4f46e5"}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px", gap: "12px" }}>
                      <h3 style={styles.cardTitle}>{ev.title}</h3>
                      {targetBadge(ev.target)}
                    </div>
                    {ev.description && <p style={styles.cardDesc}>{ev.description}</p>}
                    
                    <div style={styles.cardMeta}>
                      <div style={styles.metaItem}>
                        <span style={styles.metaIcon}>📅</span>
                        <span>{formatDate(ev.event_date)}</span>
                      </div>
                      {ev.event_time && (
                        <div style={styles.metaItem}>
                          <span style={styles.metaIcon}>⏰</span>
                          <span>{formatTime(ev.event_time)}</span>
                        </div>
                      )}
                      {ev.venue && (
                        <div style={styles.metaItem}>
                          <span style={styles.metaIcon}>📍</span>
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.venue}</span>
                        </div>
                      )}
                    </div>
                    
                    <div style={styles.actionRow}>
                      <button style={styles.editBtn} onClick={() => openEdit(ev)}>✏️ Edit</button>
                      <button style={styles.deleteBtn} onClick={() => setDeleteId(ev.id)}>🗑️ Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <h2 style={styles.sectionHead}>🕰️ Past Events</h2>
              <div style={styles.grid}>
                {past.map(ev => (
                  <div key={ev.id} style={{ ...styles.card, opacity: 0.7, borderTop: "4px solid #cbd5e1" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px", gap: "12px" }}>
                      <h3 style={{ ...styles.cardTitle, color: '#475569' }}>{ev.title}</h3>
                      {targetBadge(ev.target)}
                    </div>
                    {ev.description && <p style={styles.cardDesc}>{ev.description}</p>}
                    
                    <div style={styles.cardMeta}>
                      <div style={styles.metaItem}>
                        <span style={styles.metaIcon}>📅</span>
                        <span>{formatDate(ev.event_date)}</span>
                      </div>
                      {ev.event_time && (
                        <div style={styles.metaItem}>
                          <span style={styles.metaIcon}>⏰</span>
                          <span>{formatTime(ev.event_time)}</span>
                        </div>
                      )}
                      {ev.venue && (
                        <div style={styles.metaItem}>
                          <span style={styles.metaIcon}>📍</span>
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.venue}</span>
                        </div>
                      )}
                    </div>
                    
                    <div style={styles.actionRow}>
                      <button style={styles.editBtn} onClick={() => openEdit(ev)}>✏️ Edit</button>
                      <button style={styles.deleteBtn} onClick={() => setDeleteId(ev.id)}>🗑️ Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {events.length === 0 && (
            <div style={styles.emptyState}>
              <div style={styles.emptyStateIcon}>🎉</div>
              <h3 style={{ color: '#374151', margin: '0 0 8px 0' }}>No Events Scheduled</h3>
              <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>Click "+ Create Event" to schedule your first activity.</p>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{editEvent ? "Edit Event" : "Create New Event"}</h2>
              <button onClick={() => setShowModal(false)} style={styles.closeBtn}>✕</button>
            </div>
            
            <div style={styles.formGrid}>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={styles.label}>Event Title <span style={{color: '#ef4444'}}>*</span></label>
                <input style={styles.input} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Annual Sports Day" />
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={styles.label}>Description</label>
                <textarea style={{ ...styles.input, minHeight: "100px", resize: "vertical" }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Event details, schedule, or instructions..." />
              </div>
              <div>
                <label style={styles.label}>Date <span style={{color: '#ef4444'}}>*</span></label>
                <input style={styles.input} type="date" value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })} />
              </div>
              <div>
                <label style={styles.label}>Time</label>
                <input style={styles.input} type="time" value={form.event_time} onChange={e => setForm({ ...form, event_time: e.target.value })} />
              </div>
              <div>
                <label style={styles.label}>Venue</label>
                <input style={styles.input} value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })} placeholder="e.g. School Auditorium" />
              </div>
              <div>
                <label style={styles.label}>Visible To</label>
                <select style={styles.input} value={form.target} onChange={e => setForm({ ...form, target: e.target.value })}>
                  <option value="all">👥 Everyone</option>
                  <option value="teachers">👨‍🏫 Teachers Only</option>
                  <option value="students">👨‍🎓 Students Only</option>
                </select>
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={styles.label}>Card Color</label>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "8px" }}>
                  {COLORS.map(c => (
                    <div 
                      key={c} 
                      onClick={() => setForm({ ...form, color: c })} 
                      style={{ 
                        width: "32px", height: "32px", borderRadius: "50%", backgroundColor: c, cursor: "pointer", 
                        border: form.color === c ? `3px solid #fff` : "3px solid transparent",
                        boxShadow: form.color === c ? `0 0 0 2px ${c}` : '0 1px 2px rgba(0,0,0,0.1)',
                        transition: 'all 0.2s ease'
                      }} 
                    />
                  ))}
                </div>
              </div>
            </div>
            
            {message && (
              <div style={styles.alertBox}>
                {message}
              </div>
            )}
            
            <div style={styles.formButtons}>
              <button style={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
              <button style={styles.saveBtn} onClick={handleSave} disabled={saving}>
                {saving ? "⏳ Saving..." : editEvent ? "💾 Update Event" : "＋ Create Event"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modal, maxWidth: "400px", padding: '32px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h3 style={{ fontSize: "20px", fontWeight: "800", color: '#0f172a', margin: '0 0 8px 0' }}>Delete Event?</h3>
            <p style={{ color: "#64748b", fontSize: "14px", margin: '0 0 24px 0', lineHeight: 1.5 }}>
              Are you sure you want to remove this event? This action cannot be undone and will remove it from all calendars.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button style={styles.cancelBtn} onClick={() => setDeleteId(null)}>Cancel</button>
              <button style={{ ...styles.saveBtn, backgroundColor: "#ef4444", boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.3)' }} onClick={handleDelete}>
                🗑️ Delete Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── STYLES ────────────────────────────────────────────────
const styles = {
  container: { maxWidth: '1100px', margin: '0 auto', padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' },
  pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px", flexWrap: 'wrap', gap: '16px' },
  pageTitle: { fontSize: '32px', fontWeight: '800', color: '#111827', margin: '0 0 8px 0', letterSpacing: '-0.5px' },
  pageSubtitle: { fontSize: '15px', color: '#6b7280', margin: 0 },
  addBtn: { padding: '10px 20px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)', transition: 'background-color 0.2s' },
  
  fadeIn: { opacity: 1, transition: 'opacity 0.3s ease-in' },
  
  sectionHead: { fontSize: "18px", fontWeight: "700", color: "#1e293b", margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: "8px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" },
  
  card: { backgroundColor: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)", border: "1px solid #f1f5f9", display: 'flex', flexDirection: 'column', transition: 'box-shadow 0.2s, transform 0.2s' },
  cardTitle: { fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: 0, lineHeight: 1.3 },
  cardDesc: { fontSize: "14px", color: "#475569", lineHeight: "1.6", margin: "0 0 16px 0", flex: 1 },
  
  cardMeta: { display: "flex", flexDirection: "column", gap: "8px", padding: "12px 16px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #f1f5f9", marginBottom: "16px" },
  metaItem: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#334155', fontWeight: '500' },
  metaIcon: { fontSize: '14px', opacity: 0.8 },
  
  actionRow: { display: "flex", gap: "8px", justifyContent: "flex-end", borderTop: "1px solid #f1f5f9", paddingTop: "16px", marginTop: "auto" },
  editBtn: { padding: '6px 16px', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all 0.2s' },
  deleteBtn: { padding: '6px 16px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all 0.2s' },
  
  emptyState: { textAlign: 'center', padding: '60px 20px', border: '2px dashed #e2e8f0', borderRadius: '12px', backgroundColor: '#fafaf9', marginTop: '16px' },
  emptyStateIcon: { fontSize: '56px', marginBottom: '16px', opacity: 0.8 },
  
  modalOverlay: { position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, backdropFilter: "blur(4px)", padding: "20px" },
  modal: { backgroundColor: "#fff", borderRadius: "16px", padding: "32px", width: "100%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" },
  modalTitle: { margin: 0, fontSize: "22px", fontWeight: "800", color: "#0f172a" },
  closeBtn: { background: "none", border: "none", fontSize: "16px", cursor: "pointer", color: "#64748b", padding: "4px" },
  
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" },
  label: { fontSize: "13px", fontWeight: "600", color: "#475569", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" },
  input: { width: "100%", padding: "12px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none", boxSizing: "border-box", color: "#1e293b", transition: "border-color 0.2s" },
  
  alertBox: { padding: '12px 16px', borderRadius: '8px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: '14px', fontWeight: '500', marginTop: '20px' },
  
  formButtons: { display: "flex", gap: "12px", marginTop: "32px", justifyContent: "flex-end", borderTop: "1px solid #f1f5f9", paddingTop: "24px" },
  cancelBtn: { padding: "12px 24px", backgroundColor: "#fff", color: "#475569", border: "1px solid #cbd5e1", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "600", transition: "all 0.2s", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" },
  saveBtn: { padding: "12px 32px", backgroundColor: "#2563eb", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "600", transition: "all 0.2s", boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.3)" },
}