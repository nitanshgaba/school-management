// src/pages/student/QuestionPapers.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function StudentQuestionPapers() {
  const { profile } = useAuth()
  const [papers, setPapers] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewPaper, setViewPaper] = useState(null)

  useEffect(() => { loadPapers() }, [])

  const sb = async () => { const { supabase } = await import('../../lib/supabase'); return supabase }

  const loadPapers = async () => {
    setLoading(true)
    const s = await sb()
    const { data: student } = await s.from('students').select('class_id').eq('id', profile.id).single()
    if (!student) { setLoading(false); return }
    const { data } = await s.from('question_papers')
      .select('*, profiles(name)')
      .eq('class_id', student.class_id)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
    setPapers(data || [])
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

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h2 style={S.title}>📝 Question Papers</h2>
        <p style={S.sub}>Practice papers published by your teachers</p>
      </div>

      {loading ? <div style={S.empty}>Loading...</div> : papers.length === 0 ? (
        <div style={S.empty}><span style={{fontSize:'40px'}}>📭</span><p>No question papers published for your class yet.</p></div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
          {papers.map(p=>(
            <div key={p.id} style={S.card}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'6px' }}>
                    <span style={{ fontWeight:'800', fontSize:'16px', color:'#1e293b' }}>{p.subject_name}</span>
                    <span style={{ background:'#f0fdf4', color:'#16a34a', padding:'2px 8px', borderRadius:'10px', fontSize:'11px', fontWeight:'700' }}>📖 With Answers</span>
                    <span style={{ background:`${diffColor(p.difficulty)}15`, color:diffColor(p.difficulty), padding:'3px 10px', borderRadius:'12px', fontSize:'12px', fontWeight:'700' }}>{p.difficulty}</span>
                  </div>
                  <p style={{ margin:0, fontSize:'13px', color:'#64748b' }}>
                    {p.exam_type} · {p.total_marks} marks · {p.time_minutes} mins
                  </p>
                  <p style={{ margin:'3px 0 0', fontSize:'12px', color:'#94a3b8' }}>
                    By {p.profiles?.name} · {new Date(p.created_at).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}
                  </p>
                </div>
                <div style={{ display:'flex', gap:'8px' }}>
                  <button style={S.btnSm} onClick={()=>setViewPaper(p)}>👁️ View</button>
                  <button style={{...S.btnSm, background:'#eef2ff', color:'#6366f1'}} onClick={()=>printPaper(p)}>🖨️ Print</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewPaper && (
        <div style={S.overlay} onClick={()=>setViewPaper(null)}>
          <div style={{...S.modal, maxHeight:'80vh', overflow:'auto'}} onClick={e=>e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
              <div>
                <h3 style={{ margin:0, fontSize:'18px', fontWeight:'800' }}>{viewPaper.subject_name} — {viewPaper.exam_type}</h3>
                <p style={{ margin:'3px 0 0', fontSize:'13px', color:'#64748b' }}>{viewPaper.total_marks} marks · {viewPaper.time_minutes} mins</p>
              </div>
              <div style={{ display:'flex', gap:'8px' }}>
                <button style={{...S.btnSm, background:'#eef2ff', color:'#6366f1'}} onClick={()=>printPaper(viewPaper)}>🖨️ Print</button>
                <button style={S.btnSm} onClick={()=>setViewPaper(null)}>✕ Close</button>
              </div>
            </div>
            <div style={{ background:'#f0fdf4', border:'1px solid #86efac', borderRadius:'8px', padding:'10px 14px', marginBottom:'12px', fontSize:'13px', color:'#16a34a', fontWeight:'600' }}>✅ Answers included — use this for self-study after your exam</div>
            <pre style={{ whiteSpace:'pre-wrap', fontFamily:'inherit', fontSize:'13px', lineHeight:1.8, color:'#1e293b', margin:0 }}>{viewPaper.content}</pre>
          </div>
        </div>
      )}
    </div>
  )
}

const S = {
  page:    { maxWidth:'800px', margin:'0 auto' },
  header:  { marginBottom:'20px' },
  title:   { margin:0, fontSize:'22px', fontWeight:'800', color:'#1e293b' },
  sub:     { margin:'4px 0 0', color:'#64748b', fontSize:'14px' },
  card:    { background:'#fff', borderRadius:'12px', padding:'18px', boxShadow:'0 1px 4px rgba(0,0,0,0.07)' },
  btnSm:   { padding:'7px 14px', background:'#f1f5f9', color:'#374151', border:'none', borderRadius:'6px', fontSize:'12px', fontWeight:'600', cursor:'pointer' },
  empty:   { textAlign:'center', padding:'60px', color:'#94a3b8' },
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'20px' },
  modal:   { background:'#fff', borderRadius:'16px', padding:'28px', width:'100%', maxWidth:'700px', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' },
}
