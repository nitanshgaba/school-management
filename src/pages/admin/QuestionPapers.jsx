// // src/pages/admin/QuestionPapers.jsx
// import { useState, useEffect } from 'react'

// export default function AdminQuestionPapers() {
//   const [papers, setPapers] = useState([])
//   const [classes, setClasses] = useState([])
//   const [loading, setLoading] = useState(true)
//   const [selClass, setSelClass] = useState('')
//   const [selStatus, setSelStatus] = useState('')
//   const [viewPaper, setViewPaper] = useState(null)

//   useEffect(() => { loadAll() }, [])

//   const sb = async () => { const { supabase } = await import('../../lib/supabase'); return supabase }

//   const loadAll = async () => {
//     setLoading(true)
//     const s = await sb()
//     const [{ data: p }, { data: c }] = await Promise.all([
//       s.from('question_papers').select('*, profiles(name)').order('created_at', { ascending: false }),
//       s.from('classes').select('*').order('name')
//     ])
//     setPapers(p || [])
//     setClasses(c || [])
//     setLoading(false)
//   }

//   const printPaper = (paper) => {
//     const w = window.open('', '_blank')
//     w.document.write(`
//       <html><head><title>Question Paper</title><style>
//         body { font-family: 'Times New Roman', serif; padding: 40px; max-width: 750px; margin: 0 auto; font-size: 14px; line-height: 1.6; }
//         .header { text-align: center; border-bottom: 3px double #000; padding-bottom: 14px; margin-bottom: 20px; }
//         h1 { margin: 0; font-size: 20px; } h2 { margin: 4px 0; font-size: 15px; font-weight: normal; }
//         .meta { display: flex; justify-content: space-between; margin: 14px 0; font-size: 13px; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 8px; }
//         .content { white-space: pre-wrap; font-size: 14px; line-height: 1.8; }
//         @media print { body { padding: 20px; } }
//       </style></head><body>
//       <div class="header">
//         <h1>Sunrise Public School</h1>
//         <h2>${paper.subject_name} — ${paper.exam_type}</h2>
//         <h2>Class ${paper.class_id}</h2>
//       </div>
//       <div class="meta">
//         <span>Time: ${paper.time_minutes} Minutes</span>
//         <span>Max Marks: ${paper.total_marks}</span>
//         <span>Date: ___________</span>
//       </div>
//       <div class="content">${paper.content.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
//       <script>window.onload=()=>{window.print()}<\/script>
//       </body></html>
//     `)
//     w.document.close()
//   }

//   const diffColor = d => ({ Easy:'#16a34a', Medium:'#f59e0b', Hard:'#ef4444', Mixed:'#6366f1' }[d] || '#64748b')

//   const filtered = papers.filter(p => {
//     const classMatch  = !selClass  || String(p.class_id) === selClass
//     const statusMatch = !selStatus || p.status === selStatus
//     return classMatch && statusMatch
//   })

//   const published = papers.filter(p=>p.status==='published').length
//   const drafts    = papers.filter(p=>p.status==='draft').length

//   return (
//     <div style={S.page}>
//       <div style={S.header}>
//         <h2 style={S.title}>📝 Question Papers</h2>
//         <p style={S.sub}>All AI-generated question papers across school</p>
//       </div>

//       <div style={S.statsRow}>
//         {[
//           { label:'Total Papers', value:papers.length, color:'#6366f1', bg:'#eef2ff' },
//           { label:'Published',    value:published,     color:'#16a34a', bg:'#f0fdf4' },
//           { label:'Drafts',       value:drafts,        color:'#f59e0b', bg:'#fffbeb' },
//         ].map(s=>(
//           <div key={s.label} style={{...S.statCard, background:s.bg}}>
//             <p style={{ margin:0, fontSize:'11px', color:'#6b7280', fontWeight:'700', textTransform:'uppercase' }}>{s.label}</p>
//             <p style={{ margin:'4px 0 0', fontSize:'26px', fontWeight:'800', color:s.color }}>{s.value}</p>
//           </div>
//         ))}
//       </div>

//       <div style={{ display:'flex', gap:'12px', marginBottom:'16px' }}>
//         <select style={S.select} value={selClass} onChange={e=>setSelClass(e.target.value)}>
//           <option value="">All Classes</option>
//           {classes.map(c=><option key={c.id} value={c.id}>Class {c.name}</option>)}
//         </select>
//         <select style={S.select} value={selStatus} onChange={e=>setSelStatus(e.target.value)}>
//           <option value="">All Status</option>
//           <option value="published">Published</option>
//           <option value="draft">Draft</option>
//         </select>
//       </div>

//       {loading ? <div style={S.empty}>Loading...</div> : filtered.length === 0 ? (
//         <div style={S.empty}><span style={{fontSize:'40px'}}>📭</span><p>No papers found.</p></div>
//       ) : (
//         <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
//           {filtered.map(p=>(
//             <div key={p.id} style={S.paperCard}>
//               <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
//                 <div>
//                   <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'5px' }}>
//                     <span style={{ fontWeight:'800', fontSize:'15px', color:'#1e293b' }}>{p.subject_name}</span>
//                     <span style={{ background:`${diffColor(p.difficulty)}15`, color:diffColor(p.difficulty), padding:'2px 8px', borderRadius:'10px', fontSize:'11px', fontWeight:'700' }}>{p.difficulty}</span>
//                     <span style={{ background:p.status==='published'?'#f0fdf4':'#f8fafc', color:p.status==='published'?'#16a34a':'#94a3b8', padding:'2px 8px', borderRadius:'10px', fontSize:'11px', fontWeight:'700' }}>
//                       {p.status==='published'?'✅ Published':'📝 Draft'}
//                     </span>
//                   </div>
//                   <p style={{ margin:0, fontSize:'13px', color:'#64748b' }}>
//                     Class {p.class_id} · {p.exam_type} · {p.total_marks} marks · {p.time_minutes} mins · By {p.profiles?.name}
//                   </p>
//                   <p style={{ margin:'2px 0 0', fontSize:'12px', color:'#94a3b8' }}>{new Date(p.created_at).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</p>
//                 </div>
//                 <div style={{ display:'flex', gap:'8px' }}>
//                   <button style={S.btnSm} onClick={()=>setViewPaper(p)}>👁️ View</button>
//                   <button style={{...S.btnSm, background:'#f0fdf4', color:'#16a34a'}} onClick={()=>printPaper(p)}>🖨️ Print</button>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}

//       {viewPaper && (
//         <div style={S.overlay} onClick={()=>setViewPaper(null)}>
//           <div style={{...S.modal, maxHeight:'80vh', overflow:'auto'}} onClick={e=>e.stopPropagation()}>
//             <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
//               <div>
//                 <h3 style={{ margin:0, fontSize:'18px', fontWeight:'800' }}>{viewPaper.subject_name} — {viewPaper.exam_type}</h3>
//                 <p style={{ margin:'3px 0 0', fontSize:'13px', color:'#64748b' }}>Class {viewPaper.class_id} · {viewPaper.total_marks} marks · By {viewPaper.profiles?.name}</p>
//               </div>
//               <div style={{ display:'flex', gap:'8px' }}>
//                 <button style={{...S.btnSm, background:'#f0fdf4', color:'#16a34a'}} onClick={()=>printPaper(viewPaper)}>🖨️ Print</button>
//                 <button style={S.btnSm} onClick={()=>setViewPaper(null)}>✕</button>
//               </div>
//             </div>
//             <pre style={{ whiteSpace:'pre-wrap', fontFamily:'inherit', fontSize:'13px', lineHeight:1.8, color:'#1e293b', margin:0 }}>{viewPaper.content}</pre>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

// const S = {
//   page:      { maxWidth:'900px', margin:'0 auto' },
//   header:    { marginBottom:'20px' },
//   title:     { margin:0, fontSize:'22px', fontWeight:'800', color:'#1e293b' },
//   sub:       { margin:'4px 0 0', color:'#64748b', fontSize:'14px' },
//   statsRow:  { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px', marginBottom:'20px' },
//   statCard:  { borderRadius:'10px', padding:'16px', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' },
//   select:    { padding:'9px 12px', borderRadius:'8px', border:'1px solid #e2e8f0', fontSize:'14px', background:'#fff', outline:'none' },
//   paperCard: { background:'#fff', borderRadius:'12px', padding:'16px', boxShadow:'0 1px 4px rgba(0,0,0,0.07)' },
//   btnSm:     { padding:'6px 12px', background:'#f1f5f9', color:'#374151', border:'none', borderRadius:'6px', fontSize:'12px', fontWeight:'600', cursor:'pointer' },
//   empty:     { textAlign:'center', padding:'60px', color:'#94a3b8' },
//   overlay:   { position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'20px' },
//   modal:     { background:'#fff', borderRadius:'16px', padding:'28px', width:'100%', maxWidth:'700px', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' },
// }


import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { getSchoolSettings } from '../../lib/schoolSettings'

export default function AdminQuestionPapers() {
  const [papers, setPapers] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [selClass, setSelClass] = useState('')
  const [selStatus, setSelStatus] = useState('')
  const [viewPaper, setViewPaper] = useState(null)
  const [schoolName, setSchoolName] = useState('School ERP System')

  useEffect(() => {
    loadAll()
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await getSchoolSettings()
      let settings = response?.data || response
      if (Array.isArray(settings)) settings = settings[0]

      if (settings) {
        const validName = settings.school_name || settings.schoolName || settings.name || settings.school_title
        if (validName) setSchoolName(validName)
      }
    } catch (err) {
      console.error('Failed to fetch school settings', err)
    }
  }

  const loadAll = async () => {
    setLoading(true)
    const [{ data: p }, { data: c }] = await Promise.all([
      supabase.from('question_papers').select('*, profiles(name)').order('created_at', { ascending: false }),
      supabase.from('classes').select('*').order('name')
    ])
    setPapers(p || [])
    setClasses(c || [])
    setLoading(false)
  }

  const printPaper = (paper) => {
    const w = window.open('', '_blank')
    w.document.write(`
      <html>
      <head>
        <title>${paper.subject_name} - Question Paper</title>
        <style>
          body { font-family: 'Times New Roman', serif; padding: 40px; max-width: 800px; margin: 0 auto; font-size: 14px; line-height: 1.6; color: #000; }
          .header { text-align: center; border-bottom: 3px double #000; padding-bottom: 20px; margin-bottom: 24px; }
          h1 { margin: 0 0 8px 0; font-size: 24px; text-transform: uppercase; letter-spacing: 1px; }
          h2 { margin: 4px 0; font-size: 16px; font-weight: bold; text-transform: uppercase; }
          .meta { display: flex; justify-content: space-between; margin: 20px 0; font-size: 14px; font-weight: bold; padding-bottom: 12px; border-bottom: 1px solid #000; }
          .content { white-space: pre-wrap; font-size: 15px; line-height: 1.8; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${schoolName}</h1>
          <h2>${paper.exam_type || 'Examination'}</h2>
          <h2>Subject: ${paper.subject_name} &nbsp;|&nbsp; Class: ${paper.class_id}</h2>
        </div>
        <div class="meta">
          <span>Time Allowed: ${paper.time_minutes} Minutes</span>
          <span>Maximum Marks: ${paper.total_marks}</span>
        </div>
        <div class="content">${paper.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
        <script>window.onload=()=>{window.print()}<\/script>
      </body>
      </html>
    `)
    w.document.close()
  }

  const getDiffStyles = (diff) => {
    const map = {
      'Easy': { bg: '#dcfce7', color: '#16a34a', border: '#bbf7d0' },
      'Medium': { bg: '#fef3c7', color: '#d97706', border: '#fde68a' },
      'Hard': { bg: '#fee2e2', color: '#dc2626', border: '#fecaca' },
      'Mixed': { bg: '#e0e7ff', color: '#4f46e5', border: '#c7d2fe' }
    }
    return map[diff] || { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' }
  }

  const filtered = papers.filter(p => {
    const classMatch = !selClass || String(p.class_id) === selClass
    const statusMatch = !selStatus || p.status === selStatus
    return classMatch && statusMatch
  })

  const published = papers.filter(p => p.status === 'published').length
  const drafts = papers.filter(p => p.status === 'draft').length

  return (
    <div style={styles.container}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Question Papers</h1>
          <p style={styles.pageSubtitle}>Manage and print AI-generated examination papers</p>
        </div>
      </div>

      {/* Stats Row */}
      <div style={styles.statsRow}>
        {[
          { label: 'Total Papers', value: papers.length, color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
          { label: 'Published', value: published, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
          { label: 'Drafts', value: drafts, color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
        ].map(s => (
          <div key={s.label} style={{ ...styles.statCard, backgroundColor: s.bg, border: `1px solid ${s.border}` }}>
            <p style={styles.statLabel}>{s.label}</p>
            <p style={{ ...styles.statValue, color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h2 style={styles.sectionTitle}>🎯 Filter Papers</h2>
        </div>

        <div style={styles.filterBox}>
          <div style={styles.filterRow}>
            <div style={styles.filterGroup}>
              <label style={styles.label}>Class</label>
              <select style={styles.input} value={selClass} onChange={e => setSelClass(e.target.value)}>
                <option value="">-- All Classes --</option>
                {classes.map(c => <option key={c.id} value={c.id}>Class {c.name}</option>)}
              </select>
            </div>
            <div style={styles.filterGroup}>
              <label style={styles.label}>Status</label>
              <select style={styles.input} value={selStatus} onChange={e => setSelStatus(e.target.value)}>
                <option value="">-- All Statuses --</option>
                <option value="published">✅ Published</option>
                <option value="draft">📝 Draft</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>⏳ Loading papers...</div>
        ) : filtered.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyStateIcon}>📭</div>
            <h3 style={{ color: '#374151', margin: '0 0 8px 0' }}>No Papers Found</h3>
            <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>No question papers match the selected filters.</p>
          </div>
        ) : (
          <div style={styles.fadeIn}>
            <div style={styles.tableTopHeader}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', margin: 0 }}>
                📋 Examination Papers
              </h3>
            </div>
            
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Subject & Exam</th>
                    <th style={styles.th}>Class</th>
                    <th style={styles.th}>Details</th>
                    <th style={styles.th}>Status</th>
                    <th style={{ ...styles.th, textAlign: 'right', paddingRight: '24px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => {
                    const diff = getDiffStyles(p.difficulty)
                    return (
                      <tr key={p.id} style={styles.tr}>
                        <td style={styles.td}>
                          <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '15px' }}>{p.subject_name}</div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', fontWeight: '600' }}>{p.exam_type}</div>
                        </td>
                        <td style={styles.td}>
                          <span style={styles.classBadge}>Class {p.class_id}</span>
                        </td>
                        <td style={styles.td}>
                          <div style={{ fontSize: '13px', color: '#334155', fontWeight: '500' }}>
                            {p.total_marks} Marks &nbsp;|&nbsp; {p.time_minutes} Mins
                          </div>
                          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                            By {p.profiles?.name} on {new Date(p.created_at).toLocaleDateString('en-IN')}
                          </div>
                        </td>
                        <td style={styles.td}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                            <span style={{ 
                              backgroundColor: p.status === 'published' ? '#dcfce7' : '#f1f5f9', 
                              color: p.status === 'published' ? '#16a34a' : '#475569', 
                              padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', border: p.status === 'published' ? '1px solid #bbf7d0' : '1px solid #e2e8f0' 
                            }}>
                              {p.status === 'published' ? '✅ Published' : '📝 Draft'}
                            </span>
                            <span style={{ backgroundColor: diff.bg, color: diff.color, border: `1px solid ${diff.border}`, padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>
                              {p.difficulty}
                            </span>
                          </div>
                        </td>
                        <td style={{ ...styles.td, textAlign: 'right', paddingRight: '20px' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button style={styles.viewBtn} onClick={() => setViewPaper(p)}>👁️ View</button>
                            <button style={styles.printBtn} onClick={() => printPaper(p)}>🖨️ Print</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* View Paper Modal */}
      {viewPaper && (
        <div style={styles.modalOverlay} onClick={() => setViewPaper(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={styles.modalTitle}>{viewPaper.subject_name} — {viewPaper.exam_type}</h3>
                <p style={styles.modalSubtitle}>Class {viewPaper.class_id} &nbsp;|&nbsp; {viewPaper.total_marks} Marks &nbsp;|&nbsp; Created by {viewPaper.profiles?.name}</p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button style={{ ...styles.printBtn, padding: '8px 16px' }} onClick={() => printPaper(viewPaper)}>🖨️ Print</button>
                <button style={styles.closeBtn} onClick={() => setViewPaper(null)}>✕</button>
              </div>
            </div>
            <div style={styles.modalBody}>
              <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '14px', lineHeight: 1.8, color: '#1e293b', margin: 0 }}>
                {viewPaper.content}
              </pre>
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
  pageHeader: { marginBottom: '24px' },
  pageTitle: { fontSize: '32px', fontWeight: '800', color: '#111827', margin: '0 0 8px 0', letterSpacing: '-0.5px' },
  pageSubtitle: { fontSize: '15px', color: '#6b7280', margin: 0 },
  
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' },
  statCard: { borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', textAlign: 'left' },
  statLabel: { margin: 0, fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' },
  statValue: { margin: '8px 0 0', fontSize: '32px', fontWeight: '800', lineHeight: 1 },
  
  card: { backgroundColor: '#fff', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', border: '1px solid #f3f4f6' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  sectionTitle: { fontSize: '18px', fontWeight: '700', color: '#1f2937', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' },
  
  filterBox: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '24px' },
  filterRow: { display: 'flex', gap: '20px', alignItems: 'flex-end', flexWrap: 'wrap' },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: '8px', flex: '1', minWidth: '200px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', backgroundColor: '#fff', color: '#1e293b', transition: 'border-color 0.2s', width: '100%', cursor: 'pointer' },
  
  fadeIn: { opacity: 1, transition: 'opacity 0.3s ease-in' },
  
  tableTopHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '0 4px' },
  tableWrapper: { borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff' },
  th: { textAlign: 'left', fontSize: '12px', color: '#64748b', fontWeight: '700', padding: '16px 20px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textTransform: 'uppercase', letterSpacing: '0.5px' },
  tr: { borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s ease' },
  td: { padding: '16px 20px', fontSize: '14px', color: '#1e293b', verticalAlign: 'middle' },
  
  classBadge: { backgroundColor: '#eff6ff', color: '#2563eb', padding: '4px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '700', border: '1px solid #bfdbfe' },
  
  viewBtn: { padding: '6px 12px', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all 0.2s' },
  printBtn: { padding: '6px 12px', backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all 0.2s' },
  
  emptyState: { textAlign: 'center', padding: '60px 20px', border: '2px dashed #e2e8f0', borderRadius: '12px', backgroundColor: '#fafaf9', marginTop: '16px' },
  emptyStateIcon: { fontSize: '56px', marginBottom: '16px', opacity: 0.8 },
  
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, backdropFilter: 'blur(6px)', padding: '20px' },
  modal: { backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', maxHeight: '90vh', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '24px 32px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', borderRadius: '16px 16px 0 0' },
  modalTitle: { margin: 0, fontSize: '20px', fontWeight: '800', color: '#0f172a' },
  modalSubtitle: { margin: '6px 0 0', fontSize: '13px', color: '#64748b', fontWeight: '500' },
  closeBtn: { padding: '8px 12px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '700' },
  modalBody: { padding: '32px', overflowY: 'auto', flex: 1, backgroundColor: '#fff', borderRadius: '0 0 16px 16px' }
}