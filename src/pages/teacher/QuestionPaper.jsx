// src/pages/teacher/QuestionPaper.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'

const GROQ_MODEL = 'llama-3.3-70b-versatile'

export default function QuestionPaper() {
  const { profile } = useAuth()
  const [tab, setTab] = useState('generate')
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [papers, setPapers] = useState([])
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [generatedContent, setGeneratedContent] = useState('')
  const [viewPaper, setViewPaper] = useState(null)
  const [form, setForm] = useState({
    class_id: '', subject_id: '', subject_name: '',
    exam_type: 'Unit Test', difficulty: 'Mixed',
    total_marks: 50, time_mode: 'auto',
    time_minutes: 50,
    mcq_count: 10, tf_count: 5, short_count: 4, long_count: 2,
    topic: ''
  })

  useEffect(() => { loadClasses(); loadPapers() }, [])
  useEffect(() => { if (form.class_id) loadSubjects(form.class_id) }, [form.class_id])
  useEffect(() => {
    if (form.time_mode === 'auto') {
      setForm(f => ({ ...f, time_minutes: f.total_marks }))
    }
  }, [form.total_marks, form.time_mode])

  const sb = async () => { const { supabase } = await import('../../lib/supabase'); return supabase }

  const loadClasses = async () => {
    const s = await sb()
    const { data } = await s.from('teacher_classes').select('class_id, classes(name)').eq('teacher_id', profile.id)
    setClasses(data || [])
  }

  const loadSubjects = async (classId) => {
    const s = await sb()
    const { data } = await s.from('subjects').select('id, name').eq('class_id', parseInt(classId)).eq('teacher_id', profile.id)
    setSubjects(data || [])
  }

  const loadPapers = async () => {
    const s = await sb()
    const { data } = await s.from('question_papers').select('*').eq('teacher_id', profile.id).order('created_at', { ascending: false })
    setPapers(data || [])
  }

  const generate = async () => {
    if (!form.class_id || !form.subject_name) { alert('Select class and subject'); return }
    setGenerating(true)
    setGeneratedContent('')
    const totalQ = form.mcq_count + form.tf_count + form.short_count + form.long_count
    const prompt = `You are an experienced school teacher. Generate a complete, well-formatted question paper with the following specifications:

Subject: ${form.subject_name}
Class: ${form.class_id}
Exam Type: ${form.exam_type}
Difficulty: ${form.difficulty}
Total Marks: ${form.total_marks}
Time Allowed: ${form.time_minutes} minutes
${form.topic ? `Topic/Chapter Focus: ${form.topic}` : ''}

Generate exactly these sections:

SECTION A — MULTIPLE CHOICE QUESTIONS (${form.mcq_count} questions, 1 mark each)
- Each MCQ must have 4 options labeled (a), (b), (c), (d)
- Clearly mark correct answer at the end as [Answer: x]

SECTION B — TRUE OR FALSE (${form.tf_count} questions, 1 mark each)
- Simple true/false statements
- Mark answer as [Answer: True/False]

SECTION C — SHORT ANSWER QUESTIONS (${form.short_count} questions, 3 marks each)
- Questions requiring 3-5 line answers
- Include expected answer points in brackets

SECTION D — LONG ANSWER QUESTIONS (${form.long_count} questions, 5 marks each)
- Questions requiring detailed answers
- Include key points to cover in brackets

Format it exactly like a real school question paper. Include instructions at the top. Be specific and educational.`

    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}` },
        body: JSON.stringify({ model: GROQ_MODEL, max_tokens: 4000, messages: [{ role: 'user', content: prompt }] })
      })
      const data = await res.json()
      const text = data.choices?.[0]?.message?.content || ''
      setGeneratedContent(text)
    } catch(e) { alert('Generation failed. Check API key.') }
    setGenerating(false)
  }

  const savePaper = async (status) => {
    if (!generatedContent) { alert('Generate a paper first'); return }
    setSaving(true)
    const s = await sb()
    await s.from('question_papers').insert({
      teacher_id: profile.id,
      class_id: parseInt(form.class_id),
      subject_id: form.subject_id ? parseInt(form.subject_id) : null,
      subject_name: form.subject_name,
      exam_type: form.exam_type,
      difficulty: form.difficulty,
      total_marks: form.total_marks,
      time_minutes: form.time_minutes,
      content: generatedContent,
      status
    })
    await loadPapers()
    setSaving(false)
    alert(`Paper ${status === 'published' ? 'published to students' : 'saved as draft'}!`)
    if (status === 'published') setTab('papers')
  }

  const deletePaper = async (id) => {
    if (!confirm('Delete this paper?')) return
    const s = await sb()
    await s.from('question_papers').delete().eq('id', id)
    loadPapers()
  }

  const togglePublish = async (paper) => {
    const s = await sb()
    const newStatus = paper.status === 'published' ? 'draft' : 'published'
    await s.from('question_papers').update({ status: newStatus }).eq('id', paper.id)
    loadPapers()
  }

  const printPaper = (paper) => {
    const w = window.open('', '_blank')
    const cls = classes.find(c => c.class_id === paper.class_id)
    w.document.write(`
      <html><head><title>Question Paper</title><style>
        body { font-family: 'Times New Roman', serif; padding: 40px; max-width: 750px; margin: 0 auto; font-size: 14px; line-height: 1.6; }
        .header { text-align: center; border-bottom: 3px double #000; padding-bottom: 14px; margin-bottom: 20px; }
        .logo { width: 60px; height: 60px; border: 1px dashed #999; border-radius: 50%; margin: 0 auto 8px; display:flex; align-items:center; justify-content:center; font-size:10px; color:#999; }
        h1 { margin: 0; font-size: 20px; } h2 { margin: 4px 0; font-size: 15px; font-weight: normal; }
        .meta { display: flex; justify-content: space-between; margin: 14px 0; font-size: 13px; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 8px; }
        .instructions { background: #f9f9f9; border: 1px solid #ddd; padding: 10px 14px; margin-bottom: 20px; font-size: 13px; }
        .instructions p { margin: 3px 0; }
        .content { white-space: pre-wrap; font-family: 'Times New Roman', serif; font-size: 14px; line-height: 1.8; }
        .section-header { font-weight: bold; font-size: 15px; margin: 20px 0 8px; text-decoration: underline; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      <div class="header">
        <div class="logo">LOGO</div>
        <h1>Sunrise Public School</h1>
        <h2>${paper.subject_name} — ${paper.exam_type}</h2>
        <h2>Class ${cls?.classes?.name || paper.class_id}</h2>
      </div>
      <div class="meta">
        <span>Time: ${paper.time_minutes} Minutes</span>
        <span>Max Marks: ${paper.total_marks}</span>
        <span>Difficulty: ${paper.difficulty}</span>
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
        <h2 style={S.title}>📝 AI Question Paper Generator</h2>
        <p style={S.sub}>Generate complete question papers using AI — edit, save, and publish to students</p>
      </div>

      <div style={S.tabs}>
        {[['generate','✨ Generate'],['papers','📋 My Papers']].map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)} style={{...S.tab,...(tab===t?S.tabActive:{})}}>{l}</button>
        ))}
      </div>

      {tab==='generate' && (
        <div style={S.genWrap}>
          {/* Form */}
          <div style={S.formCard}>
            <p style={S.cardTitle}>⚙️ Paper Configuration</p>
            <div style={S.formGrid}>
              <div>
                <label style={S.label}>Class</label>
                <select style={S.input} value={form.class_id} onChange={e=>setForm({...form,class_id:e.target.value,subject_id:'',subject_name:''})}>
                  <option value="">Select Class</option>
                  {classes.map((c,i)=><option key={i} value={c.class_id}>Class {c.classes?.name}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>Subject</label>
                <select style={S.input} value={form.subject_id} onChange={e=>{
                  const sub = subjects.find(s=>String(s.id)===e.target.value)
                  setForm({...form, subject_id:e.target.value, subject_name:sub?.name||''})
                }}>
                  <option value="">Select Subject</option>
                  {subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>Exam Type</label>
                <select style={S.input} value={form.exam_type} onChange={e=>setForm({...form,exam_type:e.target.value})}>
                  {['Unit Test','Mid Term','Final Exam','Practice Test','Quiz'].map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>Difficulty</label>
                <select style={S.input} value={form.difficulty} onChange={e=>setForm({...form,difficulty:e.target.value})}>
                  {['Easy','Medium','Hard','Mixed'].map(d=><option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>Total Marks</label>
                <input style={S.input} type="number" min="10" max="100" value={form.total_marks}
                  onChange={e=>setForm({...form,total_marks:parseInt(e.target.value)||50})} />
              </div>
              <div>
                <label style={S.label}>Time Allowed</label>
                <div style={{ display:'flex', gap:'6px' }}>
                  <select style={{...S.input, width:'110px', flexShrink:0}} value={form.time_mode} onChange={e=>setForm({...form,time_mode:e.target.value})}>
                    <option value="auto">Auto</option>
                    <option value="manual">Manual</option>
                  </select>
                  <input style={S.input} type="number" min="10" value={form.time_minutes} disabled={form.time_mode==='auto'}
                    onChange={e=>setForm({...form,time_minutes:parseInt(e.target.value)||60})}
                    placeholder="mins" />
                </div>
              </div>
            </div>

            <p style={{...S.cardTitle, marginTop:'16px'}}>📊 Questions per Section</p>
            <div style={S.formGrid}>
              {[
                { label:'MCQ (1 mark each)', key:'mcq_count' },
                { label:'True/False (1 mark each)', key:'tf_count' },
                { label:'Short Answer (3 marks each)', key:'short_count' },
                { label:'Long Answer (5 marks each)', key:'long_count' },
              ].map(({label,key})=>(
                <div key={key}>
                  <label style={S.label}>{label}</label>
                  <input style={S.input} type="number" min="0" max="20" value={form[key]}
                    onChange={e=>setForm({...form,[key]:parseInt(e.target.value)||0})} />
                </div>
              ))}
            </div>

            <div style={{ marginTop:'12px' }}>
              <label style={S.label}>Topic / Chapter Focus (optional)</label>
              <input style={S.input} placeholder="e.g. Chapter 3: Photosynthesis, or leave blank for full syllabus"
                value={form.topic} onChange={e=>setForm({...form,topic:e.target.value})} />
            </div>

            {/* Marks summary */}
            <div style={{ marginTop:'12px', background:'#f8fafc', borderRadius:'8px', padding:'10px 14px', display:'flex', gap:'20px', flexWrap:'wrap' }}>
              {[
                { l:'MCQ', v: form.mcq_count * 1 },
                { l:'T/F', v: form.tf_count * 1 },
                { l:'Short', v: form.short_count * 3 },
                { l:'Long', v: form.long_count * 5 },
              ].map(({l,v})=>(
                <span key={l} style={{ fontSize:'13px', color:'#374151' }}><strong>{l}:</strong> {v} marks</span>
              ))}
              <span style={{ fontSize:'13px', fontWeight:'800', color: (form.mcq_count+form.tf_count+form.short_count*3+form.long_count*5) === form.total_marks ? '#16a34a' : '#ef4444' }}>
                Total: {form.mcq_count + form.tf_count + form.short_count*3 + form.long_count*5} / {form.total_marks} marks
              </span>
            </div>

            <div style={{ marginTop:'16px', display:'flex', gap:'10px' }}>
              <button style={{...S.btnPrimary, opacity: generating?0.7:1}} onClick={generate} disabled={generating}>
                {generating ? '⏳ Generating...' : '✨ Generate Paper'}
              </button>
              {generatedContent && <button style={{...S.btnPrimary, background:'#f59e0b'}} onClick={generate} disabled={generating}>🔄 Regenerate</button>}
            </div>
          </div>

          {/* Generated output */}
          {generating && (
            <div style={{...S.formCard, textAlign:'center', padding:'40px'}}>
              <span style={{ fontSize:'40px' }}>🤖</span>
              <p style={{ color:'#6366f1', fontWeight:'700', fontSize:'16px', margin:'12px 0 4px' }}>AI is generating your question paper...</p>
              <p style={{ color:'#94a3b8', fontSize:'13px', margin:0 }}>This may take 10-20 seconds</p>
            </div>
          )}

          {generatedContent && !generating && (
            <div style={S.formCard}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
                <p style={S.cardTitle}>📄 Generated Question Paper</p>
                <div style={{ display:'flex', gap:'8px' }}>
                  <button style={{...S.btnSm, background:'#f0fdf4', color:'#16a34a'}} onClick={()=>printPaper({...form, content:generatedContent, classes: classes.find(c=>c.class_id===parseInt(form.class_id))})}>🖨️ Print Preview</button>
                  <button style={{...S.btnSm, background:'#eef2ff', color:'#6366f1'}} onClick={()=>savePaper('draft')} disabled={saving}>💾 Save (Exam not done yet)</button>
                  <button style={{...S.btnSm, background:'#6366f1', color:'#fff'}} onClick={()=>savePaper('published')} disabled={saving}>📤 Publish with Answers (After Exam)</button>
                </div>
              </div>
              <textarea
                style={{ width:'100%', minHeight:'500px', padding:'16px', borderRadius:'8px', border:'1px solid #e2e8f0', fontSize:'13px', fontFamily:'monospace', lineHeight:1.8, outline:'none', resize:'vertical', boxSizing:'border-box', color:'#1e293b' }}
                value={generatedContent}
                onChange={e=>setGeneratedContent(e.target.value)}
              />
              <p style={{ margin:'8px 0 0', fontSize:'12px', color:'#94a3b8' }}>✏️ You can edit the paper above before saving</p>
              <div style={{ marginTop:'10px', background:'#fffbeb', border:'1px solid #fde68a', borderRadius:'8px', padding:'10px 14px', fontSize:'13px', color:'#92400e' }}>💡 <strong>Workflow:</strong> Save as draft → Print for exam → After exam is done → Publish with Answers so students can self-study at home</div>
            </div>
          )}
        </div>
      )}

      {tab==='papers' && (
        <div>
          {papers.length === 0 ? (
            <div style={S.empty}><span style={{fontSize:'40px'}}>📭</span><p>No papers generated yet.</p></div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              {papers.map(p=>(
                <div key={p.id} style={S.paperCard}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div>
                      <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'6px' }}>
                        <span style={{ fontWeight:'800', fontSize:'16px', color:'#1e293b' }}>{p.subject_name}</span>
                        <span style={{ background:`${diffColor(p.difficulty)}15`, color:diffColor(p.difficulty), padding:'2px 10px', borderRadius:'12px', fontSize:'12px', fontWeight:'700' }}>{p.difficulty}</span>
                        <span style={{ background: p.status==='published'?'#f0fdf4':'#f8fafc', color: p.status==='published'?'#16a34a':'#94a3b8', padding:'2px 10px', borderRadius:'12px', fontSize:'12px', fontWeight:'700' }}>
                          {p.status==='published'?'✅ Published':'📝 Draft'}
                        </span>
                      </div>
                      <p style={{ margin:0, fontSize:'13px', color:'#64748b' }}>
                        Class {p.class_id} · {p.exam_type} · {p.total_marks} marks · {p.time_minutes} mins
                      </p>
                      <p style={{ margin:'3px 0 0', fontSize:'12px', color:'#94a3b8' }}>{new Date(p.created_at).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}</p>
                    </div>
                    <div style={{ display:'flex', gap:'8px', flexShrink:0 }}>
                      <button style={{...S.btnSm}} onClick={()=>setViewPaper(p)}>👁️ View</button>
                      <button style={{...S.btnSm, background:'#f0fdf4', color:'#16a34a'}} onClick={()=>printPaper(p)}>🖨️ Print</button>
                      <button style={{...S.btnSm, background: p.status==='published'?'#fffbeb':'#eef2ff', color: p.status==='published'?'#d97706':'#6366f1'}} onClick={()=>togglePublish(p)}>
                        {p.status==='published'?'📥 Unpublish':'📤 Publish with Answers (After Exam)'}
                      </button>
                      <button style={{...S.btnSm, background:'#fef2f2', color:'#ef4444'}} onClick={()=>deletePaper(p.id)}>🗑️</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* View Modal */}
      {viewPaper && (
        <div style={S.overlay} onClick={()=>setViewPaper(null)}>
          <div style={{...S.modal, maxWidth:'700px', maxHeight:'80vh', overflow:'auto'}} onClick={e=>e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
              <div>
                <h3 style={{ margin:0, fontSize:'18px', fontWeight:'800', color:'#1e293b' }}>{viewPaper.subject_name} — {viewPaper.exam_type}</h3>
                <p style={{ margin:'3px 0 0', fontSize:'13px', color:'#64748b' }}>Class {viewPaper.class_id} · {viewPaper.total_marks} marks · {viewPaper.time_minutes} mins</p>
              </div>
              <div style={{ display:'flex', gap:'8px' }}>
                <button style={{...S.btnSm, background:'#f0fdf4', color:'#16a34a'}} onClick={()=>printPaper(viewPaper)}>🖨️ Print</button>
                <button style={S.btnSm} onClick={()=>setViewPaper(null)}>✕ Close</button>
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
  tabs:      { display:'flex', gap:'8px', marginBottom:'20px' },
  tab:       { padding:'8px 20px', borderRadius:'8px', border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer', fontSize:'14px', fontWeight:'600', color:'#64748b' },
  tabActive: { background:'#22c55e', color:'#fff', border:'1px solid #22c55e' },
  genWrap:   { display:'flex', flexDirection:'column', gap:'16px' },
  formCard:  { background:'#fff', borderRadius:'12px', padding:'20px', boxShadow:'0 1px 4px rgba(0,0,0,0.07)' },
  cardTitle: { margin:'0 0 14px', fontSize:'13px', fontWeight:'800', color:'#374151', textTransform:'uppercase', letterSpacing:'0.5px' },
  formGrid:  { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px' },
  label:     { display:'block', fontSize:'12px', fontWeight:'700', color:'#6b7280', marginBottom:'5px', textTransform:'uppercase' },
  input:     { width:'100%', padding:'9px 12px', borderRadius:'8px', border:'1px solid #e2e8f0', fontSize:'14px', outline:'none', boxSizing:'border-box', background:'#fff' },
  btnPrimary:{ padding:'10px 22px', background:'#6366f1', color:'#fff', border:'none', borderRadius:'8px', fontSize:'14px', fontWeight:'700', cursor:'pointer' },
  btnSm:     { padding:'6px 12px', background:'#f1f5f9', color:'#374151', border:'none', borderRadius:'6px', fontSize:'12px', fontWeight:'600', cursor:'pointer' },
  paperCard: { background:'#fff', borderRadius:'12px', padding:'18px', boxShadow:'0 1px 4px rgba(0,0,0,0.07)' },
  empty:     { textAlign:'center', padding:'60px', color:'#94a3b8' },
  overlay:   { position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'20px' },
  modal:     { background:'#fff', borderRadius:'16px', padding:'28px', width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' },
}
