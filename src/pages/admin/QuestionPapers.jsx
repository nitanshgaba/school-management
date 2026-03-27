// src/pages/admin/QuestionPapers.jsx
import { useState, useEffect } from 'react'

export default function AdminQuestionPapers() {
  const [papers, setPapers] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [selClass, setSelClass] = useState('')
  const [selStatus, setSelStatus] = useState('')
  const [viewPaper, setViewPaper] = useState(null)

  useEffect(() => { loadAll() }, [])

  const sb = async () => { const { supabase } = await import('../../lib/supabase'); return supabase }

  const loadAll = async () => {
    setLoading(true)
    const s = await sb()
    const [{ data: p }, { data: c }] = await Promise.all([
      s.from('question_papers').select('*, profiles(name)').order('created_at', { ascending: false }),
      s.from('classes').select('*').order('name')
    ])
    setPapers(p || [])
    setClasses(c || [])
    setLoading(false)
  }

  const printPaper = (paper) => {
    const w = window.open('', '_blank')
    w.document.write(`
      <html><head><title>Question Paper</title><style>
        body { font-family: 'Times New Roman', serif; padding: 40px; max-width: 750px; margin: 0 auto; font-size: 14px; line-height: 1.6; }
        .header { text-align: center; border-bottom: 3px double #000; padding-bottom: 14px; margin-bottom: 20px; }
        h1 { margin: 0; font-size: 20px; } h2 { margin: 4px 0; font-size: 15px; font-weight: normal; }
        .meta { display: flex; justify-content: space-between; margin: 14px 0; font-size: 13px; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 8px; }
        .content { white-space: pre-wrap; font-size: 14px; line-height: 1.8; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      <div class="header">
        <h1>Sunrise Public School</h1>
        <h2>${paper.subject_name} — ${paper.exam_type}</h2>
        <h2>Class ${paper.class_id}</h2>
      </div>
      <div class="meta">
        <span>Time: ${paper.time_minutes} Minutes</span>
        <span>Max Marks: ${paper.total_marks}</span>
        <span>Date: ___________</span>
      </div>
      <div class="content">${paper.content.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
      <script>window.onload=()=>{window.print()}<\/script>
      </body></html>
    `)
    w.document.close()
  }

  const diffColor = d => ({ Easy:'#16a34a', Medium:'#f59e0b', Hard:'#ef4444', Mixed:'#6366f1' }[d] || '#64748b')

  const filtered = papers.filter(p => {
    const classMatch  = !selClass  || String(p.class_id) === selClass
    const statusMatch = !selStatus || p.status === selStatus
    return classMatch && statusMatch
  })

  const published = papers.filter(p=>p.status==='published').length
  const drafts    = papers.filter(p=>p.status==='draft').length

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h2 style={S.title}>📝 Question Papers</h2>
        <p style={S.sub}>All AI-generated question papers across school</p>
      </div>

      <div style={S.statsRow}>
        {[
          { label:'Total Papers', value:papers.length, color:'#6366f1', bg:'#eef2ff' },
          { label:'Published',    value:published,     color:'#16a34a', bg:'#f0fdf4' },
          { label:'Drafts',       value:drafts,        color:'#f59e0b', bg:'#fffbeb' },
        ].map(s=>(
          <div key={s.label} style={{...S.statCard, background:s.bg}}>
            <p style={{ margin:0, fontSize:'11px', color:'#6b7280', fontWeight:'700', textTransform:'uppercase' }}>{s.label}</p>
            <p style={{ margin:'4px 0 0', fontSize:'26px', fontWeight:'800', color:s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:'12px', marginBottom:'16px' }}>
        <select style={S.select} value={selClass} onChange={e=>setSelClass(e.target.value)}>
          <option value="">All Classes</option>
          {classes.map(c=><option key={c.id} value={c.id}>Class {c.name}</option>)}
        </select>
        <select style={S.select} value={selStatus} onChange={e=>setSelStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {loading ? <div style={S.empty}>Loading...</div> : filtered.length === 0 ? (
        <div style={S.empty}><span style={{fontSize:'40px'}}>📭</span><p>No papers found.</p></div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
          {filtered.map(p=>(
            <div key={p.id} style={S.paperCard}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'5px' }}>
                    <span style={{ fontWeight:'800', fontSize:'15px', color:'#1e293b' }}>{p.subject_name}</span>
                    <span style={{ background:`${diffColor(p.difficulty)}15`, color:diffColor(p.difficulty), padding:'2px 8px', borderRadius:'10px', fontSize:'11px', fontWeight:'700' }}>{p.difficulty}</span>
                    <span style={{ background:p.status==='published'?'#f0fdf4':'#f8fafc', color:p.status==='published'?'#16a34a':'#94a3b8', padding:'2px 8px', borderRadius:'10px', fontSize:'11px', fontWeight:'700' }}>
                      {p.status==='published'?'✅ Published':'📝 Draft'}
                    </span>
                  </div>
                  <p style={{ margin:0, fontSize:'13px', color:'#64748b' }}>
                    Class {p.class_id} · {p.exam_type} · {p.total_marks} marks · {p.time_minutes} mins · By {p.profiles?.name}
                  </p>
                  <p style={{ margin:'2px 0 0', fontSize:'12px', color:'#94a3b8' }}>{new Date(p.created_at).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</p>
                </div>
                <div style={{ display:'flex', gap:'8px' }}>
                  <button style={S.btnSm} onClick={()=>setViewPaper(p)}>👁️ View</button>
                  <button style={{...S.btnSm, background:'#f0fdf4', color:'#16a34a'}} onClick={()=>printPaper(p)}>🖨️ Print</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewPaper && (
        <div style={S.overlay} onClick={()=>setViewPaper(null)}>
          <div style={{...S.modal, maxHeight:'80vh', overflow:'auto'}} onClick={e=>e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
              <div>
                <h3 style={{ margin:0, fontSize:'18px', fontWeight:'800' }}>{viewPaper.subject_name} — {viewPaper.exam_type}</h3>
                <p style={{ margin:'3px 0 0', fontSize:'13px', color:'#64748b' }}>Class {viewPaper.class_id} · {viewPaper.total_marks} marks · By {viewPaper.profiles?.name}</p>
              </div>
              <div style={{ display:'flex', gap:'8px' }}>
                <button style={{...S.btnSm, background:'#f0fdf4', color:'#16a34a'}} onClick={()=>printPaper(viewPaper)}>🖨️ Print</button>
                <button style={S.btnSm} onClick={()=>setViewPaper(null)}>✕</button>
              </div>
            </div>
            <pre style={{ whiteSpace:'pre-wrap', fontFamily:'inherit', fontSize:'13px', lineHeight:1.8, color:'#1e293b', margin:0 }}>{viewPaper.content}</pre>
          </div>
        </div>
      )}
    </div>
  )
}

const S = {
  page:      { maxWidth:'900px', margin:'0 auto' },
  header:    { marginBottom:'20px' },
  title:     { margin:0, fontSize:'22px', fontWeight:'800', color:'#1e293b' },
  sub:       { margin:'4px 0 0', color:'#64748b', fontSize:'14px' },
  statsRow:  { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px', marginBottom:'20px' },
  statCard:  { borderRadius:'10px', padding:'16px', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' },
  select:    { padding:'9px 12px', borderRadius:'8px', border:'1px solid #e2e8f0', fontSize:'14px', background:'#fff', outline:'none' },
  paperCard: { background:'#fff', borderRadius:'12px', padding:'16px', boxShadow:'0 1px 4px rgba(0,0,0,0.07)' },
  btnSm:     { padding:'6px 12px', background:'#f1f5f9', color:'#374151', border:'none', borderRadius:'6px', fontSize:'12px', fontWeight:'600', cursor:'pointer' },
  empty:     { textAlign:'center', padding:'60px', color:'#94a3b8' },
  overlay:   { position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'20px' },
  modal:     { background:'#fff', borderRadius:'16px', padding:'28px', width:'100%', maxWidth:'700px', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' },
}
