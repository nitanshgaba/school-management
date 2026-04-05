// import { useState, useEffect } from 'react'
// import { supabase } from '../../lib/supabase'
// import { useAuth } from '../../context/AuthContext'

// export default function StudentAnnouncements() {
//   const { profile } = useAuth()
//   const [announcements, setAnnouncements] = useState([])
//   const [loading, setLoading] = useState(true)

//   useEffect(() => {
//     const fetch = async () => {
//       const { data: student } = await supabase.from("students").select("id, class_id").eq("id", profile.id).single()
//       if (!student) { setLoading(false); return }
//       const { data } = await supabase.from("announcements").select("*, profiles!announcements_teacher_id_fkey(name)").or(
//         "target_type.eq.all_my_classes,and(target_type.eq.class,class_id.eq." + student.class_id + "),and(target_type.eq.student,student_id.eq." + student.id + ")"
//       ).order("created_at", { ascending: false })
//       setAnnouncements(data || [])
//       setLoading(false)
//     }
//     fetch()
//   }, [])

//   const timeAgo = (ts) => {
//     const diff = Math.floor((Date.now() - new Date(ts)) / 1000)
//     if (diff < 60) return "Just now"
//     if (diff < 3600) return Math.floor(diff/60) + "m ago"
//     if (diff < 86400) return Math.floor(diff/3600) + "h ago"
//     return Math.floor(diff/86400) + "d ago"
//   }

//   return (
//     <div>
//       <h1 style={S.title}>Announcements</h1>
//       {loading ? <p style={{ color: "#9ca3af" }}>Loading...</p> : announcements.length === 0 ? (
//         <div style={S.empty}>
//           <p style={{ fontSize: "40px", margin: "0 0 12px" }}>📢</p>
//           <p style={{ color: "#6b7280" }}>No announcements yet.</p>
//         </div>
//       ) : (
//         <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
//           {announcements.map(ann => (
//             <div key={ann.id} style={S.card}>
//               <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
//                 <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#1a1a2e", margin: 0 }}>{ann.title}</h3>
//                 <span style={{ fontSize: "12px", color: "#9ca3af", whiteSpace: "nowrap", marginLeft: "12px" }}>{timeAgo(ann.created_at)}</span>
//               </div>
//               <p style={{ fontSize: "14px", color: "#374151", lineHeight: "1.6", margin: "0 0 10px" }}>{ann.message}</p>
//               <p style={{ fontSize: "12px", color: "#6b7280", margin: 0 }}>— {ann.profiles?.name || "Teacher"}</p>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   )
// }

// const S = {
//   title: { fontSize: "24px", fontWeight: "700", color: "#1a1a2e", marginBottom: "24px" },
//   card: { backgroundColor: "#fff", borderRadius: "12px", padding: "18px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", borderLeft: "4px solid #4f46e5" },
//   empty: { textAlign: "center", padding: "60px 0" },
// }


import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function StudentAnnouncements() {
  const { profile } = useAuth()
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const { data: student } = await supabase.from("students").select("id, class_id").eq('id', profile.id).single()
      if (!student) { setLoading(false); return }
      
      const { data } = await supabase.from("announcements")
        .select("*, profiles!announcements_teacher_id_fkey(name, avatar_url)")
        .or(
          "target_type.eq.all_my_classes,and(target_type.eq.class,class_id.eq." + student.class_id + "),and(target_type.eq.student,student_id.eq." + student.id + ")"
        )
        .order("created_at", { ascending: false })
        
      setAnnouncements(data || [])
      setLoading(false)
    }
    fetch()
  }, [profile.id])

  const timeAgo = (ts) => {
    const diff = Math.floor((Date.now() - new Date(ts)) / 1000)
    if (diff < 60) return "Just now"
    if (diff < 3600) return Math.floor(diff/60) + "m ago"
    if (diff < 86400) return Math.floor(diff/3600) + "h ago"
    return Math.floor(diff/86400) + "d ago"
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '100px', color: '#64748b' }}>⏳ Loading announcements...</div>

  return (
    <div style={styles.container}>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Announcements</h1>
        <p style={styles.pageSubtitle}>Latest updates from your teachers</p>
      </div>

      <div style={styles.feed}>
        {announcements.length === 0 ? (
          <div style={styles.emptyState}>No announcements for you yet.</div>
        ) : (
          announcements.map(ann => {
            const isPrivate = ann.target_type === 'student';
            return (
              <div key={ann.id} style={{ 
                ...styles.slimCard, 
                borderLeft: `4px solid ${isPrivate ? '#ef4444' : '#4f46e5'}` 
              }}>
                <div style={styles.cardTop}>
                  <div style={styles.authorSection}>
                    <div style={styles.miniAvatar}>
                      {ann.profiles?.name?.charAt(0).toUpperCase() || 'T'}
                    </div>
                    <span style={styles.authorName}>{ann.profiles?.name || 'Teacher'}</span>
                    <span style={styles.dot}>•</span>
                    <span style={styles.timeText}>{timeAgo(ann.created_at)}</span>
                  </div>
                  
                  <span style={{ 
                    ...styles.typeTag, 
                    backgroundColor: isPrivate ? '#fef2f2' : '#f0f9ff',
                    color: isPrivate ? '#dc2626' : '#0369a1'
                  }}>
                    {isPrivate ? '🔒 Direct' : '📢 ' + (ann.target_type === 'class' ? 'Class' : 'General')}
                  </span>
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
    </div>
  )
}

const styles = {
  container: { maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Inter, sans-serif' },
  pageHeader: { marginBottom: '24px' },
  pageTitle: { fontSize: '28px', fontWeight: '800', color: '#0f172a', margin: 0 },
  pageSubtitle: { fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' },
  
  feed: { display: 'flex', flexDirection: 'column', gap: '12px' },
  
  slimCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '16px 20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.1s ease',
    border: '1px solid #f1f5f9',
  },
  
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  
  authorSection: { display: 'flex', alignItems: 'center', gap: '8px' },
  miniAvatar: { 
    width: '24px', height: '24px', borderRadius: '6px', 
    backgroundColor: '#f1f5f9', color: '#475569', 
    fontSize: '12px', fontWeight: '700', 
    display: 'flex', alignItems: 'center', justifyContent: 'center' 
  },
  authorName: { fontSize: '13px', fontWeight: '700', color: '#334155' },
  dot: { color: '#cbd5e1', fontSize: '12px' },
  timeText: { fontSize: '12px', color: '#94a3b8' },
  
  typeTag: { 
    fontSize: '11px', fontWeight: '700', padding: '2px 8px', 
    borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '0.3px' 
  },
  
  contentSection: { paddingLeft: '32px' }, // Aligns with text after avatar
  annTitle: { fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' },
  annMessage: { fontSize: '14px', color: '#475569', lineHeight: '1.5', margin: 0 },
  
  emptyState: { textAlign: 'center', padding: '40px', color: '#94a3b8', border: '2px dashed #e2e8f0', borderRadius: '16px' }
}