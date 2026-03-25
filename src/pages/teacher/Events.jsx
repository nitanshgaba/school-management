import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function TeacherEvents() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("events").select("*").in("target", ["all", "teachers"]).order("event_date", { ascending: true })
      setEvents(data || [])
      setLoading(false)
    }
    fetch()
  }, [])

  const now = new Date().toISOString().split("T")[0]
  const upcoming = events.filter(e => e.event_date >= now)
  const past = events.filter(e => e.event_date < now)

  const formatDate = (d) => d ? new Date(d + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "-"
  const formatTime = (t) => {
    if (!t) return ""
    const [h, m] = t.split(":")
    const hr = parseInt(h)
    return (hr > 12 ? hr - 12 : hr || 12) + ":" + m + " " + (hr >= 12 ? "PM" : "AM")
  }
  const daysUntil = (d) => {
    const diff = Math.ceil((new Date(d + "T00:00:00") - new Date(now + "T00:00:00")) / (1000 * 60 * 60 * 24))
    if (diff === 0) return { label: "Today!", bg: "#fef9c3", color: "#92400e" }
    if (diff === 1) return { label: "Tomorrow", bg: "#dcfce7", color: "#166534" }
    return { label: "In " + diff + " days", bg: "#dbeafe", color: "#1d4ed8" }
  }

  const EventCard = ({ ev, isPast }) => {
    const badge = !isPast ? daysUntil(ev.event_date) : null
    return (
      <div onClick={() => setSelected(ev)} style={{ ...S.card, borderTop: "4px solid " + (isPast ? "#9ca3af" : (ev.color || "#4f46e5")), opacity: isPast ? 0.75 : 1, cursor: "pointer" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
          <h3 style={S.cardTitle}>{ev.title}</h3>
          {badge && <span style={{ backgroundColor: badge.bg, color: badge.color, padding: "2px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "600", whiteSpace: "nowrap" }}>{badge.label}</span>}
        </div>
        {ev.description && <p style={S.cardDesc}>{ev.description.length > 100 ? ev.description.slice(0, 100) + "..." : ev.description}</p>}
        <div style={S.cardMeta}>
          <span>Date: {formatDate(ev.event_date)}</span>
          {ev.event_time && <span>Time: {formatTime(ev.event_time)}</span>}
          {ev.venue && <span>Venue: {ev.venue}</span>}
        </div>
        <p style={{ fontSize: "12px", color: ev.color || "#4f46e5", fontWeight: "600", marginTop: "10px" }}>Tap to view details</p>
      </div>
    )
  }

  return (
    <div>
      <h1 style={S.title}>Events</h1>
      {loading ? <p style={{ color: "#9ca3af" }}>Loading...</p> : (
        <>
          {upcoming.length > 0 && (
            <div style={{ marginBottom: "32px" }}>
              <h2 style={S.sectionHead}>Upcoming Events ({upcoming.length})</h2>
              <div style={S.grid}>{upcoming.map(ev => <EventCard key={ev.id} ev={ev} isPast={false} />)}</div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h2 style={S.sectionHead}>Past Events</h2>
              <div style={S.grid}>{past.map(ev => <EventCard key={ev.id} ev={ev} isPast={true} />)}</div>
            </div>
          )}
          {events.length === 0 && <div style={S.empty}><p style={{ color: "#6b7280" }}>No events scheduled yet.</p></div>}
        </>
      )}
      {selected && (
        <div style={S.overlay} onClick={() => setSelected(null)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <div style={{ borderTop: "6px solid " + (selected.color || "#4f46e5"), borderRadius: "12px 12px 0 0", margin: "-28px -28px 24px", padding: "24px 28px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#1a1a2e", margin: 0, flex: 1, marginRight: "12px" }}>{selected.title}</h2>
                <button onClick={() => setSelected(null)} style={S.closeBtn}>x</button>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {selected.description && (
                <div style={{ backgroundColor: "#f9fafb", borderRadius: "8px", padding: "16px" }}>
                  <p style={{ fontSize: "13px", fontWeight: "600", color: "#9ca3af", textTransform: "uppercase", marginBottom: "6px" }}>About this Event</p>
                  <p style={{ fontSize: "14px", color: "#374151", lineHeight: "1.6", margin: 0 }}>{selected.description}</p>
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {[["Date", formatDate(selected.event_date)], selected.event_time ? ["Time", formatTime(selected.event_time)] : null, selected.venue ? ["Venue", selected.venue] : null].filter(Boolean).map(([label, value]) => (
                  <div key={label} style={{ backgroundColor: "#f9fafb", borderRadius: "8px", padding: "14px" }}>
                    <p style={{ fontSize: "12px", color: "#9ca3af", fontWeight: "600", textTransform: "uppercase", margin: "0 0 4px" }}>{label}</p>
                    <p style={{ fontSize: "14px", fontWeight: "700", color: "#1a1a2e", margin: 0 }}>{value}</p>
                  </div>
                ))}
              </div>
              {selected.event_date >= now && (
                <div style={{ backgroundColor: "#ede9fe", borderRadius: "8px", padding: "14px", textAlign: "center" }}>
                  {(() => { const b = daysUntil(selected.event_date); return <p style={{ fontSize: "15px", fontWeight: "700", color: "#4f46e5", margin: 0 }}>{b.label}</p> })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const S = {
  title: { fontSize: "24px", fontWeight: "700", color: "#1a1a2e", marginBottom: "24px" },
  sectionHead: { fontSize: "15px", fontWeight: "700", color: "#374151", marginBottom: "14px", paddingBottom: "8px", borderBottom: "2px solid #f3f4f6" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" },
  card: { backgroundColor: "#fff", borderRadius: "12px", padding: "18px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" },
  cardTitle: { fontSize: "16px", fontWeight: "700", color: "#1a1a2e", margin: 0, flex: 1, marginRight: "10px" },
  cardDesc: { fontSize: "13px", color: "#6b7280", lineHeight: "1.5", marginBottom: "10px" },
  cardMeta: { display: "flex", flexDirection: "column", gap: "4px", fontSize: "13px", color: "#374151" },
  empty: { textAlign: "center", padding: "60px 0" },
  overlay: { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" },
  modal: { backgroundColor: "#fff", borderRadius: "12px", padding: "28px", width: "100%", maxWidth: "500px", maxHeight: "90vh", overflowY: "auto" },
  closeBtn: { background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#6b7280" },
}
