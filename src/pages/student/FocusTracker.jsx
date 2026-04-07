// src/pages/student/FocusTracker.jsx
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useFocus } from '../../context/FocusContext'

const GROQ_MODEL = 'llama-3.3-70b-versatile'

export default function FocusTracker() {
  const { profile } = useAuth()
  const {
    videoRef, canvasRef,
    status, attention, sessSec, attSec, drwSec, disSec,
    blinkCount, noFace, error,
    startSession, stopSession, saveSession, getSnapshot
  } = useFocus()

  const [tab,      setTab]      = useState('live')
  const [logs,     setLogs]     = useState([])
  const [saving,   setSaving]   = useState(false)
  const [aiRec,    setAiRec]    = useState('')
  const [aiLoading,setAiLoading]= useState(false)
  const [selLog,   setSelLog]   = useState(null)
  const localCanvasRef = useRef(null)
  const mirrorRafRef   = useRef(null)
  const logsLoadedRef  = useRef(false)

  // Mirror video to local canvas
  useEffect(() => {
    const drawLoop = () => {
      const video  = videoRef.current
      const canvas = localCanvasRef.current
      if (video && canvas && status === 'running') {
        const ctx = canvas.getContext('2d')
        // Use mediapipe canvas if available (has video + dots), else raw video
        if (canvasRef.current && canvasRef.current.width > 0) {
          ctx.drawImage(canvasRef.current, 0, 0, canvas.width, canvas.height)
        } else {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        }
      }
      mirrorRafRef.current = requestAnimationFrame(drawLoop)
    }
    if (status === 'running') {
      drawLoop()
    }
    return () => cancelAnimationFrame(mirrorRafRef.current)
  }, [status])

  const fmt  = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`
  const pct  = sessSec > 0 ? Math.round((attSec/sessSec)*100) : 0
  const isDrowsy     = attention.includes('Drowsy')
  const isDistracted = attention.includes('Distracted')
  const stateColor   = isDrowsy ? '#ef4444' : isDistracted ? '#f59e0b' : '#22c55e'

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

  const handleTabChange = (t) => {
    setTab(t)
    if (t === 'history') loadLogs()
  }

  const handleStop = () => {
    stopSession()
    fetchAiRecommendation()
  }

  const fetchAiRecommendation = async () => {
    const snap = getSnapshot()
    if (snap.total < 10) return
    setAiLoading(true)
    const attPct = Math.round((snap.attentive/snap.total)*100)
    const drwPct = Math.round((snap.drowsy/snap.total)*100)
    const disPct = Math.round((snap.distracted/snap.total)*100)
    const bpm    = snap.blinks > 0 ? Math.round(snap.blinks / (snap.total/60)) : 0
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          max_tokens: 200,
          messages: [{
            role: 'user',
            content: `A student just finished a ${fmt(snap.total)} study session. Stats: ${attPct}% attentive, ${drwPct}% drowsy, ${disPct}% distracted, blink rate ${bpm}/min. Give 2-3 short, practical, friendly recommendations to improve focus. Be concise and specific. No bullet points, just plain sentences.`
          }]
        })
      })
      const data = await res.json()
      setAiRec(data.choices?.[0]?.message?.content || '')
    } catch(e) { console.error(e) }
    setAiLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    logsLoadedRef.current = false
    const ok = await saveSession(profile.id, aiRec)
    if (ok) { setAiRec(''); await loadLogs(); setTab('history') }
    setSaving(false)
  }

  // ── Timeline heatmap renderer ─────────────────────────────────
  const TimelineHeatmap = ({ timeline, compact }) => {
    if (!timeline || timeline.length === 0) return null
    const blockW = compact ? 6 : 10
    const blockH = compact ? 10 : 16
    const gap    = 2
    const cols   = compact ? 60 : 40
    const rows   = Math.ceil(timeline.length / cols)
    const colorMap = { A:'#22c55e', D:'#ef4444', S:'#f59e0b', undefined:'#e2e8f0' }
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
          {timeline.map((s,i) => (
            <div key={i} title={`${fmt(i)} — ${s==='A'?'Attentive':s==='D'?'Drowsy':'Distracted'}`}
              style={{ width:blockW, height:blockH, borderRadius:'2px', background:colorMap[s], flexShrink:0 }} />
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

  const snap = status === 'stopped' ? getSnapshot() : null

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h2 style={S.title}>👁️ Focus Tracker</h2>
        <p style={S.sub}>Real-time attention monitoring · Eye tracking · Head pose · Blink detection</p>
      </div>

      <div style={S.tabs}>
        {[['live','🎥 Live Session'],['history','📋 History']].map(([t,l]) => (
          <button key={t} onClick={()=>handleTabChange(t)} style={{...S.tab,...(tab===t?S.tabActive:{})}}>{l}</button>
        ))}
      </div>

      {tab==='live' && (
        <div style={S.liveWrap}>
          {/* Camera feed */}
          <div style={{ position:'relative', background:'#0f172a', borderRadius:'12px', overflow:'hidden', minHeight:'240px' }}>
            <canvas ref={localCanvasRef} width={640} height={480}
              style={{ width:'100%', borderRadius:'12px', display: status==='running'?'block':'none' }} />
            {status !== 'running' && (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'240px' }}>
                <span style={{ fontSize:'40px' }}>📷</span>
                <p style={{ color:'#94a3b8', margin:'8px 0 0', fontSize:'14px' }}>Camera preview will appear here</p>
              </div>
            )}
          </div>

          {/* Status banner */}
          {status==='running' && (
            <div style={{...S.banner, background: isDrowsy?'#fef2f2':isDistracted?'#fffbeb':'#f0fdf4',
              border:`1px solid ${isDrowsy?'#fca5a5':isDistracted?'#fde68a':'#86efac'}`}}>
              <span style={{ fontSize:'28px' }}>{isDrowsy?'😴':isDistracted?'👀':'😊'}</span>
              <div>
                <p style={{ margin:0, fontWeight:'800', fontSize:'18px', color:stateColor }}>{attention}</p>
                <p style={{ margin:'2px 0 0', fontSize:'13px', color:'#64748b' }}>
                  {isDrowsy?'Eyes closing detected — take a break!':isDistracted?'Looking away — stay focused!':'Keep it up!'}
                </p>
              </div>
              {noFace && <span style={S.noFaceBadge}>⚠️ No face</span>}
            </div>
          )}

          {/* Stats */}
          <div style={S.statsRow}>
            {[
              { label:'Session',    value:fmt(sessSec),  color:'#6366f1', bg:'#eef2ff' },
              { label:'Attentive',  value:fmt(attSec),   color:'#16a34a', bg:'#f0fdf4' },
              { label:'Drowsy',     value:fmt(drwSec),   color:'#ef4444', bg:'#fef2f2' },
              { label:'Distracted', value:fmt(disSec),   color:'#f59e0b', bg:'#fffbeb' },
              { label:'Blinks',     value:blinkCount,    color:'#0ea5e9', bg:'#f0f9ff' },
              { label:'Focus',      value:`${pct}%`,     color: pct>70?'#16a34a':pct>40?'#f59e0b':'#ef4444', bg:'#f8fafc' },
            ].map(s=>(
              <div key={s.label} style={{...S.statCard, background:s.bg}}>
                <p style={{ margin:0, fontSize:'11px', color:'#6b7280', fontWeight:'700', textTransform:'uppercase' }}>{s.label}</p>
                <p style={{ margin:'4px 0 0', fontSize:'22px', fontWeight:'800', color:s.color }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Live timeline */}
          {status==='running' && sessSec > 0 && (
            <div style={S.card}>
              <p style={S.cardTitle}>Live Timeline</p>
              <TimelineHeatmap timeline={getSnapshot().timeline} compact={true} />
            </div>
          )}

          {/* Progress bar */}
          {sessSec > 0 && (
            <div style={S.card}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
                <span style={{ fontSize:'13px', fontWeight:'700', color:'#374151' }}>Attention Score</span>
                <span style={{ fontSize:'13px', fontWeight:'800', color: pct>70?'#16a34a':pct>40?'#f59e0b':'#ef4444' }}>{pct}%</span>
              </div>
              <div style={S.progressBar}>
                <div style={{...S.progressFill, width:`${pct}%`,
                  background: pct>70?'#22c55e':pct>40?'#f59e0b':'#ef4444'}} />
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:'6px' }}>
                <span style={{ fontSize:'11px', color:'#94a3b8' }}>0%</span>
                <span style={{ fontSize:'11px', color:'#94a3b8' }}>100%</span>
              </div>
            </div>
          )}

          {/* AI Recommendation (after stop) */}
          {status==='stopped' && (
            <div style={{...S.card, border:'1px solid #e0e7ff', background:'#fafafe'}}>
              <p style={{...S.cardTitle, color:'#6366f1'}}>🤖 AI Recommendation</p>
              {aiLoading ? (
                <p style={{ color:'#94a3b8', fontSize:'14px' }}>Analyzing your session...</p>
              ) : aiRec ? (
                <p style={{ color:'#374151', fontSize:'14px', lineHeight:1.7, margin:0 }}>{aiRec}</p>
              ) : (
                <p style={{ color:'#94a3b8', fontSize:'14px' }}>Session too short for analysis.</p>
              )}
            </div>
          )}

          {/* Stopped timeline */}
          {status==='stopped' && snap && snap.timeline.length > 0 && (
            <div style={S.card}>
              <p style={S.cardTitle}>Session Timeline</p>
              <TimelineHeatmap timeline={snap.timeline} compact={false} />
            </div>
          )}

          {error && <div style={S.error}>{error}</div>}

          {/* Buttons */}
          <div style={S.btnRow}>
            {status==='idle'    && <button style={S.btnStart} onClick={startSession}>▶ Start Session</button>}
            {status==='loading' && <button style={{...S.btnStart,opacity:0.6}} disabled>Loading MediaPipe...</button>}
            {status==='running' && <button style={S.btnStop}  onClick={handleStop}>⏹ Stop Session</button>}
            {status==='stopped' && <>
              <button style={S.btnSave}  onClick={handleSave} disabled={saving||aiLoading}>{saving?'Saving...':'💾 Save Session'}</button>
              <button style={S.btnStart} onClick={()=>{setAiRec('');startSession()}}>🔄 New Session</button>
            </>}
          </div>

          {status==='idle' && (
            <div style={S.tip}>
              💡 Tip: Keep your face visible in the webcam. The tracker detects drowsiness, distractions, and blink rate.
            </div>
          )}
        </div>
      )}

      {tab==='history' && (
        <div>
          {logs.length===0 ? (
            <div style={S.empty}><span style={{fontSize:'40px'}}>📭</span><p>No sessions yet.</p></div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              {logs.map(log => {
                const p = log.attention_percent
                const c = p>70?'#16a34a':p>40?'#f59e0b':'#ef4444'
                const open = selLog===log.id
                return (
                  <div key={log.id} style={S.logCard}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer' }}
                      onClick={()=>setSelLog(open?null:log.id)}>
                      <div>
                        <span style={{ fontWeight:'700', color:'#1e293b', fontSize:'15px' }}>{log.session_date}</span>
                        <div style={{ display:'flex', gap:'14px', marginTop:'6px' }}>
                          <span style={S.logStat}>⏱ {fmt(log.duration_seconds)}</span>
                          <span style={{...S.logStat,color:'#16a34a'}}>✅ {fmt(log.attentive_seconds)}</span>
                          <span style={{...S.logStat,color:'#ef4444'}}>😴 {fmt(log.drowsy_seconds)}</span>
                          {log.distracted_seconds>0 && <span style={{...S.logStat,color:'#f59e0b'}}>👀 {fmt(log.distracted_seconds)}</span>}
                          {log.blink_count>0 && <span style={S.logStat}>👁 {log.blink_count} blinks</span>}
                        </div>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                        <span style={{...S.scoreBadge,background:`${c}15`,color:c}}>{p}%</span>
                        <span style={{ color:'#94a3b8', fontSize:'18px' }}>{open?'▲':'▼'}</span>
                      </div>
                    </div>
                    {open && (
                      <div style={{ marginTop:'14px', borderTop:'1px solid #f1f5f9', paddingTop:'14px' }}>
                        {log.timeline?.length > 0 && (
                          <div style={{ marginBottom:'14px' }}>
                            <p style={{ margin:'0 0 8px', fontSize:'12px', fontWeight:'700', color:'#64748b', textTransform:'uppercase' }}>Session Timeline</p>
                            <TimelineHeatmap timeline={log.timeline} compact={false} />
                          </div>
                        )}
                        {log.ai_recommendation && (
                          <div style={{ background:'#fafafe', border:'1px solid #e0e7ff', borderRadius:'8px', padding:'12px' }}>
                            <p style={{ margin:'0 0 6px', fontSize:'12px', fontWeight:'700', color:'#6366f1', textTransform:'uppercase' }}>🤖 AI Recommendation</p>
                            <p style={{ margin:0, fontSize:'13px', color:'#374151', lineHeight:1.7 }}>{log.ai_recommendation}</p>
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
    </div>
  )
}

const S = {
  page:        { maxWidth:'860px', margin:'0 auto' },
  header:      { marginBottom:'20px' },
  title:       { margin:0, fontSize:'22px', fontWeight:'800', color:'#1e293b' },
  sub:         { margin:'4px 0 0', color:'#64748b', fontSize:'14px' },
  tabs:        { display:'flex', gap:'8px', marginBottom:'20px' },
  tab:         { padding:'8px 20px', borderRadius:'8px', border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer', fontSize:'14px', fontWeight:'600', color:'#64748b' },
  tabActive:   { background:'#6366f1', color:'#fff', border:'1px solid #6366f1' },
  liveWrap:    { display:'flex', flexDirection:'column', gap:'16px' },
  banner:      { borderRadius:'12px', padding:'16px 20px', display:'flex', alignItems:'center', gap:'14px' },
  noFaceBadge: { marginLeft:'auto', background:'#fef3c7', color:'#92400e', padding:'4px 12px', borderRadius:'20px', fontSize:'12px', fontWeight:'700' },
  statsRow:    { display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:'10px' },
  statCard:    { borderRadius:'10px', padding:'12px', textAlign:'center' },
  card:        { background:'#fff', borderRadius:'10px', padding:'16px', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' },
  cardTitle:   { margin:'0 0 10px', fontSize:'13px', fontWeight:'700', color:'#374151', textTransform:'uppercase' },
  progressBar: { height:'10px', background:'#e2e8f0', borderRadius:'5px', overflow:'hidden' },
  progressFill:{ height:'100%', borderRadius:'5px', transition:'width 0.5s' },
  error:       { background:'#fef2f2', color:'#dc2626', padding:'12px 16px', borderRadius:'8px', fontSize:'14px' },
  btnRow:      { display:'flex', gap:'12px', flexWrap:'wrap' },
  btnStart:    { padding:'12px 28px', background:'#6366f1', color:'#fff', border:'none', borderRadius:'8px', fontSize:'15px', fontWeight:'700', cursor:'pointer' },
  btnStop:     { padding:'12px 28px', background:'#ef4444', color:'#fff', border:'none', borderRadius:'8px', fontSize:'15px', fontWeight:'700', cursor:'pointer' },
  btnSave:     { padding:'12px 28px', background:'#22c55e', color:'#fff', border:'none', borderRadius:'8px', fontSize:'15px', fontWeight:'700', cursor:'pointer' },
  tip:         { background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'8px', padding:'12px 16px', fontSize:'13px', color:'#64748b' },
  empty:       { textAlign:'center', padding:'60px', color:'#94a3b8' },
  logCard:     { background:'#fff', borderRadius:'10px', padding:'16px', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' },
  scoreBadge:  { padding:'4px 12px', borderRadius:'20px', fontSize:'13px', fontWeight:'700' },
  logStat:     { fontSize:'13px', fontWeight:'600', color:'#475569' },
}
