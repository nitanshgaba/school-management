import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function StudentAnnouncements() {
  const { profile } = useAuth()
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const { data: student } = await supabase.from("students").select("id, class_id").eq("id", profile.id).single()
      if (!student) { setLoading(false); return }
      const { data } = await supabase.from("announcements").select("*, profiles!announcements_teacher_id_fkey(name)").or(
        "target_type.eq.all_my_classes,and(target_type.eq.class,class_id.eq." + student.class_id + "),and(target_type.eq.student,student_id.eq." + student.id + ")"
      ).order("created_at", { ascending: false })
      setAnnouncements(data || [])
      setLoading(false)
    }
    fetch()
  }, [])

  const timeAgo = (ts) => {
    const diff = Math.floor((Date.now() - new Date(ts)) / 1000)
    if (diff < 60) return "Just now"
    if (diff < 3600) return Math.floor(diff/60) + "m ago"
    if (diff < 86400) return Math.floor(diff/3600) + "h ago"
    return Math.floor(diff/86400) + "d ago"
  }

  return (
    <div>
      <h1 style={S.title}>Announcements</h1>
      {loading ? <p style={{ color: "#9ca3af" }}>Loading...</p> : announcements.length === 0 ? (
        <div style={S.empty}>
          <p style={{ fontSize: "40px", margin: "0 0 12px" }}>📢</p>
          <p style={{ color: "#6b7280" }}>No announcements yet.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {announcements.map(ann => (
            <div key={ann.id} style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#1a1a2e", margin: 0 }}>{ann.title}</h3>
                <span style={{ fontSize: "12px", color: "#9ca3af", whiteSpace: "nowrap", marginLeft: "12px" }}>{timeAgo(ann.created_at)}</span>
              </div>
              <p style={{ fontSize: "14px", color: "#374151", lineHeight: "1.6", margin: "0 0 10px" }}>{ann.message}</p>
              <p style={{ fontSize: "12px", color: "#6b7280", margin: 0 }}>— {ann.profiles?.name || "Teacher"}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const S = {
  title: { fontSize: "24px", fontWeight: "700", color: "#1a1a2e", marginBottom: "24px" },
  card: { backgroundColor: "#fff", borderRadius: "12px", padding: "18px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", borderLeft: "4px solid #4f46e5" },
  empty: { textAlign: "center", padding: "60px 0" },
}
