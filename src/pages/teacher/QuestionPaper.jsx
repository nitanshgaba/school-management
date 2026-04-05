// // src/pages/teacher/QuestionPaper.jsx
// import { useState, useEffect } from 'react'
// import { useAuth } from '../../context/AuthContext'

// const GROQ_MODEL = 'llama-3.3-70b-versatile'

// export default function QuestionPaper() {
//   const { profile } = useAuth()
//   const [tab, setTab] = useState('generate')
//   const [classes, setClasses] = useState([])
//   const [subjects, setSubjects] = useState([])
//   const [papers, setPapers] = useState([])
//   const [generating, setGenerating] = useState(false)
//   const [saving, setSaving] = useState(false)
//   const [generatedContent, setGeneratedContent] = useState('')
//   const [viewPaper, setViewPaper] = useState(null)
//   const [form, setForm] = useState({
//     class_id: '', subject_id: '', subject_name: '',
//     exam_type: 'Unit Test', difficulty: 'Mixed',
//     total_marks: 50, time_mode: 'auto',
//     time_minutes: 50,
//     mcq_count: 10, tf_count: 5, short_count: 4, long_count: 2,
//     topic: ''
//   })

//   useEffect(() => { loadClasses(); loadPapers() }, [])
//   useEffect(() => { if (form.class_id) loadSubjects(form.class_id) }, [form.class_id])
//   useEffect(() => {
//     if (form.time_mode === 'auto') {
//       setForm(f => ({ ...f, time_minutes: f.total_marks }))
//     }
//   }, [form.total_marks, form.time_mode])

//   const sb = async () => { const { supabase } = await import('../../lib/supabase'); return supabase }

//   const loadClasses = async () => {
//     const s = await sb()
//     const { data } = await s.from('teacher_classes').select('class_id, classes(name)').eq('teacher_id', profile.id)
//     setClasses(data || [])
//   }

//   const loadSubjects = async (classId) => {
//     const s = await sb()
//     const { data } = await s.from('subjects').select('id, name').eq('class_id', parseInt(classId)).eq('teacher_id', profile.id)
//     setSubjects(data || [])
//   }

//   const loadPapers = async () => {
//     const s = await sb()
//     const { data } = await s.from('question_papers').select('*').eq('teacher_id', profile.id).order('created_at', { ascending: false })
//     setPapers(data || [])
//   }

//   const generate = async () => {
//     if (!form.class_id || !form.subject_name) { alert('Select class and subject'); return }
//     setGenerating(true)
//     setGeneratedContent('')
//     const totalQ = form.mcq_count + form.tf_count + form.short_count + form.long_count
//     const prompt = `You are an experienced school teacher. Generate a complete, well-formatted question paper with the following specifications:

// Subject: ${form.subject_name}
// Class: ${form.class_id}
// Exam Type: ${form.exam_type}
// Difficulty: ${form.difficulty}
// Total Marks: ${form.total_marks}
// Time Allowed: ${form.time_minutes} minutes
// ${form.topic ? `Topic/Chapter Focus: ${form.topic}` : ''}

// Generate exactly these sections:

// SECTION A — MULTIPLE CHOICE QUESTIONS (${form.mcq_count} questions, 1 mark each)
// - Each MCQ must have 4 options labeled (a), (b), (c), (d)
// - Clearly mark correct answer at the end as [Answer: x]

// SECTION B — TRUE OR FALSE (${form.tf_count} questions, 1 mark each)
// - Simple true/false statements
// - Mark answer as [Answer: True/False]

// SECTION C — SHORT ANSWER QUESTIONS (${form.short_count} questions, 3 marks each)
// - Questions requiring 3-5 line answers
// - Include expected answer points in brackets

// SECTION D — LONG ANSWER QUESTIONS (${form.long_count} questions, 5 marks each)
// - Questions requiring detailed answers
// - Include key points to cover in brackets

// Format it exactly like a real school question paper. Include instructions at the top. Be specific and educational.`

//     try {
//       const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}` },
//         body: JSON.stringify({ model: GROQ_MODEL, max_tokens: 4000, messages: [{ role: 'user', content: prompt }] })
//       })
//       const data = await res.json()
//       const text = data.choices?.[0]?.message?.content || ''
//       setGeneratedContent(text)
//     } catch(e) { alert('Generation failed. Check API key.') }
//     setGenerating(false)
//   }

//   const savePaper = async (status) => {
//     if (!generatedContent) { alert('Generate a paper first'); return }
//     setSaving(true)
//     const s = await sb()
//     await s.from('question_papers').insert({
//       teacher_id: profile.id,
//       class_id: parseInt(form.class_id),
//       subject_id: form.subject_id ? parseInt(form.subject_id) : null,
//       subject_name: form.subject_name,
//       exam_type: form.exam_type,
//       difficulty: form.difficulty,
//       total_marks: form.total_marks,
//       time_minutes: form.time_minutes,
//       content: generatedContent,
//       status
//     })
//     await loadPapers()
//     setSaving(false)
//     alert(`Paper ${status === 'published' ? 'published to students' : 'saved as draft'}!`)
//     if (status === 'published') setTab('papers')
//   }

//   const deletePaper = async (id) => {
//     if (!confirm('Delete this paper?')) return
//     const s = await sb()
//     await s.from('question_papers').delete().eq('id', id)
//     loadPapers()
//   }

//   const togglePublish = async (paper) => {
//     const s = await sb()
//     const newStatus = paper.status === 'published' ? 'draft' : 'published'
//     await s.from('question_papers').update({ status: newStatus }).eq('id', paper.id)
//     loadPapers()
//   }

//   const printPaper = async (paper) => {
//     const { getSchoolSettings } = await import('../../lib/schoolSettings')
//     const school = await getSchoolSettings()
//     const w = window.open('', '_blank')
//     const cls = classes.find(c => c.class_id === paper.class_id)
//     w.document.write(`
//       <html><head><title>Question Paper</title><style>
//         body { font-family: 'Times New Roman', serif; padding: 40px; max-width: 750px; margin: 0 auto; font-size: 14px; line-height: 1.6; }
//         .header { text-align: center; border-bottom: 3px double #000; padding-bottom: 14px; margin-bottom: 20px; }
//         .logo { width: 60px; height: 60px; border: 1px dashed #999; border-radius: 50%; margin: 0 auto 8px; display:flex; align-items:center; justify-content:center; font-size:10px; color:#999; }
//         h1 { margin: 0; font-size: 20px; } h2 { margin: 4px 0; font-size: 15px; font-weight: normal; }
//         .meta { display: flex; justify-content: space-between; margin: 14px 0; font-size: 13px; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 8px; }
//         .instructions { background: #f9f9f9; border: 1px solid #ddd; padding: 10px 14px; margin-bottom: 20px; font-size: 13px; }
//         .instructions p { margin: 3px 0; }
//         .content { white-space: pre-wrap; font-family: 'Times New Roman', serif; font-size: 14px; line-height: 1.8; }
//         .section-header { font-weight: bold; font-size: 15px; margin: 20px 0 8px; text-decoration: underline; }
//         @media print { body { padding: 20px; } }
//       </style></head><body>
//       <div class="header">
//         <div class="logo">LOGO</div>
//         <h1>${school.school_name || 'School'}</h1>
//         ${school.tagline ? `<h3 style='margin:2px 0;font-size:13px;font-weight:400'>${school.tagline}</h3>` : ''}
//         <h2>${paper.subject_name} — ${paper.exam_type}</h2>
//         <h2>Class ${cls?.classes?.name || paper.class_id}</h2>
//       </div>
//       <div class="meta">
//         <span>Time: ${paper.time_minutes} Minutes</span>
//         <span>Max Marks: ${paper.total_marks}</span>
//         <span>Difficulty: ${paper.difficulty}</span>
//         <span>Date: ___________</span>
//       </div>
//       <div class="content">${paper.content.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
//       <script>window.onload=()=>{window.print()}<\/script>
//       </body></html>
//     `)
//     w.document.close()
//   }

//   const diffColor = d => ({ Easy:'#16a34a', Medium:'#f59e0b', Hard:'#ef4444', Mixed:'#6366f1' }[d] || '#64748b')

//   return (
//     <div style={S.page}>
//       <div style={S.header}>
//         <h2 style={S.title}>📝 AI Question Paper Generator</h2>
//         <p style={S.sub}>Generate complete question papers using AI — edit, save, and publish to students</p>
//       </div>

//       <div style={S.tabs}>
//         {[['generate','✨ Generate'],['papers','📋 My Papers']].map(([t,l])=>(
//           <button key={t} onClick={()=>setTab(t)} style={{...S.tab,...(tab===t?S.tabActive:{})}}>{l}</button>
//         ))}
//       </div>

//       {tab==='generate' && (
//         <div style={S.genWrap}>
//           {/* Form */}
//           <div style={S.formCard}>
//             <p style={S.cardTitle}>⚙️ Paper Configuration</p>
//             <div style={S.formGrid}>
//               <div>
//                 <label style={S.label}>Class</label>
//                 <select style={S.input} value={form.class_id} onChange={e=>setForm({...form,class_id:e.target.value,subject_id:'',subject_name:''})}>
//                   <option value="">Select Class</option>
//                   {classes.map((c,i)=><option key={i} value={c.class_id}>Class {c.classes?.name}</option>)}
//                 </select>
//               </div>
//               <div>
//                 <label style={S.label}>Subject</label>
//                 <select style={S.input} value={form.subject_id} onChange={e=>{
//                   const sub = subjects.find(s=>String(s.id)===e.target.value)
//                   setForm({...form, subject_id:e.target.value, subject_name:sub?.name||''})
//                 }}>
//                   <option value="">Select Subject</option>
//                   {subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
//                 </select>
//               </div>
//               <div>
//                 <label style={S.label}>Exam Type</label>
//                 <select style={S.input} value={form.exam_type} onChange={e=>setForm({...form,exam_type:e.target.value})}>
//                   {['Unit Test','Mid Term','Final Exam','Practice Test','Quiz'].map(t=><option key={t}>{t}</option>)}
//                 </select>
//               </div>
//               <div>
//                 <label style={S.label}>Difficulty</label>
//                 <select style={S.input} value={form.difficulty} onChange={e=>setForm({...form,difficulty:e.target.value})}>
//                   {['Easy','Medium','Hard','Mixed'].map(d=><option key={d}>{d}</option>)}
//                 </select>
//               </div>
//               <div>
//                 <label style={S.label}>Total Marks</label>
//                 <input style={S.input} type="number" min="10" max="100" value={form.total_marks}
//                   onChange={e=>setForm({...form,total_marks:parseInt(e.target.value)||50})} />
//               </div>
//               <div>
//                 <label style={S.label}>Time Allowed</label>
//                 <div style={{ display:'flex', gap:'6px' }}>
//                   <select style={{...S.input, width:'110px', flexShrink:0}} value={form.time_mode} onChange={e=>setForm({...form,time_mode:e.target.value})}>
//                     <option value="auto">Auto</option>
//                     <option value="manual">Manual</option>
//                   </select>
//                   <input style={S.input} type="number" min="10" value={form.time_minutes} disabled={form.time_mode==='auto'}
//                     onChange={e=>setForm({...form,time_minutes:parseInt(e.target.value)||60})}
//                     placeholder="mins" />
//                 </div>
//               </div>
//             </div>

//             <p style={{...S.cardTitle, marginTop:'16px'}}>📊 Questions per Section</p>
//             <div style={S.formGrid}>
//               {[
//                 { label:'MCQ (1 mark each)', key:'mcq_count' },
//                 { label:'True/False (1 mark each)', key:'tf_count' },
//                 { label:'Short Answer (3 marks each)', key:'short_count' },
//                 { label:'Long Answer (5 marks each)', key:'long_count' },
//               ].map(({label,key})=>(
//                 <div key={key}>
//                   <label style={S.label}>{label}</label>
//                   <input style={S.input} type="number" min="0" max="20" value={form[key]}
//                     onChange={e=>setForm({...form,[key]:parseInt(e.target.value)||0})} />
//                 </div>
//               ))}
//             </div>

//             <div style={{ marginTop:'12px' }}>
//               <label style={S.label}>Topic / Chapter Focus (optional)</label>
//               <input style={S.input} placeholder="e.g. Chapter 3: Photosynthesis, or leave blank for full syllabus"
//                 value={form.topic} onChange={e=>setForm({...form,topic:e.target.value})} />
//             </div>

//             {/* Marks summary */}
//             <div style={{ marginTop:'12px', background:'#f8fafc', borderRadius:'8px', padding:'10px 14px', display:'flex', gap:'20px', flexWrap:'wrap' }}>
//               {[
//                 { l:'MCQ', v: form.mcq_count * 1 },
//                 { l:'T/F', v: form.tf_count * 1 },
//                 { l:'Short', v: form.short_count * 3 },
//                 { l:'Long', v: form.long_count * 5 },
//               ].map(({l,v})=>(
//                 <span key={l} style={{ fontSize:'13px', color:'#374151' }}><strong>{l}:</strong> {v} marks</span>
//               ))}
//               <span style={{ fontSize:'13px', fontWeight:'800', color: (form.mcq_count+form.tf_count+form.short_count*3+form.long_count*5) === form.total_marks ? '#16a34a' : '#ef4444' }}>
//                 Total: {form.mcq_count + form.tf_count + form.short_count*3 + form.long_count*5} / {form.total_marks} marks
//               </span>
//             </div>

//             <div style={{ marginTop:'16px', display:'flex', gap:'10px' }}>
//               <button style={{...S.btnPrimary, opacity: generating?0.7:1}} onClick={generate} disabled={generating}>
//                 {generating ? '⏳ Generating...' : '✨ Generate Paper'}
//               </button>
//               {generatedContent && <button style={{...S.btnPrimary, background:'#f59e0b'}} onClick={generate} disabled={generating}>🔄 Regenerate</button>}
//             </div>
//           </div>

//           {/* Generated output */}
//           {generating && (
//             <div style={{...S.formCard, textAlign:'center', padding:'40px'}}>
//               <span style={{ fontSize:'40px' }}>🤖</span>
//               <p style={{ color:'#6366f1', fontWeight:'700', fontSize:'16px', margin:'12px 0 4px' }}>AI is generating your question paper...</p>
//               <p style={{ color:'#94a3b8', fontSize:'13px', margin:0 }}>This may take 10-20 seconds</p>
//             </div>
//           )}

//           {generatedContent && !generating && (
//             <div style={S.formCard}>
//               <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
//                 <p style={S.cardTitle}>📄 Generated Question Paper</p>
//                 <div style={{ display:'flex', gap:'8px' }}>
//                   <button style={{...S.btnSm, background:'#f0fdf4', color:'#16a34a'}} onClick={()=>printPaper({...form, content:generatedContent, classes: classes.find(c=>c.class_id===parseInt(form.class_id))})}>🖨️ Print Preview</button>
//                   <button style={{...S.btnSm, background:'#eef2ff', color:'#6366f1'}} onClick={()=>savePaper('draft')} disabled={saving}>💾 Save (Exam not done yet)</button>
//                   <button style={{...S.btnSm, background:'#6366f1', color:'#fff'}} onClick={()=>savePaper('published')} disabled={saving}>📤 Publish with Answers (After Exam)</button>
//                 </div>
//               </div>
//               <textarea
//                 style={{ width:'100%', minHeight:'500px', padding:'16px', borderRadius:'8px', border:'1px solid #e2e8f0', fontSize:'13px', fontFamily:'monospace', lineHeight:1.8, outline:'none', resize:'vertical', boxSizing:'border-box', color:'#1e293b' }}
//                 value={generatedContent}
//                 onChange={e=>setGeneratedContent(e.target.value)}
//               />
//               <p style={{ margin:'8px 0 0', fontSize:'12px', color:'#94a3b8' }}>✏️ You can edit the paper above before saving</p>
//               <div style={{ marginTop:'10px', background:'#fffbeb', border:'1px solid #fde68a', borderRadius:'8px', padding:'10px 14px', fontSize:'13px', color:'#92400e' }}>💡 <strong>Workflow:</strong> Save as draft → Print for exam → After exam is done → Publish with Answers so students can self-study at home</div>
//             </div>
//           )}
//         </div>
//       )}

//       {tab==='papers' && (
//         <div>
//           {papers.length === 0 ? (
//             <div style={S.empty}><span style={{fontSize:'40px'}}>📭</span><p>No papers generated yet.</p></div>
//           ) : (
//             <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
//               {papers.map(p=>(
//                 <div key={p.id} style={S.paperCard}>
//                   <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
//                     <div>
//                       <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'6px' }}>
//                         <span style={{ fontWeight:'800', fontSize:'16px', color:'#1e293b' }}>{p.subject_name}</span>
//                         <span style={{ background:`${diffColor(p.difficulty)}15`, color:diffColor(p.difficulty), padding:'2px 10px', borderRadius:'12px', fontSize:'12px', fontWeight:'700' }}>{p.difficulty}</span>
//                         <span style={{ background: p.status==='published'?'#f0fdf4':'#f8fafc', color: p.status==='published'?'#16a34a':'#94a3b8', padding:'2px 10px', borderRadius:'12px', fontSize:'12px', fontWeight:'700' }}>
//                           {p.status==='published'?'✅ Published':'📝 Draft'}
//                         </span>
//                       </div>
//                       <p style={{ margin:0, fontSize:'13px', color:'#64748b' }}>
//                         Class {p.class_id} · {p.exam_type} · {p.total_marks} marks · {p.time_minutes} mins
//                       </p>
//                       <p style={{ margin:'3px 0 0', fontSize:'12px', color:'#94a3b8' }}>{new Date(p.created_at).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}</p>
//                     </div>
//                     <div style={{ display:'flex', gap:'8px', flexShrink:0 }}>
//                       <button style={{...S.btnSm}} onClick={()=>setViewPaper(p)}>👁️ View</button>
//                       <button style={{...S.btnSm, background:'#f0fdf4', color:'#16a34a'}} onClick={()=>printPaper(p)}>🖨️ Print</button>
//                       <button style={{...S.btnSm, background: p.status==='published'?'#fffbeb':'#eef2ff', color: p.status==='published'?'#d97706':'#6366f1'}} onClick={()=>togglePublish(p)}>
//                         {p.status==='published'?'📥 Unpublish':'📤 Publish with Answers (After Exam)'}
//                       </button>
//                       <button style={{...S.btnSm, background:'#fef2f2', color:'#ef4444'}} onClick={()=>deletePaper(p.id)}>🗑️</button>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       )}

//       {/* View Modal */}
//       {viewPaper && (
//         <div style={S.overlay} onClick={()=>setViewPaper(null)}>
//           <div style={{...S.modal, maxWidth:'700px', maxHeight:'80vh', overflow:'auto'}} onClick={e=>e.stopPropagation()}>
//             <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
//               <div>
//                 <h3 style={{ margin:0, fontSize:'18px', fontWeight:'800', color:'#1e293b' }}>{viewPaper.subject_name} — {viewPaper.exam_type}</h3>
//                 <p style={{ margin:'3px 0 0', fontSize:'13px', color:'#64748b' }}>Class {viewPaper.class_id} · {viewPaper.total_marks} marks · {viewPaper.time_minutes} mins</p>
//               </div>
//               <div style={{ display:'flex', gap:'8px' }}>
//                 <button style={{...S.btnSm, background:'#f0fdf4', color:'#16a34a'}} onClick={()=>printPaper(viewPaper)}>🖨️ Print</button>
//                 <button style={S.btnSm} onClick={()=>setViewPaper(null)}>✕ Close</button>
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
//   tabs:      { display:'flex', gap:'8px', marginBottom:'20px' },
//   tab:       { padding:'8px 20px', borderRadius:'8px', border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer', fontSize:'14px', fontWeight:'600', color:'#64748b' },
//   tabActive: { background:'#22c55e', color:'#fff', border:'1px solid #22c55e' },
//   genWrap:   { display:'flex', flexDirection:'column', gap:'16px' },
//   formCard:  { background:'#fff', borderRadius:'12px', padding:'20px', boxShadow:'0 1px 4px rgba(0,0,0,0.07)' },
//   cardTitle: { margin:'0 0 14px', fontSize:'13px', fontWeight:'800', color:'#374151', textTransform:'uppercase', letterSpacing:'0.5px' },
//   formGrid:  { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px' },
//   label:     { display:'block', fontSize:'12px', fontWeight:'700', color:'#6b7280', marginBottom:'5px', textTransform:'uppercase' },
//   input:     { width:'100%', padding:'9px 12px', borderRadius:'8px', border:'1px solid #e2e8f0', fontSize:'14px', outline:'none', boxSizing:'border-box', background:'#fff' },
//   btnPrimary:{ padding:'10px 22px', background:'#6366f1', color:'#fff', border:'none', borderRadius:'8px', fontSize:'14px', fontWeight:'700', cursor:'pointer' },
//   btnSm:     { padding:'6px 12px', background:'#f1f5f9', color:'#374151', border:'none', borderRadius:'6px', fontSize:'12px', fontWeight:'600', cursor:'pointer' },
//   paperCard: { background:'#fff', borderRadius:'12px', padding:'18px', boxShadow:'0 1px 4px rgba(0,0,0,0.07)' },
//   empty:     { textAlign:'center', padding:'60px', color:'#94a3b8' },
//   overlay:   { position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'20px' },
//   modal:     { background:'#fff', borderRadius:'16px', padding:'28px', width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' },
// }





import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getSchoolSettings } from '../../lib/schoolSettings'

const GROQ_MODEL = 'llama-3.3-70b-versatile'

function stripAnswers(content) {
  return content
    .replace(/\[Answer:.*?\]/gi, '')
    .replace(/\(Answer:.*?\)/gi, '')
    .replace(/\[Key Points:[\s\S]*?\]/gi, '')
    .replace(/\(Key Points:[\s\S]*?\)/gi, '')
    .replace(/Ans:.*?(\n|$)/gi, '\n')
}

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
  const [viewMode, setViewMode] = useState('with')
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
    if (form.time_mode === 'auto') setForm(f => ({ ...f, time_minutes: f.total_marks }))
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
    if (!form.class_id || !form.subject_name) { alert('Please select a class and subject first.'); return }

    const sections = []
    if (form.mcq_count > 0) sections.push(`SECTION A — MULTIPLE CHOICE QUESTIONS (${form.mcq_count} questions x 1 mark each = ${form.mcq_count} marks)\nFor each question provide 4 options (a, b, c, d) and mark correct answer as [Answer: option_letter]`)
    if (form.tf_count > 0) sections.push(`SECTION B — TRUE / FALSE (${form.tf_count} questions x 1 mark each = ${form.tf_count} marks)\nFor each statement mark [Answer: True] or [Answer: False]`)
    if (form.short_count > 0) sections.push(`SECTION C — SHORT ANSWER QUESTIONS (${form.short_count} questions x 3 marks each = ${form.short_count * 3} marks)\nAfter each question add [Key Points: key answer points here]`)
    if (form.long_count > 0) sections.push(`SECTION D — LONG ANSWER QUESTIONS (${form.long_count} questions x 5 marks each = ${form.long_count * 5} marks)\nAfter each question add [Key Points: key answer points here]`)

    if (sections.length === 0) { alert('Please set at least one section with questions.'); return }

    setGenerating(true)
    setGeneratedContent('')

    const prompt = `You are an experienced school examiner. Generate a complete question paper body (questions only, no header).

Subject: ${form.subject_name} | Class: ${form.class_id} | Exam: ${form.exam_type} | Difficulty: ${form.difficulty}
Total Marks: ${form.total_marks} | Time: ${form.time_minutes} minutes${form.topic ? ` | Topic: ${form.topic}` : ''}

Generate ONLY these sections:

${sections.join('\n\n')}

Rules:
- Number questions as Q1, Q2 etc within each section
- Keep questions appropriate for the class level
- Include answer hints in brackets for teacher reference only
- Do not add any introduction, conclusion, or header text`

    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}` },
        body: JSON.stringify({ model: GROQ_MODEL, max_tokens: 4000, messages: [{ role: 'user', content: prompt }] })
      })
      const data = await res.json()
      setGeneratedContent(data.choices?.[0]?.message?.content || '')
    } catch (e) { alert('Generation failed. Please verify your Groq API key.') }
    setGenerating(false)
  }

  const savePaper = async (status, includeAnswers) => {
    if (!generatedContent) return
    setSaving(true)
    const s = await sb()
    const contentClean = stripAnswers(generatedContent)
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
      content_clean: contentClean,
      status,
      show_answers: includeAnswers,
    })
    await loadPapers()
    setSaving(false)
    setTab('papers')
  }

  const deletePaper = async (id) => {
    if (!confirm('Permanently delete this paper?')) return
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

  const printPaper = async (paper, withAnswers = false) => {
    const school = await getSchoolSettings()
    const rawContent = withAnswers ? paper.content : (paper.content_clean || stripAnswers(paper.content))

    const formatContent = (text) => {
      const lines = text.split('\n')
      let html = ''
      for (const line of lines) {
        const t = line.trim()
        if (!t) { html += '<div style="margin:6px 0"></div>'; continue }
        if (/^SECTION [A-Z]/i.test(t)) {
          html += `<div class="sec-head">${t}</div>`
        } else if (/^Q\d+[.)]/i.test(t)) {
          html += `<div class="q">${t}</div>`
        } else if (/^[a-d][.)]/i.test(t)) {
          html += `<div class="opt">${t}</div>`
        } else if (/^\[Answer:/i.test(t) || /^\[Key Points:/i.test(t)) {
          html += `<div class="ans-hint">${t}</div>`
        } else {
          html += `<div class="line">${t}</div>`
        }
      }
      return html
    }

    const w = window.open('', '_blank')
    w.document.write(`<!DOCTYPE html><html><head><title>${paper.subject_name} — ${paper.exam_type}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Times New Roman',Times,serif;font-size:13pt;color:#000;padding:28px 48px;max-width:800px;margin:0 auto}
.hdr{text-align:center;margin-bottom:10px}
.sname{font-size:20pt;font-weight:bold;text-transform:uppercase;letter-spacing:1px}
.ssub{font-size:10pt;color:#333;margin-top:3px}
.hdivider{border:none;border-top:3px double #000;margin:8px 0}
.etitle{font-size:15pt;font-weight:bold;text-transform:uppercase;margin:6px 0 2px}
.sline{font-size:12pt;margin:3px 0}
.meta{display:flex;justify-content:space-between;border-top:2px solid #000;border-bottom:2px solid #000;padding:7px 0;margin:10px 0;font-size:11pt;font-weight:bold}
.sfields{display:flex;justify-content:space-between;font-size:11pt;margin:10px 0 14px;gap:16px}
.sfields span{border-bottom:1px solid #000;flex:1;padding-bottom:2px}
.instr{border:1.5px solid #000;padding:10px 16px;margin-bottom:16px;font-size:10.5pt}
.instr-title{font-weight:bold;font-size:11pt;text-decoration:underline;margin-bottom:5px}
.instr ol{padding-left:20px}
.instr li{margin-bottom:3px;line-height:1.5}
.tbanner{background:#fffbeb;border:1.5px dashed #f59e0b;padding:6px 14px;font-size:10pt;font-weight:bold;color:#92400e;margin-bottom:14px;text-align:center}
.sec-head{font-weight:bold;font-size:12pt;margin:20px 0 8px;text-transform:uppercase;border-bottom:1px solid #aaa;padding-bottom:4px}
.q{font-size:12pt;margin:10px 0 4px;font-weight:500;line-height:1.6}
.opt{font-size:11.5pt;margin-left:24px;margin-bottom:2px;line-height:1.5}
.ans-hint{font-size:10pt;color:#1d4ed8;margin-left:24px;margin-top:2px;font-style:italic}
.line{font-size:11.5pt;margin:2px 0;line-height:1.6}
.footer{margin-top:32px;border-top:1.5px solid #000;padding-top:10px;display:flex;justify-content:space-between;font-size:10pt;color:#333}
@media print{body{padding:14px 24px}.no-print{display:none!important}}
</style></head><body>
<div class="hdr">
  <div class="sname">${school.school_name || 'School Name'}</div>
  ${school.tagline ? `<div class="ssub">${school.tagline}</div>` : ''}
  ${school.address ? `<div class="ssub">${school.address}${school.phone ? ' | Ph: ' + school.phone : ''}</div>` : ''}
  <hr class="hdivider"/>
  <div class="etitle">${paper.exam_type}</div>
  <div class="sline"><strong>Subject:</strong> ${paper.subject_name} &nbsp;&nbsp; <strong>Class:</strong> ${paper.class_id}</div>
</div>
<div class="meta">
  <span>Time: ${paper.time_minutes} Minutes</span>
  <span style="text-align:center">Academic Year: _________</span>
  <span style="text-align:right">Max. Marks: ${paper.total_marks}</span>
</div>
<div class="sfields">
  <span>Student Name: _______________________________</span>
  <span>Roll No: ___________</span>
  <span>Section: ___________</span>
</div>
${withAnswers ? '<div class="tbanner">TEACHER COPY — ANSWER KEY INCLUDED — NOT FOR DISTRIBUTION TO STUDENTS</div>' : ''}
<div class="instr">
  <div class="instr-title">General Instructions:</div>
  <ol>
    <li>All questions are compulsory unless otherwise stated.</li>
    <li>Read each question carefully before answering.</li>
    <li>Write your name and roll number in the space provided above.</li>
    <li>Marks allotted to each section are indicated in brackets.</li>
    <li>Maintain neat and legible handwriting throughout.</li>
    <li>Do not write on the question paper except where asked.</li>
    <li>Use of calculator / electronic devices is not permitted.</li>
  </ol>
</div>
<div class="content">${formatContent(rawContent)}</div>
<div class="footer">
  <span>*** End of Question Paper ***</span>
  <span>${school.school_name || ''} | ${paper.subject_name}</span>
</div>
<script>window.onload=()=>{window.print()}<\/script>
</body></html>`)
    w.document.close()
  }

  const marksSum = form.mcq_count * 1 + form.tf_count * 1 + form.short_count * 3 + form.long_count * 5
  const isMarksValid = marksSum === form.total_marks
  const activeSections = [
    form.mcq_count > 0 && `MCQ x${form.mcq_count} (${form.mcq_count}m)`,
    form.tf_count > 0 && `T/F x${form.tf_count} (${form.tf_count}m)`,
    form.short_count > 0 && `Short x${form.short_count} (${form.short_count * 3}m)`,
    form.long_count > 0 && `Long x${form.long_count} (${form.long_count * 5}m)`,
  ].filter(Boolean)

  return (
    <div style={styles.container}>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>AI Question Studio</h1>
        <p style={styles.pageSubtitle}>Generate, manage, and publish examination papers in seconds</p>
      </div>

      <div style={styles.tabContainer}>
        {[['generate', '✨ New Generator'], ['papers', '🗄️ Paper Archive']].map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)} style={{ ...styles.tab, backgroundColor: tab === t ? '#fff' : 'transparent', color: tab === t ? '#4f46e5' : '#64748b', boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>{l}</button>
        ))}
      </div>

      {tab === 'generate' && (
        <div>
          <div style={styles.card}>
            <h2 style={styles.cardSectionTitle}>Paper Configuration</h2>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Class</label>
                <select style={styles.input} value={form.class_id} onChange={e => setForm({ ...form, class_id: e.target.value })}>
                  <option value="">Select Class</option>
                  {classes.map((c, i) => <option key={i} value={c.class_id}>Class {c.classes?.name}</option>)}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Subject</label>
                <select style={styles.input} value={form.subject_id} onChange={e => {
                  const sub = subjects.find(s => String(s.id) === e.target.value)
                  setForm({ ...form, subject_id: e.target.value, subject_name: sub?.name || '' })
                }}>
                  <option value="">Select Subject</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Exam Type</label>
                <select style={styles.input} value={form.exam_type} onChange={e => setForm({ ...form, exam_type: e.target.value })}>
                  {['Unit Test', 'Mid Term', 'Final Term', 'Class Test', 'Practice Test'].map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Difficulty</label>
                <select style={styles.input} value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}>
                  {['Easy', 'Medium', 'Hard', 'Mixed'].map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Total Marks</label>
                <input style={styles.input} type="number" value={form.total_marks} onChange={e => setForm({ ...form, total_marks: parseInt(e.target.value) || 0 })} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Time (minutes)</label>
                <input style={styles.input} type="number" value={form.time_minutes} onChange={e => setForm({ ...form, time_minutes: parseInt(e.target.value) || 0, time_mode: 'manual' })} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Focus Topic (optional)</label>
                <input style={styles.input} placeholder="e.g. Chapter 5: Trigonometry" value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} />
              </div>
            </div>

            <h2 style={{ ...styles.cardSectionTitle, marginTop: '28px' }}>
              Section Breakdown
              <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '400', textTransform: 'none', marginLeft: '8px' }}>— set to 0 to skip a section</span>
            </h2>
            <div style={styles.formGrid}>
              {[
                { l: 'MCQ (1 mark each)', k: 'mcq_count', m: form.mcq_count },
                { l: 'True/False (1 mark each)', k: 'tf_count', m: form.tf_count },
                { l: 'Short Answer (3 marks)', k: 'short_count', m: form.short_count * 3 },
                { l: 'Long Answer (5 marks)', k: 'long_count', m: form.long_count * 5 },
              ].map(item => (
                <div key={item.k} style={styles.formGroup}>
                  <label style={styles.label}>{item.l}</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input style={{ ...styles.input, flex: 1 }} type="number" min="0"
                      value={form[item.k]} onChange={e => setForm({ ...form, [item.k]: parseInt(e.target.value) || 0 })} />
                    <span style={{ fontSize: '12px', color: '#64748b', minWidth: '28px' }}>{item.m}m</span>
                  </div>
                </div>
              ))}
            </div>

            {activeSections.length > 0 && (
              <div style={{ marginTop: '14px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {activeSections.map(s => <span key={s} style={{ backgroundColor: '#ede9fe', color: '#6d28d9', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>{s}</span>)}
              </div>
            )}

            <div style={{ ...styles.validatorBar, backgroundColor: isMarksValid ? '#f0fdf4' : '#fff1f2', border: `1px solid ${isMarksValid ? '#bbf7d0' : '#fecaca'}`, marginTop: '14px' }}>
              <span style={{ fontWeight: '700', color: isMarksValid ? '#16a34a' : '#dc2626' }}>
                {isMarksValid ? `✅ Marks correct — ${marksSum} / ${form.total_marks}` : `⚠️ Current total: ${marksSum} marks — must equal ${form.total_marks}`}
              </span>
            </div>

            <div style={{ marginTop: '20px' }}>
              <button style={styles.generateBtn} onClick={generate} disabled={generating || !isMarksValid || activeSections.length === 0}>
                {generating ? '⌛ Generating Paper...' : '🚀 Generate Paper with AI'}
              </button>
            </div>
          </div>

          {generatedContent && (
            <div style={{ ...styles.card, marginTop: '24px' }}>
              <div style={styles.outputHeader}>
                <div>
                  <h3 style={{ margin: 0, fontWeight: '800', color: '#0f172a' }}>📄 Preview & Edit</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8' }}>Answer hints are for your reference only — stripped from the student copy automatically</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button style={styles.draftBtn} onClick={() => savePaper('draft', false)} disabled={saving}>💾 Save Draft</button>
                  <button style={{ ...styles.publishBtn, backgroundColor: '#0891b2' }} onClick={() => savePaper('published', false)} disabled={saving}>📤 Publish (No Answers)</button>
                  <button style={styles.publishBtn} onClick={() => savePaper('published', true)} disabled={saving}>🔑 Publish (With Answers)</button>
                </div>
              </div>
              <textarea style={styles.editor} value={generatedContent} onChange={e => setGeneratedContent(e.target.value)} />
            </div>
          )}
        </div>
      )}

      {tab === 'papers' && (
        <div>
          {papers.length === 0 ? (
            <div style={styles.emptyState}>No papers yet. Generate your first one!</div>
          ) : (
            <div style={styles.paperGrid}>
              {papers.map(p => (
                <div key={p.id} style={styles.paperCard}>
                  <div style={styles.paperCardHeader}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={styles.paperTitle}>{p.subject_name}</h3>
                      <p style={styles.paperMeta}>Class {p.class_id} • {p.exam_type} • {p.total_marks} Marks • {p.time_minutes} min</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                      <span style={{ ...styles.statusBadge, backgroundColor: p.status === 'published' ? '#f0fdf4' : '#f8fafc', color: p.status === 'published' ? '#16a34a' : '#64748b' }}>
                        {p.status === 'published' ? '✅ Published' : '📝 Draft'}
                      </span>
                      {p.status === 'published' && (
                        <span style={{ ...styles.statusBadge, backgroundColor: p.show_answers ? '#fffbeb' : '#f0f9ff', color: p.show_answers ? '#92400e' : '#0369a1', fontSize: '10px' }}>
                          {p.show_answers ? '🔑 With Answers' : '🚫 No Answers'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={styles.paperCardFooter}>
                    <button style={styles.iconBtn} onClick={() => { setViewPaper(p); setViewMode('with') }}>👁️ View</button>
                    <button style={{ ...styles.iconBtn, color: '#4f46e5' }} onClick={() => printPaper(p, false)}>🖨️ Print</button>
                    <button style={{ ...styles.iconBtn, color: '#0891b2' }} onClick={() => printPaper(p, true)}>🔑 Ans Key</button>
                    <button style={styles.iconBtn} onClick={() => togglePublish(p)}>
                      {p.status === 'published' ? '📥 Unpublish' : '📤 Publish'}
                    </button>
                    <button style={{ ...styles.iconBtn, color: '#ef4444' }} onClick={() => deletePaper(p.id)}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {viewPaper && (
        <div style={styles.overlay} onClick={() => setViewPaper(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={{ margin: 0, fontWeight: '800' }}>{viewPaper.subject_name} — {viewPaper.exam_type}</h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>Class {viewPaper.class_id} • {viewPaper.total_marks} Marks</p>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ display: 'flex', backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '3px' }}>
                  <button onClick={() => setViewMode('with')} style={{ ...styles.viewToggleBtn, backgroundColor: viewMode === 'with' ? '#fff' : 'transparent', color: viewMode === 'with' ? '#4f46e5' : '#64748b' }}>🔑 With Answers</button>
                  <button onClick={() => setViewMode('without')} style={{ ...styles.viewToggleBtn, backgroundColor: viewMode === 'without' ? '#fff' : 'transparent', color: viewMode === 'without' ? '#4f46e5' : '#64748b' }}>📄 Student View</button>
                </div>
                <button style={styles.closeBtn} onClick={() => setViewPaper(null)}>✕</button>
              </div>
            </div>
            <pre style={styles.modalContent}>
              {viewMode === 'with' ? viewPaper.content : (viewPaper.content_clean || stripAnswers(viewPaper.content))}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: { maxWidth: '1100px', margin: '0 auto', padding: '20px', fontFamily: 'Inter, sans-serif' },
  pageHeader: { marginBottom: '32px' },
  pageTitle: { fontSize: '32px', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-1px' },
  pageSubtitle: { fontSize: '15px', color: '#64748b', marginTop: '4px' },
  tabContainer: { display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '12px', marginBottom: '32px', width: 'fit-content' },
  tab: { padding: '10px 24px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', transition: '0.2s' },
  card: { backgroundColor: '#fff', borderRadius: '20px', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' },
  cardSectionTitle: { fontSize: '13px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { padding: '12px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', backgroundColor: '#fcfcfd' },
  validatorBar: { padding: '12px 20px', borderRadius: '12px', fontSize: '13px' },
  generateBtn: { padding: '14px 32px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontSize: '15px' },
  outputHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' },
  editor: { width: '100%', minHeight: '600px', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', backgroundColor: '#fafafa', fontFamily: 'monospace', fontSize: '13px', lineHeight: '1.8', outline: 'none', boxSizing: 'border-box' },
  publishBtn: { padding: '10px 16px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' },
  draftBtn: { padding: '10px 16px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' },
  paperGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' },
  paperCard: { backgroundColor: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  paperCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', gap: '12px' },
  paperTitle: { fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 },
  paperMeta: { fontSize: '12px', color: '#64748b', margin: '4px 0 0' },
  statusBadge: { padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' },
  paperCardFooter: { display: 'flex', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '14px', flexWrap: 'wrap' },
  iconBtn: { background: 'none', border: 'none', fontSize: '12px', fontWeight: '700', cursor: 'pointer', color: '#64748b', padding: '4px 6px' },
  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '40px' },
  modal: { backgroundColor: '#fff', borderRadius: '24px', width: '100%', maxWidth: '820px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  modalHeader: { padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' },
  modalContent: { padding: '28px 32px', overflowY: 'auto', whiteSpace: 'pre-wrap', fontSize: '13.5px', lineHeight: '1.9', fontFamily: 'monospace' },
  closeBtn: { background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '14px' },
  viewToggleBtn: { padding: '6px 14px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', transition: '0.15s' },
  emptyState: { textAlign: 'center', padding: '100px', backgroundColor: '#f8fafc', borderRadius: '20px', border: '2px dashed #e2e8f0', color: '#64748b' },
}