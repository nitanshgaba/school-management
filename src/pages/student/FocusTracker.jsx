// // src/pages/student/FocusTracker.jsx
// import { useState, useRef, useEffect } from 'react'
// import { useAuth } from '../../context/AuthContext'
// import { useFocus } from '../../context/FocusContext'

// const GROQ_MODEL = 'llama-3.3-70b-versatile'

// export default function FocusTracker() {
//   const { profile } = useAuth()
//   const {
//     videoRef, canvasRef,
//     status, attention, sessSec, attSec, drwSec, disSec,
//     blinkCount, noFace, error,
//     startSession, stopSession, saveSession, getSnapshot
//   } = useFocus()

//   const [tab,      setTab]      = useState('live')
//   const [logs,     setLogs]     = useState([])
//   const [saving,   setSaving]   = useState(false)
//   const [aiRec,    setAiRec]    = useState('')
//   const [aiLoading,setAiLoading]= useState(false)
//   const [selLog,   setSelLog]   = useState(null)
//   const localCanvasRef = useRef(null)
//   const mirrorRafRef   = useRef(null)
//   const logsLoadedRef  = useRef(false)

//   // Mirror video to local canvas
//   useEffect(() => {
//     const drawLoop = () => {
//       const video  = videoRef.current
//       const canvas = localCanvasRef.current
//       if (video && canvas && status === 'running') {
//         const ctx = canvas.getContext('2d')
//         // Use mediapipe canvas if available (has video + dots), else raw video
//         if (canvasRef.current && canvasRef.current.width > 0) {
//           ctx.drawImage(canvasRef.current, 0, 0, canvas.width, canvas.height)
//         } else {
//           ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
//         }
//       }
//       mirrorRafRef.current = requestAnimationFrame(drawLoop)
//     }
//     if (status === 'running') {
//       drawLoop()
//     }
//     return () => cancelAnimationFrame(mirrorRafRef.current)
//   }, [status])

//   const fmt  = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`
//   const pct  = sessSec > 0 ? Math.round((attSec/sessSec)*100) : 0
//   const isDrowsy     = attention.includes('Drowsy')
//   const isDistracted = attention.includes('Distracted')
//   const stateColor   = isDrowsy ? '#ef4444' : isDistracted ? '#f59e0b' : '#22c55e'

//   const loadLogs = async () => {
//     if (logsLoadedRef.current) return
//     logsLoadedRef.current = true
//     const { supabase } = await import('../../lib/supabase')
//     const { data } = await supabase
//       .from('focus_logs').select('*')
//       .eq('student_id', profile.id)
//       .order('created_at', { ascending: false }).limit(20)
//     setLogs(data || [])
//   }

//   const handleTabChange = (t) => {
//     setTab(t)
//     if (t === 'history') loadLogs()
//   }

//   const handleStop = () => {
//     stopSession()
//     fetchAiRecommendation()
//   }

//   const fetchAiRecommendation = async () => {
//     const snap = getSnapshot()
//     if (snap.total < 10) return
//     setAiLoading(true)
//     const attPct = Math.round((snap.attentive/snap.total)*100)
//     const drwPct = Math.round((snap.drowsy/snap.total)*100)
//     const disPct = Math.round((snap.distracted/snap.total)*100)
//     const bpm    = snap.blinks > 0 ? Math.round(snap.blinks / (snap.total/60)) : 0
//     try {
//       const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`
//         },
//         body: JSON.stringify({
//           model: GROQ_MODEL,
//           max_tokens: 200,
//           messages: [{
//             role: 'user',
//             content: `A student just finished a ${fmt(snap.total)} study session. Stats: ${attPct}% attentive, ${drwPct}% drowsy, ${disPct}% distracted, blink rate ${bpm}/min. Give 2-3 short, practical, friendly recommendations to improve focus. Be concise and specific. No bullet points, just plain sentences.`
//           }]
//         })
//       })
//       const data = await res.json()
//       setAiRec(data.choices?.[0]?.message?.content || '')
//     } catch(e) { console.error(e) }
//     setAiLoading(false)
//   }

//   const handleSave = async () => {
//     setSaving(true)
//     logsLoadedRef.current = false
//     const ok = await saveSession(profile.id, aiRec)
//     if (ok) { setAiRec(''); await loadLogs(); setTab('history') }
//     setSaving(false)
//   }

//   // ── Timeline heatmap renderer ─────────────────────────────────
//   const TimelineHeatmap = ({ timeline, compact }) => {
//     if (!timeline || timeline.length === 0) return null
//     const blockW = compact ? 6 : 10
//     const blockH = compact ? 10 : 16
//     const gap    = 2
//     const cols   = compact ? 60 : 40
//     const rows   = Math.ceil(timeline.length / cols)
//     const colorMap = { A:'#22c55e', D:'#ef4444', S:'#f59e0b', undefined:'#e2e8f0' }
//     return (
//       <div>
//         {!compact && (
//           <div style={{ display:'flex', gap:'12px', marginBottom:'8px', flexWrap:'wrap' }}>
//             {[['#22c55e','Attentive'],['#ef4444','Drowsy'],['#f59e0b','Distracted']].map(([c,l])=>(
//               <div key={l} style={{ display:'flex', alignItems:'center', gap:'5px' }}>
//                 <div style={{ width:'10px', height:'10px', borderRadius:'2px', background:c }} />
//                 <span style={{ fontSize:'11px', color:'#64748b', fontWeight:'600' }}>{l}</span>
//               </div>
//             ))}
//           </div>
//         )}
//         <div style={{ display:'flex', flexWrap:'wrap', gap:`${gap}px` }}>
//           {timeline.map((s,i) => (
//             <div key={i} title={`${fmt(i)} — ${s==='A'?'Attentive':s==='D'?'Drowsy':'Distracted'}`}
//               style={{ width:blockW, height:blockH, borderRadius:'2px', background:colorMap[s], flexShrink:0 }} />
//           ))}
//         </div>
//         {!compact && (
//           <div style={{ display:'flex', justifyContent:'space-between', marginTop:'4px' }}>
//             <span style={{ fontSize:'10px', color:'#94a3b8' }}>0:00</span>
//             <span style={{ fontSize:'10px', color:'#94a3b8' }}>{fmt(timeline.length)}</span>
//           </div>
//         )}
//       </div>
//     )
//   }

//   const snap = status === 'stopped' ? getSnapshot() : null

//   return (
//     <div style={S.page}>
//       <div style={S.header}>
//         <h2 style={S.title}>👁️ Focus Tracker</h2>
//         <p style={S.sub}>Real-time attention monitoring · Eye tracking · Head pose · Blink detection</p>
//       </div>

//       <div style={S.tabs}>
//         {[['live','🎥 Live Session'],['history','📋 History']].map(([t,l]) => (
//           <button key={t} onClick={()=>handleTabChange(t)} style={{...S.tab,...(tab===t?S.tabActive:{})}}>{l}</button>
//         ))}
//       </div>

//       {tab==='live' && (
//         <div style={S.liveWrap}>
//           {/* Camera feed */}
//           <div style={{ position:'relative', background:'#0f172a', borderRadius:'12px', overflow:'hidden', minHeight:'240px' }}>
//             <canvas ref={localCanvasRef} width={640} height={480}
//               style={{ width:'100%', borderRadius:'12px', display: status==='running'?'block':'none' }} />
//             {status !== 'running' && (
//               <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'240px' }}>
//                 <span style={{ fontSize:'40px' }}>📷</span>
//                 <p style={{ color:'#94a3b8', margin:'8px 0 0', fontSize:'14px' }}>Camera preview will appear here</p>
//               </div>
//             )}
//           </div>

//           {/* Status banner */}
//           {status==='running' && (
//             <div style={{...S.banner, background: isDrowsy?'#fef2f2':isDistracted?'#fffbeb':'#f0fdf4',
//               border:`1px solid ${isDrowsy?'#fca5a5':isDistracted?'#fde68a':'#86efac'}`}}>
//               <span style={{ fontSize:'28px' }}>{isDrowsy?'😴':isDistracted?'👀':'😊'}</span>
//               <div>
//                 <p style={{ margin:0, fontWeight:'800', fontSize:'18px', color:stateColor }}>{attention}</p>
//                 <p style={{ margin:'2px 0 0', fontSize:'13px', color:'#64748b' }}>
//                   {isDrowsy?'Eyes closing detected — take a break!':isDistracted?'Looking away — stay focused!':'Keep it up!'}
//                 </p>
//               </div>
//               {noFace && <span style={S.noFaceBadge}>⚠️ No face</span>}
//             </div>
//           )}

//           {/* Stats */}
//           <div style={S.statsRow}>
//             {[
//               { label:'Session',    value:fmt(sessSec),  color:'#6366f1', bg:'#eef2ff' },
//               { label:'Attentive',  value:fmt(attSec),   color:'#16a34a', bg:'#f0fdf4' },
//               { label:'Drowsy',     value:fmt(drwSec),   color:'#ef4444', bg:'#fef2f2' },
//               { label:'Distracted', value:fmt(disSec),   color:'#f59e0b', bg:'#fffbeb' },
//               { label:'Blinks',     value:blinkCount,    color:'#0ea5e9', bg:'#f0f9ff' },
//               { label:'Focus',      value:`${pct}%`,     color: pct>70?'#16a34a':pct>40?'#f59e0b':'#ef4444', bg:'#f8fafc' },
//             ].map(s=>(
//               <div key={s.label} style={{...S.statCard, background:s.bg}}>
//                 <p style={{ margin:0, fontSize:'11px', color:'#6b7280', fontWeight:'700', textTransform:'uppercase' }}>{s.label}</p>
//                 <p style={{ margin:'4px 0 0', fontSize:'22px', fontWeight:'800', color:s.color }}>{s.value}</p>
//               </div>
//             ))}
//           </div>

//           {/* Live timeline */}
//           {status==='running' && sessSec > 0 && (
//             <div style={S.card}>
//               <p style={S.cardTitle}>Live Timeline</p>
//               <TimelineHeatmap timeline={getSnapshot().timeline} compact={true} />
//             </div>
//           )}

//           {/* Progress bar */}
//           {sessSec > 0 && (
//             <div style={S.card}>
//               <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
//                 <span style={{ fontSize:'13px', fontWeight:'700', color:'#374151' }}>Attention Score</span>
//                 <span style={{ fontSize:'13px', fontWeight:'800', color: pct>70?'#16a34a':pct>40?'#f59e0b':'#ef4444' }}>{pct}%</span>
//               </div>
//               <div style={S.progressBar}>
//                 <div style={{...S.progressFill, width:`${pct}%`,
//                   background: pct>70?'#22c55e':pct>40?'#f59e0b':'#ef4444'}} />
//               </div>
//               <div style={{ display:'flex', justifyContent:'space-between', marginTop:'6px' }}>
//                 <span style={{ fontSize:'11px', color:'#94a3b8' }}>0%</span>
//                 <span style={{ fontSize:'11px', color:'#94a3b8' }}>100%</span>
//               </div>
//             </div>
//           )}

//           {/* AI Recommendation (after stop) */}
//           {status==='stopped' && (
//             <div style={{...S.card, border:'1px solid #e0e7ff', background:'#fafafe'}}>
//               <p style={{...S.cardTitle, color:'#6366f1'}}>🤖 AI Recommendation</p>
//               {aiLoading ? (
//                 <p style={{ color:'#94a3b8', fontSize:'14px' }}>Analyzing your session...</p>
//               ) : aiRec ? (
//                 <p style={{ color:'#374151', fontSize:'14px', lineHeight:1.7, margin:0 }}>{aiRec}</p>
//               ) : (
//                 <p style={{ color:'#94a3b8', fontSize:'14px' }}>Session too short for analysis.</p>
//               )}
//             </div>
//           )}

//           {/* Stopped timeline */}
//           {status==='stopped' && snap && snap.timeline.length > 0 && (
//             <div style={S.card}>
//               <p style={S.cardTitle}>Session Timeline</p>
//               <TimelineHeatmap timeline={snap.timeline} compact={false} />
//             </div>
//           )}

//           {error && <div style={S.error}>{error}</div>}

//           {/* Buttons */}
//           <div style={S.btnRow}>
//             {status==='idle'    && <button style={S.btnStart} onClick={startSession}>▶ Start Session</button>}
//             {status==='loading' && <button style={{...S.btnStart,opacity:0.6}} disabled>Loading MediaPipe...</button>}
//             {status==='running' && <button style={S.btnStop}  onClick={handleStop}>⏹ Stop Session</button>}
//             {status==='stopped' && <>
//               <button style={S.btnSave}  onClick={handleSave} disabled={saving||aiLoading}>{saving?'Saving...':'💾 Save Session'}</button>
//               <button style={S.btnStart} onClick={()=>{setAiRec('');startSession()}}>🔄 New Session</button>
//             </>}
//           </div>

//           {status==='idle' && (
//             <div style={S.tip}>
//               💡 Tip: Keep your face visible in the webcam. The tracker detects drowsiness, distractions, and blink rate.
//             </div>
//           )}
//         </div>
//       )}

//       {tab==='history' && (
//         <div>
//           {logs.length===0 ? (
//             <div style={S.empty}><span style={{fontSize:'40px'}}>📭</span><p>No sessions yet.</p></div>
//           ) : (
//             <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
//               {logs.map(log => {
//                 const p = log.attention_percent
//                 const c = p>70?'#16a34a':p>40?'#f59e0b':'#ef4444'
//                 const open = selLog===log.id
//                 return (
//                   <div key={log.id} style={S.logCard}>
//                     <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer' }}
//                       onClick={()=>setSelLog(open?null:log.id)}>
//                       <div>
//                         <span style={{ fontWeight:'700', color:'#1e293b', fontSize:'15px' }}>{log.session_date}</span>
//                         <div style={{ display:'flex', gap:'14px', marginTop:'6px' }}>
//                           <span style={S.logStat}>⏱ {fmt(log.duration_seconds)}</span>
//                           <span style={{...S.logStat,color:'#16a34a'}}>✅ {fmt(log.attentive_seconds)}</span>
//                           <span style={{...S.logStat,color:'#ef4444'}}>😴 {fmt(log.drowsy_seconds)}</span>
//                           {log.distracted_seconds>0 && <span style={{...S.logStat,color:'#f59e0b'}}>👀 {fmt(log.distracted_seconds)}</span>}
//                           {log.blink_count>0 && <span style={S.logStat}>👁 {log.blink_count} blinks</span>}
//                         </div>
//                       </div>
//                       <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
//                         <span style={{...S.scoreBadge,background:`${c}15`,color:c}}>{p}%</span>
//                         <span style={{ color:'#94a3b8', fontSize:'18px' }}>{open?'▲':'▼'}</span>
//                       </div>
//                     </div>
//                     {open && (
//                       <div style={{ marginTop:'14px', borderTop:'1px solid #f1f5f9', paddingTop:'14px' }}>
//                         {log.timeline?.length > 0 && (
//                           <div style={{ marginBottom:'14px' }}>
//                             <p style={{ margin:'0 0 8px', fontSize:'12px', fontWeight:'700', color:'#64748b', textTransform:'uppercase' }}>Session Timeline</p>
//                             <TimelineHeatmap timeline={log.timeline} compact={false} />
//                           </div>
//                         )}
//                         {log.ai_recommendation && (
//                           <div style={{ background:'#fafafe', border:'1px solid #e0e7ff', borderRadius:'8px', padding:'12px' }}>
//                             <p style={{ margin:'0 0 6px', fontSize:'12px', fontWeight:'700', color:'#6366f1', textTransform:'uppercase' }}>🤖 AI Recommendation</p>
//                             <p style={{ margin:0, fontSize:'13px', color:'#374151', lineHeight:1.7 }}>{log.ai_recommendation}</p>
//                           </div>
//                         )}
//                       </div>
//                     )}
//                   </div>
//                 )
//               })}
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   )
// }

// const S = {
//   page:        { maxWidth:'860px', margin:'0 auto' },
//   header:      { marginBottom:'20px' },
//   title:       { margin:0, fontSize:'22px', fontWeight:'800', color:'#1e293b' },
//   sub:         { margin:'4px 0 0', color:'#64748b', fontSize:'14px' },
//   tabs:        { display:'flex', gap:'8px', marginBottom:'20px' },
//   tab:         { padding:'8px 20px', borderRadius:'8px', border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer', fontSize:'14px', fontWeight:'600', color:'#64748b' },
//   tabActive:   { background:'#6366f1', color:'#fff', border:'1px solid #6366f1' },
//   liveWrap:    { display:'flex', flexDirection:'column', gap:'16px' },
//   banner:      { borderRadius:'12px', padding:'16px 20px', display:'flex', alignItems:'center', gap:'14px' },
//   noFaceBadge: { marginLeft:'auto', background:'#fef3c7', color:'#92400e', padding:'4px 12px', borderRadius:'20px', fontSize:'12px', fontWeight:'700' },
//   statsRow:    { display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:'10px' },
//   statCard:    { borderRadius:'10px', padding:'12px', textAlign:'center' },
//   card:        { background:'#fff', borderRadius:'10px', padding:'16px', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' },
//   cardTitle:   { margin:'0 0 10px', fontSize:'13px', fontWeight:'700', color:'#374151', textTransform:'uppercase' },
//   progressBar: { height:'10px', background:'#e2e8f0', borderRadius:'5px', overflow:'hidden' },
//   progressFill:{ height:'100%', borderRadius:'5px', transition:'width 0.5s' },
//   error:       { background:'#fef2f2', color:'#dc2626', padding:'12px 16px', borderRadius:'8px', fontSize:'14px' },
//   btnRow:      { display:'flex', gap:'12px', flexWrap:'wrap' },
//   btnStart:    { padding:'12px 28px', background:'#6366f1', color:'#fff', border:'none', borderRadius:'8px', fontSize:'15px', fontWeight:'700', cursor:'pointer' },
//   btnStop:     { padding:'12px 28px', background:'#ef4444', color:'#fff', border:'none', borderRadius:'8px', fontSize:'15px', fontWeight:'700', cursor:'pointer' },
//   btnSave:     { padding:'12px 28px', background:'#22c55e', color:'#fff', border:'none', borderRadius:'8px', fontSize:'15px', fontWeight:'700', cursor:'pointer' },
//   tip:         { background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'8px', padding:'12px 16px', fontSize:'13px', color:'#64748b' },
//   empty:       { textAlign:'center', padding:'60px', color:'#94a3b8' },
//   logCard:     { background:'#fff', borderRadius:'10px', padding:'16px', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' },
//   scoreBadge:  { padding:'4px 12px', borderRadius:'20px', fontSize:'13px', fontWeight:'700' },
//   logStat:     { fontSize:'13px', fontWeight:'600', color:'#475569' },
// }







// src/pages/student/FocusTracker.jsx
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useFocus } from '../../context/FocusContext'

const GROQ_MODEL = 'llama-3.3-70b-versatile'

// ── Report Generator ─────────────────────────────────────────────
function generateResearchReport(snap, aiRec, sessionDate) {
  const fmt = s =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  const bpm = f =>
    f.total > 0 ? Math.round(f.blinks / (f.total / 60)) : 0

  const lines = []
  lines.push('═'.repeat(70))
  lines.push('   MULTI-FACE FOCUS TRACKING — RESEARCH REPORT')
  lines.push('   Powered by MediaPipe FaceMesh (Google) + Groq LLaMA-3.3-70B')
  lines.push('═'.repeat(70))
  lines.push('')
  lines.push(`  Session Date   : ${sessionDate}`)
  lines.push(`  Session Length : ${fmt(snap.total)}`)
  lines.push(`  Faces Tracked  : ${snap.faceCount}`)
  lines.push(`  Analysis Tool  : MediaPipe FaceMesh (maxNumFaces=6)`)
  lines.push(`  Metrics        : EAR, Head Yaw/Pitch, Blink Rate`)
  lines.push('')
  lines.push('─'.repeat(70))
  lines.push('  AGGREGATE STATISTICS (All Faces Combined)')
  lines.push('─'.repeat(70))
  const aggTotal = snap.total || 1
  lines.push(`  Total Attentive  : ${fmt(snap.attentive)}  (${Math.round((snap.attentive/aggTotal)*100)}%)`)
  lines.push(`  Total Drowsy     : ${fmt(snap.drowsy)}   (${Math.round((snap.drowsy/aggTotal)*100)}%)`)
  lines.push(`  Total Distracted : ${fmt(snap.distracted)} (${Math.round((snap.distracted/aggTotal)*100)}%)`)
  lines.push(`  Total Blinks     : ${snap.blinks}`)
  lines.push('')

  snap.perFace.forEach((f, i) => {
    lines.push('─'.repeat(70))
    lines.push(`  FACE ${i + 1} — Individual Analysis`)
    lines.push('─'.repeat(70))
    lines.push(`  Session Duration   : ${fmt(f.total)}`)
    lines.push(`  Attentive          : ${fmt(f.attSec)}  (${f.attPct}%)`)
    lines.push(`  Drowsy             : ${fmt(f.drwSec)}  (${f.drwPct}%)`)
    lines.push(`  Distracted         : ${fmt(f.disSec)}  (${f.disPct}%)`)
    lines.push(`  Blink Count        : ${f.blinks}`)
    lines.push(`  Avg Blink Rate     : ${bpm(f)} blinks/min`)
    lines.push(`  Focus Score        : ${f.attPct}%`)

    // Performance rating
    const rating = f.attPct >= 80 ? 'Excellent' :
                   f.attPct >= 60 ? 'Good' :
                   f.attPct >= 40 ? 'Moderate' : 'Poor'
    lines.push(`  Performance Rating : ${rating}`)

    // Timeline summary (chunked into 1-min blocks)
    if (f.timeline && f.timeline.length > 0) {
      lines.push('')
      lines.push('  Minute-by-Minute Breakdown:')
      const mins = Math.ceil(f.timeline.length / 60)
      for (let m = 0; m < mins; m++) {
        const chunk = f.timeline.slice(m * 60, (m + 1) * 60)
        const a = chunk.filter(x => x === 'A').length
        const d = chunk.filter(x => x === 'D').length
        const s = chunk.filter(x => x === 'S').length
        const pct = Math.round((a / chunk.length) * 100)
        const bar = '█'.repeat(Math.round(pct / 5)) +
                    '░'.repeat(20 - Math.round(pct / 5))
        lines.push(
          `    Min ${String(m + 1).padStart(2, '0')}  [${bar}] ${pct}%` +
          `  A:${a} D:${d} S:${s}`
        )
      }
    }
    lines.push('')
  })

  // Comparative table if multi-face
  if (snap.perFace.length > 1) {
    lines.push('─'.repeat(70))
    lines.push('  COMPARATIVE FACE ANALYSIS TABLE')
    lines.push('─'.repeat(70))
    lines.push(
      '  ' +
      'Face'.padEnd(8) +
      'Duration'.padEnd(12) +
      'Attentive%'.padEnd(14) +
      'Drowsy%'.padEnd(12) +
      'Distracted%'.padEnd(14) +
      'Blinks'.padEnd(10) +
      'Rating'
    )
    lines.push('  ' + '─'.repeat(68))
    snap.perFace.forEach((f, i) => {
      const rating = f.attPct >= 80 ? 'Excellent' :
                     f.attPct >= 60 ? 'Good' :
                     f.attPct >= 40 ? 'Moderate' : 'Poor'
      lines.push(
        '  ' +
        `Face ${i+1}`.padEnd(8) +
        fmt(f.total).padEnd(12) +
        `${f.attPct}%`.padEnd(14) +
        `${f.drwPct}%`.padEnd(12) +
        `${f.disPct}%`.padEnd(14) +
        `${f.blinks}`.padEnd(10) +
        rating
      )
    })
    lines.push('')

    // Cross-face correlation note
    const avgAtt = Math.round(
      snap.perFace.reduce((s, f) => s + f.attPct, 0) / snap.perFace.length
    )
    lines.push(`  Group Average Focus Score : ${avgAtt}%`)
    const best = snap.perFace.reduce((b, f) => (f.attPct > b.attPct ? f : b))
    const worst = snap.perFace.reduce((b, f) => (f.attPct < b.attPct ? f : b))
    lines.push(`  Highest Focus            : ${best.id.replace('_',' ')} (${best.attPct}%)`)
    lines.push(`  Lowest Focus             : ${worst.id.replace('_',' ')} (${worst.attPct}%)`)
  }

  lines.push('')
  lines.push('─'.repeat(70))
  lines.push('  METHODOLOGY & ACCURACY NOTES')
  lines.push('─'.repeat(70))
  lines.push('  • Eye Aspect Ratio (EAR): Drowsiness threshold < 0.18')
  lines.push('    Formula: EAR = (|p2−p6| + |p3−p5|) / (2|p1−p4|)')
  lines.push('    Reference: Soukupova & Cech, EECVCW 2016')
  lines.push('')
  lines.push('  • Head Pose (Yaw/Pitch): Distraction threshold |yaw| > 0.25')
  lines.push('    Landmark-based 2D proxy (no full PnP — approx. ±5°)')
  lines.push('')
  lines.push('  • Blink Rate: Normal = 12–20 blinks/min')
  lines.push('    High rate (>25) may indicate stress/fatigue')
  lines.push('    Low rate (<8) may indicate screen strain')
  lines.push('')
  lines.push('  • FaceMesh: 468 landmarks per face @ ~30FPS in browser')
  lines.push('  • Multi-face: Up to 6 simultaneous faces supported')
  lines.push('  • Known Limitations:')
  lines.push('    - Accuracy drops in low-light conditions')
  lines.push('    - Profile angles >45° reduce detection reliability')
  lines.push('    - EAR varies ±0.02 across ethnicities (calibration advised)')
  lines.push('    - Browser tab switching undetectable without focus events')
  lines.push('')
  lines.push('─'.repeat(70))
  lines.push('  AI RECOMMENDATIONS (Groq LLaMA-3.3-70B)')
  lines.push('─'.repeat(70))
  lines.push('')
  const wrapped = (aiRec || 'No AI recommendation generated.')
    .match(/.{1,65}(\s|$)/g) || []
  wrapped.forEach(line => lines.push('  ' + line.trim()))
  lines.push('')
  lines.push('─'.repeat(70))
  lines.push('  CITATION / REPRODUCIBILITY')
  lines.push('─'.repeat(70))
  lines.push('  Dataset       : Real-time webcam (no stored video)')
  lines.push('  Framework     : MediaPipe FaceMesh v0.4 (Google LLC, 2020)')
  lines.push('  Classification: Rule-based (EAR + Head Pose thresholds)')
  lines.push('  AI Analysis   : Groq API, LLaMA-3.3-70B-Versatile')
  lines.push(`  Generated At  : ${new Date().toISOString()}`)
  lines.push('')
  lines.push('═'.repeat(70))
  lines.push('  END OF REPORT')
  lines.push('═'.repeat(70))

  return lines.join('\n')
}

// ── Download helpers ─────────────────────────────────────────────
function downloadTXT(content, filename) {
  const blob = new Blob([content], { type: 'text/plain' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function downloadCSV(snap, sessionDate) {
  const fmt = s =>
    `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`
  const rows = [
    ['face_id','duration_sec','attentive_sec','drowsy_sec',
     'distracted_sec','att_pct','drw_pct','dis_pct','blinks','bpm','rating'],
    ...snap.perFace.map(f => {
      const bpm = f.total > 0 ? Math.round(f.blinks/(f.total/60)) : 0
      const rating = f.attPct >= 80 ? 'Excellent' :
                     f.attPct >= 60 ? 'Good' :
                     f.attPct >= 40 ? 'Moderate' : 'Poor'
      return [f.id, f.total, f.attSec, f.drwSec, f.disSec,
              f.attPct, f.drwPct, f.disPct, f.blinks, bpm, rating]
    })
  ]
  const csv = rows.map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `focus_report_${sessionDate}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Timeline Heatmap ─────────────────────────────────────────────
function TimelineHeatmap({ timeline, compact }) {
  if (!timeline || timeline.length === 0) return null
  const fmt = s =>
    `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`
  const blockW  = compact ? 6  : 10
  const blockH  = compact ? 10 : 16
  const gap     = 2
  const colorMap = { A: '#22c55e', D: '#ef4444', S: '#f59e0b', undefined: '#e2e8f0' }

  return (
    <div>
      {!compact && (
        <div style={{ display:'flex', gap:'12px', marginBottom:'8px', flexWrap:'wrap' }}>
          {[['#22c55e','Attentive'],['#ef4444','Drowsy'],['#f59e0b','Distracted']].map(([c,l])=>(
            <div key={l} style={{ display:'flex', alignItems:'center', gap:'5px' }}>
              <div style={{ width:'10px', height:'10px', borderRadius:'2px', background:c }} />
              <span style={{ fontSize:'11px', color:'#64748b', fontWeight:'600' }}>{l}</span>
            </div>
          ))}
        </div>
      )}
      <div style={{ display:'flex', flexWrap:'wrap', gap:`${gap}px` }}>
        {timeline.map((s,i)=>(
          <div key={i}
            title={`${fmt(i)} — ${s==='A'?'Attentive':s==='D'?'Drowsy':'Distracted'}`}
            style={{
              width: blockW, height: blockH, borderRadius: '2px',
              background: colorMap[s], flexShrink: 0
            }} />
        ))}
      </div>
      {!compact && (
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:'4px' }}>
          <span style={{ fontSize:'10px', color:'#94a3b8' }}>0:00</span>
          <span style={{ fontSize:'10px', color:'#94a3b8' }}>{fmt(timeline.length)}</span>
        </div>
      )}
    </div>
  )
}

// ── Face Card ────────────────────────────────────────────────────
function FaceCard({ faceId, data, index, sessSec }) {
  const fmt = s =>
    `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`
  const isDrowsy     = data.attention === 'Drowsy'
  const isDistracted = data.attention === 'Distracted'
  const color = isDrowsy ? '#ef4444' : isDistracted ? '#f59e0b' : '#22c55e'
  const pct = sessSec > 0 ? Math.round((data.attSec / sessSec) * 100) : 0

  return (
    <div style={{
      background: '#fff',
      border: `2px solid ${color}33`,
      borderRadius: '12px',
      padding: '14px',
      minWidth: '180px',
      flex: '1'
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontWeight:'800', fontSize:'14px', color:'#1e293b' }}>
          👤 Face {index + 1}
        </span>
        <span style={{
          background: `${color}18`, color, padding:'3px 10px',
          borderRadius:'20px', fontSize:'11px', fontWeight:'700'
        }}>
          {data.attention}
        </span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px', marginTop:'10px' }}>
        {[
          { l: 'Attentive', v: fmt(data.attSec), c:'#16a34a' },
          { l: 'Drowsy',    v: fmt(data.drwSec), c:'#ef4444' },
          { l: 'Distracted',v: fmt(data.disSec), c:'#f59e0b' },
          { l: 'Blinks',    v: data.blinks,      c:'#0ea5e9' },
        ].map(s=>(
          <div key={s.l} style={{ background:'#f8fafc', borderRadius:'6px', padding:'6px' }}>
            <p style={{ margin:0, fontSize:'10px', color:'#94a3b8', fontWeight:'700',
              textTransform:'uppercase' }}>{s.l}</p>
            <p style={{ margin:'2px 0 0', fontSize:'15px', fontWeight:'800', color:s.c }}>
              {s.v}
            </p>
          </div>
        ))}
      </div>
      <div style={{ marginTop:'8px' }}>
        <div style={{ height:'6px', background:'#e2e8f0', borderRadius:'3px', overflow:'hidden' }}>
          <div style={{
            height:'100%', borderRadius:'3px',
            width:`${pct}%`,
            background: pct>70?'#22c55e':pct>40?'#f59e0b':'#ef4444',
            transition:'width 0.5s'
          }} />
        </div>
        <p style={{ margin:'3px 0 0', fontSize:'10px', color:'#64748b', textAlign:'right' }}>
          {pct}% focus
        </p>
      </div>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────
export default function FocusTracker() {
  const { profile } = useAuth()
  const {
    videoRef, canvasRef,
    status, sessSec, faceCount, noFace, error,
    facesState,
    startSession, stopSession, saveSession, getSnapshot
  } = useFocus()

  const [tab,        setTab]       = useState('live')
  const [logs,       setLogs]      = useState([])
  const [saving,     setSaving]    = useState(false)
  const [aiRec,      setAiRec]     = useState('')
  const [aiLoading,  setAiLoading] = useState(false)
  const [selLog,     setSelLog]    = useState(null)
  const [reportText, setReportText]= useState('')
  const [showReport, setShowReport]= useState(false)
  const localCanvasRef = useRef(null)
  const mirrorRafRef   = useRef(null)
  const logsLoadedRef  = useRef(false)

  const fmt = s =>
    `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

  const snap = status === 'stopped' ? getSnapshot() : null

  // Mirror mediapipe canvas
  useEffect(()=>{
    const drawLoop = () => {
      const canvas = localCanvasRef.current
      if (canvas && canvasRef.current && status === 'running') {
        const ctx = canvas.getContext('2d')
        if (canvasRef.current.width > 0) {
          canvas.width  = canvasRef.current.width
          canvas.height = canvasRef.current.height
          ctx.drawImage(canvasRef.current, 0, 0)
        }
      }
      mirrorRafRef.current = requestAnimationFrame(drawLoop)
    }
    if (status === 'running') drawLoop()
    return () => cancelAnimationFrame(mirrorRafRef.current)
  }, [status])

  const loadLogs = async () => {
    if (logsLoadedRef.current) return
    logsLoadedRef.current = true
    const { supabase } = await import('../../lib/supabase')
    const { data } = await supabase
      .from('focus_logs').select('*')
      .eq('student_id', profile.id)
      .order('created_at', { ascending: false }).limit(20)
    setLogs(data || [])
  }

  const handleTabChange = t => {
    setTab(t)
    if (t === 'history') loadLogs()
  }

  const handleStop = () => {
    stopSession()
    fetchAiRecommendation()
  }

  const fetchAiRecommendation = async () => {
    const s = getSnapshot()
    if (s.total < 10) return
    setAiLoading(true)
    const total  = s.total || 1
    const attPct = Math.round((s.attentive / total) * 100)
    const drwPct = Math.round((s.drowsy    / total) * 100)
    const disPct = Math.round((s.distracted/ total) * 100)
    const bpm    = s.blinks > 0 ? Math.round(s.blinks / (total / 60)) : 0
    const faceNote = s.faceCount > 1
      ? ` ${s.faceCount} faces were tracked simultaneously.`
      : ''

    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          max_tokens: 300,
          messages: [{
            role: 'user',
            content:
              `A student just finished a ${fmt(total)} study session.${faceNote} ` +
              `Stats: ${attPct}% attentive, ${drwPct}% drowsy, ${disPct}% distracted, ` +
              `blink rate ${bpm}/min. ` +
              `Give 2-3 short, practical, friendly recommendations to improve focus. ` +
              `Be concise and specific. No bullet points, just plain sentences.`
          }]
        })
      })
      const data = await res.json()
      setAiRec(data.choices?.[0]?.message?.content || '')
    } catch(e) { console.error(e) }
    setAiLoading(false)
  }

  const handleGenerateReport = () => {
    const s = getSnapshot()
    const date = new Date().toLocaleDateString()
    const report = generateResearchReport(s, aiRec, date)
    setReportText(report)
    setShowReport(true)
  }

  const handleSave = async () => {
    setSaving(true)
    logsLoadedRef.current = false
    const ok = await saveSession(profile.id, aiRec)
    if (ok) {
      setAiRec('')
      await loadLogs()
      setTab('history')
    }
    setSaving(false)
  }

  // Aggregate stats from facesState for live view
  const liveFaceIds = Object.keys(facesState)
  const liveAggAtt = liveFaceIds.reduce((s,id)=>s+(facesState[id]?.attSec||0),0)
  const livePct = sessSec > 0
    ? Math.round((liveAggAtt / (sessSec * Math.max(faceCount, 1))) * 100)
    : 0

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h2 style={S.title}>👁️ Focus Tracker</h2>
        <p style={S.sub}>
          Multi-face · Real-time attention · Eye tracking · Head pose · Blink detection
        </p>
      </div>

      <div style={S.tabs}>
        {[['live','🎥 Live Session'],['history','📋 History'],['report','📄 Report']].map(([t,l])=>(
          <button key={t} onClick={()=>handleTabChange(t)}
            style={{...S.tab,...(tab===t?S.tabActive:{})}}>
            {l}
          </button>
        ))}
      </div>

      {/* ── LIVE TAB ── */}
      {tab==='live' && (
        <div style={S.liveWrap}>
          {/* Camera */}
          <div style={{ position:'relative', background:'#0f172a',
            borderRadius:'12px', overflow:'hidden', minHeight:'240px' }}>
            <video ref={videoRef} style={{ display:'none' }} playsInline muted />
            <canvas ref={canvasRef} style={{ display:'none' }} />
            <canvas ref={localCanvasRef}
              style={{ width:'100%', borderRadius:'12px',
                display: status==='running'?'block':'none' }} />
            {status !== 'running' && (
              <div style={{ display:'flex', flexDirection:'column',
                alignItems:'center', justifyContent:'center', height:'240px' }}>
                <span style={{ fontSize:'40px' }}>📷</span>
                <p style={{ color:'#94a3b8', margin:'8px 0 0', fontSize:'14px' }}>
                  Camera preview will appear here
                </p>
              </div>
            )}
            {/* Face count badge */}
            {status==='running' && faceCount > 0 && (
              <div style={S.faceCountBadge}>
                👤×{faceCount}
              </div>
            )}
          </div>

          {/* No-face warning */}
          {status==='running' && noFace && (
            <div style={{ background:'#fef3c7', border:'1px solid #fde68a',
              borderRadius:'8px', padding:'10px 16px', fontSize:'13px', color:'#92400e' }}>
              ⚠️ No face detected — please stay in frame
            </div>
          )}

          {/* Multi-face cards */}
          {status==='running' && liveFaceIds.length > 0 && (
            <div style={{ display:'flex', gap:'12px', flexWrap:'wrap' }}>
              {liveFaceIds.map((id, i) => (
                <FaceCard key={id} faceId={id} data={facesState[id]}
                  index={i} sessSec={sessSec} />
              ))}
            </div>
          )}

          {/* Aggregate stats bar */}
          {sessSec > 0 && (
            <div style={S.card}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
                <span style={{ fontSize:'13px', fontWeight:'700', color:'#374151' }}>
                  Aggregate Attention Score
                  {faceCount > 1 && (
                    <span style={{ marginLeft:'8px', fontSize:'11px',
                      color:'#6366f1', fontWeight:'600' }}>
                      ({faceCount} faces)
                    </span>
                  )}
                </span>
                <span style={{ fontSize:'13px', fontWeight:'800',
                  color: livePct>70?'#16a34a':livePct>40?'#f59e0b':'#ef4444' }}>
                  {livePct}%
                </span>
              </div>
              <div style={S.progressBar}>
                <div style={{...S.progressFill, width:`${livePct}%`,
                  background: livePct>70?'#22c55e':livePct>40?'#f59e0b':'#ef4444'}} />
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:'6px' }}>
                <span style={{ fontSize:'11px', color:'#94a3b8' }}>Session: {fmt(sessSec)}</span>
                <span style={{ fontSize:'11px', color:'#94a3b8' }}>Faces: {faceCount}</span>
              </div>
            </div>
          )}

          {/* Live timeline (face 0) */}
          {status==='running' && sessSec > 0 && liveFaceIds.length > 0 && (
            <div style={S.card}>
              <p style={S.cardTitle}>
                Live Timeline — Face 1
              </p>
              <TimelineHeatmap
                timeline={getSnapshot().perFace?.[0]?.timeline}
                compact={true} />
            </div>
          )}

          {/* AI Rec */}
          {status==='stopped' && (
            <div style={{...S.card, border:'1px solid #e0e7ff', background:'#fafafe'}}>
              <p style={{...S.cardTitle, color:'#6366f1'}}>🤖 AI Recommendation</p>
              {aiLoading
                ? <p style={{ color:'#94a3b8', fontSize:'14px' }}>Analyzing your session...</p>
                : aiRec
                  ? <p style={{ color:'#374151', fontSize:'14px',
                      lineHeight:1.7, margin:0 }}>{aiRec}</p>
                  : <p style={{ color:'#94a3b8', fontSize:'14px' }}>
                      Session too short for analysis.
                    </p>
              }
            </div>
          )}

          {/* Stopped per-face summary */}
          {status==='stopped' && snap && snap.perFace.length > 0 && (
            <div style={S.card}>
              <p style={S.cardTitle}>Per-Face Summary</p>
              <div style={{ display:'flex', gap:'12px', flexWrap:'wrap' }}>
                {snap.perFace.map((f,i) => (
                  <div key={f.id} style={{ flex:'1', minWidth:'160px',
                    background:'#f8fafc', borderRadius:'8px', padding:'12px' }}>
                    <p style={{ margin:'0 0 8px', fontWeight:'700',
                      color:'#1e293b', fontSize:'13px' }}>Face {i+1}</p>
                    {[
                      ['Attentive', fmt(f.attSec), `${f.attPct}%`, '#16a34a'],
                      ['Drowsy',    fmt(f.drwSec), `${f.drwPct}%`, '#ef4444'],
                      ['Distracted',fmt(f.disSec), `${f.disPct}%`, '#f59e0b'],
                      ['Blinks',    f.blinks,       '',             '#0ea5e9'],
                    ].map(([l,v,p,c])=>(
                      <div key={l} style={{ display:'flex', justifyContent:'space-between',
                        fontSize:'12px', marginBottom:'4px' }}>
                        <span style={{ color:'#64748b' }}>{l}</span>
                        <span style={{ fontWeight:'700', color:c }}>{v} {p}</span>
                      </div>
                    ))}
                    <div style={{ marginTop:'8px', height:'4px', background:'#e2e8f0',
                      borderRadius:'2px', overflow:'hidden' }}>
                      <div style={{
                        height:'100%', width:`${f.attPct}%`,
                        background: f.attPct>70?'#22c55e':f.attPct>40?'#f59e0b':'#ef4444',
                        borderRadius:'2px'
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stopped timelines */}
          {status==='stopped' && snap && snap.perFace.length > 0 && (
            <div style={S.card}>
              <p style={S.cardTitle}>Session Timelines</p>
              {snap.perFace.map((f,i)=>(
                <div key={f.id} style={{ marginBottom: i < snap.perFace.length-1 ? '16px' : 0 }}>
                  <p style={{ margin:'0 0 6px', fontSize:'12px',
                    fontWeight:'700', color:'#64748b' }}>Face {i+1}</p>
                  <TimelineHeatmap timeline={f.timeline} compact={false} />
                </div>
              ))}
            </div>
          )}

          {error && <div style={S.error}>{error}</div>}

          {/* Buttons */}
          <div style={S.btnRow}>
            {status==='idle' &&
              <button style={S.btnStart} onClick={startSession}>▶ Start Session</button>}
            {status==='loading' &&
              <button style={{...S.btnStart,opacity:0.6}} disabled>
                Loading MediaPipe...
              </button>}
            {status==='running' &&
              <button style={S.btnStop} onClick={handleStop}>⏹ Stop Session</button>}
            {status==='stopped' && <>
              <button style={S.btnSave} onClick={handleSave}
                disabled={saving||aiLoading}>
                {saving?'Saving...':'💾 Save Session'}
              </button>
              <button style={S.btnReport} onClick={handleGenerateReport}
                disabled={aiLoading}>
                📄 Generate Report
              </button>
              <button style={S.btnStart}
                onClick={()=>{ setAiRec(''); startSession() }}>
                🔄 New Session
              </button>
            </>}
          </div>

          {status==='idle' && (
            <div style={S.tip}>
              💡 Tip: Up to 6 faces can be tracked simultaneously.
              Each face gets independent attention, drowsiness, and blink metrics.
            </div>
          )}
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {tab==='history' && (
        <div>
          {logs.length===0
            ? <div style={S.empty}><span style={{fontSize:'40px'}}>📭</span>
                <p>No sessions yet.</p></div>
            : (
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              {logs.map(log => {
                const p    = log.attention_percent
                const c    = p>70?'#16a34a':p>40?'#f59e0b':'#ef4444'
                const open = selLog===log.id
                return (
                  <div key={log.id} style={S.logCard}>
                    <div style={{ display:'flex', justifyContent:'space-between',
                      alignItems:'center', cursor:'pointer' }}
                      onClick={()=>setSelLog(open?null:log.id)}>
                      <div>
                        <span style={{ fontWeight:'700', color:'#1e293b', fontSize:'15px' }}>
                          {log.session_date}
                        </span>
                        {log.face_count > 1 && (
                          <span style={{ marginLeft:'8px', background:'#eef2ff',
                            color:'#6366f1', padding:'2px 8px', borderRadius:'12px',
                            fontSize:'11px', fontWeight:'700' }}>
                            👤×{log.face_count} faces
                          </span>
                        )}
                        <div style={{ display:'flex', gap:'14px', marginTop:'6px', flexWrap:'wrap' }}>
                          <span style={S.logStat}>⏱ {fmt(log.duration_seconds)}</span>
                          <span style={{...S.logStat,color:'#16a34a'}}>
                            ✅ {fmt(log.attentive_seconds)}
                          </span>
                          <span style={{...S.logStat,color:'#ef4444'}}>
                            😴 {fmt(log.drowsy_seconds)}
                          </span>
                          {log.distracted_seconds > 0 &&
                            <span style={{...S.logStat,color:'#f59e0b'}}>
                              👀 {fmt(log.distracted_seconds)}
                            </span>}
                          {log.blink_count > 0 &&
                            <span style={S.logStat}>👁 {log.blink_count} blinks</span>}
                        </div>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                        <span style={{...S.scoreBadge, background:`${c}15`, color:c}}>
                          {p}%
                        </span>
                        <span style={{ color:'#94a3b8', fontSize:'18px' }}>
                          {open?'▲':'▼'}
                        </span>
                      </div>
                    </div>
                    {open && (
                      <div style={{ marginTop:'14px', borderTop:'1px solid #f1f5f9',
                        paddingTop:'14px' }}>
                        {log.per_face_data?.length > 0 && (
                          <div style={{ marginBottom:'14px' }}>
                            <p style={{ margin:'0 0 8px', fontSize:'12px',
                              fontWeight:'700', color:'#64748b',
                              textTransform:'uppercase' }}>Per-Face Data</p>
                            <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
                              {log.per_face_data.map((f,i)=>(
                                <div key={i} style={{ background:'#f8fafc',
                                  borderRadius:'8px', padding:'10px', flex:'1',
                                  minWidth:'140px' }}>
                                  <p style={{ margin:'0 0 6px', fontWeight:'700',
                                    fontSize:'12px', color:'#1e293b' }}>Face {i+1}</p>
                                  <p style={{ margin:0, fontSize:'12px',
                                    color:'#16a34a' }}>✅ {f.attPct}% attentive</p>
                                  <p style={{ margin:0, fontSize:'12px',
                                    color:'#ef4444' }}>😴 {f.drwPct}% drowsy</p>
                                  <p style={{ margin:0, fontSize:'12px',
                                    color:'#f59e0b' }}>👀 {f.disPct}% distracted</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {log.timeline?.length > 0 && (
                          <div style={{ marginBottom:'14px' }}>
                            <p style={{ margin:'0 0 8px', fontSize:'12px',
                              fontWeight:'700', color:'#64748b',
                              textTransform:'uppercase' }}>Session Timeline</p>
                            <TimelineHeatmap timeline={log.timeline} compact={false} />
                          </div>
                        )}
                        {log.ai_recommendation && (
                          <div style={{ background:'#fafafe',
                            border:'1px solid #e0e7ff', borderRadius:'8px',
                            padding:'12px' }}>
                            <p style={{ margin:'0 0 6px', fontSize:'12px',
                              fontWeight:'700', color:'#6366f1',
                              textTransform:'uppercase' }}>
                              🤖 AI Recommendation
                            </p>
                            <p style={{ margin:0, fontSize:'13px',
                              color:'#374151', lineHeight:1.7 }}>
                              {log.ai_recommendation}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── REPORT TAB ── */}
      {tab==='report' && (
        <div style={S.liveWrap}>
          <div style={{...S.card, background:'#f8fafc' }}>
            <p style={{ margin:'0 0 12px', fontWeight:'800', color:'#1e293b', fontSize:'16px' }}>
              📄 Research Report Generator
            </p>
            <p style={{ margin:'0 0 16px', color:'#64748b', fontSize:'13px' }}>
              Generate a structured research-grade report from your most recent
              session. Includes per-face metrics, methodology notes, accuracy
              discussion, and AI recommendations. Suitable for academic publication.
            </p>
            {snap ? (
              <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
                <button style={S.btnStart} onClick={handleGenerateReport}>
                  🔬 Generate Report
                </button>
                <button style={S.btnSave}
                  onClick={()=>downloadCSV(snap, new Date().toLocaleDateString())}>
                  ⬇ Download CSV
                </button>
              </div>
            ) : (
              <p style={{ color:'#94a3b8', fontSize:'13px' }}>
                ⚠️ Run and stop a session first to generate a report.
              </p>
            )}
          </div>

          {showReport && reportText && (
            <div style={{ background:'#0f172a', borderRadius:'12px',
              padding:'20px', overflowX:'auto' }}>
              <div style={{ display:'flex', justifyContent:'space-between',
                alignItems:'center', marginBottom:'14px' }}>
                <span style={{ color:'#94a3b8', fontSize:'12px', fontWeight:'700' }}>
                  REPORT PREVIEW
                </span>
                <div style={{ display:'flex', gap:'8px' }}>
                  <button
                    onClick={()=>downloadTXT(reportText,
                      `focus_report_${new Date().toLocaleDateString()}.txt`)}
                    style={{ background:'#6366f1', color:'#fff', border:'none',
                      borderRadius:'6px', padding:'6px 14px', fontSize:'12px',
                      fontWeight:'700', cursor:'pointer' }}>
                    ⬇ Download TXT
                  </button>
                  <button onClick={()=>{ navigator.clipboard.writeText(reportText) }}
                    style={{ background:'#334155', color:'#e2e8f0', border:'none',
                      borderRadius:'6px', padding:'6px 14px', fontSize:'12px',
                      fontWeight:'700', cursor:'pointer' }}>
                    📋 Copy
                  </button>
                </div>
              </div>
              <pre style={{ margin:0, color:'#e2e8f0', fontSize:'12px',
                lineHeight:1.7, fontFamily:'monospace', whiteSpace:'pre-wrap',
                wordBreak:'break-word' }}>
                {reportText}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Styles ───────────────────────────────────────────────────────
const S = {
  page:         { maxWidth:'900px', margin:'0 auto' },
  header:       { marginBottom:'20px' },
  title:        { margin:0, fontSize:'22px', fontWeight:'800', color:'#1e293b' },
  sub:          { margin:'4px 0 0', color:'#64748b', fontSize:'14px' },
  tabs:         { display:'flex', gap:'8px', marginBottom:'20px', flexWrap:'wrap' },
  tab:          { padding:'8px 20px', borderRadius:'8px', border:'1px solid #e2e8f0',
                  background:'#fff', cursor:'pointer', fontSize:'14px',
                  fontWeight:'600', color:'#64748b' },
  tabActive:    { background:'#6366f1', color:'#fff', border:'1px solid #6366f1' },
  liveWrap:     { display:'flex', flexDirection:'column', gap:'16px' },
  card:         { background:'#fff', borderRadius:'10px', padding:'16px',
                  boxShadow:'0 1px 3px rgba(0,0,0,0.06)' },
  cardTitle:    { margin:'0 0 10px', fontSize:'13px', fontWeight:'700',
                  color:'#374151', textTransform:'uppercase' },
  progressBar:  { height:'10px', background:'#e2e8f0', borderRadius:'5px', overflow:'hidden' },
  progressFill: { height:'100%', borderRadius:'5px', transition:'width 0.5s' },
  error:        { background:'#fef2f2', color:'#dc2626', padding:'12px 16px',
                  borderRadius:'8px', fontSize:'14px' },
  btnRow:       { display:'flex', gap:'12px', flexWrap:'wrap' },
  btnStart:     { padding:'12px 28px', background:'#6366f1', color:'#fff', border:'none',
                  borderRadius:'8px', fontSize:'15px', fontWeight:'700', cursor:'pointer' },
  btnStop:      { padding:'12px 28px', background:'#ef4444', color:'#fff', border:'none',
                  borderRadius:'8px', fontSize:'15px', fontWeight:'700', cursor:'pointer' },
  btnSave:      { padding:'12px 28px', background:'#22c55e', color:'#fff', border:'none',
                  borderRadius:'8px', fontSize:'15px', fontWeight:'700', cursor:'pointer' },
  btnReport:    { padding:'12px 28px', background:'#0ea5e9', color:'#fff', border:'none',
                  borderRadius:'8px', fontSize:'15px', fontWeight:'700', cursor:'pointer' },
  tip:          { background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'8px',
                  padding:'12px 16px', fontSize:'13px', color:'#64748b' },
  empty:        { textAlign:'center', padding:'60px', color:'#94a3b8' },
  logCard:      { background:'#fff', borderRadius:'10px', padding:'16px',
                  boxShadow:'0 1px 3px rgba(0,0,0,0.06)' },
  scoreBadge:   { padding:'4px 12px', borderRadius:'20px', fontSize:'13px', fontWeight:'700' },
  logStat:      { fontSize:'13px', fontWeight:'600', color:'#475569' },
  faceCountBadge: {
    position:'absolute', top:'10px', right:'10px',
    background:'rgba(99,102,241,0.9)', color:'#fff',
    padding:'4px 12px', borderRadius:'20px',
    fontSize:'13px', fontWeight:'700',
    backdropFilter:'blur(4px)'
  },
}