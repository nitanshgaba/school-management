import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function StudentEvents() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("events").select("*").in("target", ["all", "students"]).order("event_date", { ascending: true })
      setEvents(data || [])
      setLoading(false)
    }
    fetch()
  }, [])

  const now = new Date().toISOString().split("T")[0]
  const upcoming = events.filter(e => e.event_date >= now)
  const past = events.filter(e => e.event_date < now)

  const formatDate = (d) => d ? new Date(d + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" }) : "-"
  
  const formatTime = (t) => {
    if (!t) return ""
    const [h, m] = t.split(":")
    const hr = parseInt(h)
    return (hr > 12 ? hr - 12 : hr || 12) + ":" + m + " " + (hr >= 12 ? "PM" : "AM")
  }

  const daysUntil = (d) => {
    const diff = Math.ceil((new Date(d + "T00:00:00") - new Date(now + "T00:00:00")) / (1000 * 60 * 60 * 24))
    if (diff === 0) return { label: "📍 Today", bg: "#fef3c7", color: "#d97706", border: "#fde68a" }
    if (diff === 1) return { label: "🌅 Tomorrow", bg: "#dcfce7", color: "#16a34a", border: "#bbf7d0" }
    return { label: `🗓️ In ${diff} days`, bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" }
  }

  const EventCard = ({ ev, isPast }) => {
    const badge = !isPast ? daysUntil(ev.event_date) : null
    return (
      <div key={ev.id} onClick={() => setSelected(ev)} style={{ 
        ...styles.card, 
        borderTop: `4px solid ${isPast ? "#cbd5e1" : (ev.color || "#4f46e5")}`,
        opacity: isPast ? 0.7 : 1,
      }}>
        <div style={styles.cardHeader}>
          <h3 style={{ ...styles.cardTitle, color: isPast ? '#64748b' : '#0f172a' }}>{ev.title}</h3>
          {badge && (
            <span style={{ 
              ...styles.badge, 
              backgroundColor: badge.bg, 
              color: badge.color, 
              border: `1px solid ${badge.border}` 
            }}>
              {badge.label}
            </span>
          )}
        </div>
        
        {ev.description && (
          <p style={styles.cardDesc}>
            {ev.description.length > 90 ? ev.description.slice(0, 90) + "..." : ev.description}
          </p>
        )}
        
        <div style={styles.cardMeta}>
          <div style={styles.metaItem}><span>📅</span> {formatDate(ev.event_date)}</div>
          {ev.event_time && <div style={styles.metaItem}><span>⏰</span> {formatTime(ev.event_time)}</div>}
          {ev.venue && <div style={styles.metaItem}><span>📍</span> {ev.venue}</div>}
        </div>

        <div style={{ ...styles.viewTag, color: ev.color || "#4f46e5" }}>
          View Details <span style={{ marginLeft: '4px' }}>→</span>
        </div>
      </div>
    )
  }

  if (loading) return (
    <div style={styles.loadingBox}>
      <div style={{ fontSize: '40px', marginBottom: '16px' }}>🎉</div>
      <div style={{ color: '#64748b', fontWeight: '600' }}>Loading school events...</div>
    </div>
  )

  return (
    <div style={styles.container}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Events & Calendar</h1>
          <p style={styles.pageSubtitle}>Stay updated with upcoming school activities and celebrations</p>
        </div>
      </div>

      <div style={styles.fadeIn}>
        {upcoming.length > 0 && (
          <div style={{ marginBottom: "40px" }}>
            <h2 style={styles.sectionHead}>📅 Upcoming Events ({upcoming.length})</h2>
            <div style={styles.grid}>
              {upcoming.map(ev => <EventCard key={ev.id} ev={ev} isPast={false} />)}
            </div>
          </div>
        )}

        {past.length > 0 && (
          <div>
            <h2 style={{ ...styles.sectionHead, color: '#94a3b8' }}>🕰️ Past Events</h2>
            <div style={styles.grid}>
              {past.map(ev => <EventCard key={ev.id} ev={ev} isPast={true} />)}
            </div>
          </div>
        )}

        {events.length === 0 && (
          <div style={styles.emptyState}>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>🎈</div>
            <h3 style={{ color: '#374151', margin: '0 0 8px 0' }}>No Events Found</h3>
            <p style={{ color: '#6b7280', margin: 0 }}>Check back later for new school activities!</p>
          </div>
        )}
      </div>

      {/* Modern Detail Modal */}
      {selected && (
        <div style={styles.overlay} onClick={() => setSelected(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={{ ...styles.modalHeader, borderTop: `6px solid ${selected.color || "#4f46e5"}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <h2 style={styles.modalTitle}>{selected.title}</h2>
                <button onClick={() => setSelected(null)} style={styles.closeBtn}>✕</button>
              </div>
            </div>

            <div style={styles.modalContent}>
              {selected.description && (
                <div style={styles.descBox}>
                  <p style={styles.boxLabel}>About this Event</p>
                  <p style={styles.boxText}>{selected.description}</p>
                </div>
              )}

              <div style={styles.infoGrid}>
                <div style={styles.infoCard}>
                  <p style={styles.boxLabel}>Date</p>
                  <p style={styles.infoValue}>{formatDate(selected.event_date)}</p>
                </div>
                {selected.event_time && (
                  <div style={styles.infoCard}>
                    <p style={styles.boxLabel}>Time</p>
                    <p style={styles.infoValue}>{formatTime(selected.event_time)}</p>
                  </div>
                )}
                {selected.venue && (
                  <div style={{ ...styles.infoCard, gridColumn: 'span 2' }}>
                    <p style={styles.boxLabel}>Location / Venue</p>
                    <p style={styles.infoValue}>📍 {selected.venue}</p>
                  </div>
                )}
              </div>

              {selected.event_date >= now && (
                <div style={{ 
                  ...styles.statusBox, 
                  backgroundColor: daysUntil(selected.event_date).bg, 
                  color: daysUntil(selected.event_date).color 
                }}>
                  ✨ {daysUntil(selected.event_date).label}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: { maxWidth: '1200px', margin: '0 auto', padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' },
  pageHeader: { marginBottom: '32px' },
  pageTitle: { fontSize: '32px', fontWeight: '800', color: '#111827', margin: '0 0 8px 0', letterSpacing: '-0.5px' },
  pageSubtitle: { fontSize: '15px', color: '#6b7280', margin: 0 },
  
  loadingBox: { textAlign: 'center', padding: '100px 0' },
  fadeIn: { animation: 'fadeIn 0.3s ease-in' },
  
  sectionHead: { fontSize: "18px", fontWeight: "800", color: "#1e293b", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" },
  
  card: { backgroundColor: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)", border: "1px solid #f1f5f9", cursor: "pointer", transition: "all 0.2s ease", position: 'relative' },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "12px" },
  cardTitle: { fontSize: "18px", fontWeight: "800", margin: 0, lineHeight: 1.3 },
  badge: { padding: "4px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "700", whiteSpace: "nowrap", textTransform: 'uppercase', letterSpacing: '0.5px' },
  
  cardDesc: { fontSize: "14px", color: "#64748b", lineHeight: "1.6", margin: "0 0 16px 0" },
  cardMeta: { display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px", color: "#475569", backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px' },
  metaItem: { display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' },
  
  viewTag: { marginTop: '16px', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center' },
  
  emptyState: { textAlign: "center", padding: "80px 20px", border: "2px dashed #e2e8f0", borderRadius: "20px", backgroundColor: "#fafaf9" },

  overlay: { position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.6)", backdropFilter: 'blur(6px)', display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" },
  modal: { backgroundColor: "#fff", borderRadius: "20px", width: "100%", maxWidth: "560px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" },
  modalHeader: { padding: "28px 28px 0" },
  modalTitle: { fontSize: "24px", fontWeight: "900", color: "#0f172a", margin: 0, flex: 1 },
  closeBtn: { background: "#f1f5f9", border: "none", width: '32px', height: '32px', borderRadius: '50%', fontSize: "14px", cursor: "pointer", color: "#64748b", fontWeight: '700' },
  
  modalContent: { padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' },
  descBox: { backgroundColor: "#f8fafc", borderRadius: "12px", padding: "20px", border: '1px solid #f1f5f9' },
  boxLabel: { fontSize: "11px", fontWeight: "800", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" },
  boxText: { fontSize: "15px", color: "#334155", lineHeight: "1.7", margin: 0 },
  
  infoGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
  infoCard: { backgroundColor: "#fff", border: '1px solid #e2e8f0', borderRadius: "12px", padding: "16px" },
  infoValue: { fontSize: "15px", fontWeight: "700", color: "#0f172a", margin: 0 },
  
  statusBox: { borderRadius: "12px", padding: "16px", textAlign: "center", fontSize: "16px", fontWeight: "800", border: '1px solid rgba(0,0,0,0.05)' }
}