// src/pages/student/FocusTracker.jsx
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'

const EAR_THRESHOLD = 0.22
const DROWSY_FRAMES = 6

// MediaPipe eye landmark indices
const LEFT_EYE = [362,385,387,263,373,380]
const RIGHT_EYE = [33,160,158,133,153,144]

function calcEAR(landmarks, idx) {
  const p = i => ({ x: landmarks[i].x, y: landmarks[i].y })
  const dist = (a,b) => Math.sqrt((a.x-b.x)**2 + (a.y-b.y)**2)
  const v1 = dist(p(idx[1]), p(idx[5]))
  const v2 = dist(p(idx[2]), p(idx[4]))
  const h  = dist(p(idx[0]), p(idx[3]))
  return (v1 + v2) / (2.0 * h)
}

export default function FocusTracker() {
  const { profile } = useAuth()
  const videoRef    = useRef(null)
  const canvasRef   = useRef(null)
  const streamRef   = useRef(null)
  const faceMeshRef = useRef(null)
  const rafRef      = useRef(null)
  const drowsyRef   = useRef(0)
  const sessionRef  = useRef({ total:0, attentive:0, drowsy:0 })
  const timerRef    = useRef(null)

  const [status,    setStatus]    = useState('idle')
  const [attention, setAttention] = useState('Attentive')
  const [sessSec,   setSessSec]   = useState(0)
  const [attSec,    setAttSec]    = useState(0)
  const [drwSec,    setDrwSec]    = useState(0)
  const [logs,      setLogs]      = useState([])
  const [saving,    setSaving]    = useState(false)
  const [tab,       setTab]       = useState('live')
  const [error,     setError]     = useState(null)
  const [noFace,    setNoFace]    = useState(false)

  useEffect(() => { loadLogs() }, [])
  useEffect(() => () => stopSession(), [])

  const loadLogs = async () => {
    try {
      const { supabase } = await import('../../lib/supabase')
      const { data } = await supabase
        .from('focus_logs').select('*')
        .eq('student_id', profile.id)
        .order('created_at', { ascending: false }).limit(20)
      setLogs(data || [])
    } catch(e) { console.error(e) }
  }

  const startSession = async () => {
    setError(null); setStatus('loading')
    sessionRef.current = { total:0, attentive:0, drowsy:0 }
    setSessSec(0); setAttSec(0); setDrwSec(0)
    setAttention('Attentive'); drowsyRef.current = 0

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      streamRef.current = stream
      videoRef.current.srcObject = stream
      await videoRef.current.play()

      await loadMediaPipe()
      setStatus('running')
      startTimer()
      runDetection()
    } catch(e) {
      setError('Camera access denied or MediaPipe failed to load.')
      setStatus('idle')
    }
  }

  const loadMediaPipe = () => new Promise((resolve, reject) => {
    if (faceMeshRef.current) { resolve(); return }
    const existing = document.getElementById('mp-script')
    const doInit = () => {
      try {
        const fm = new window.FaceMesh({ locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}` })
        fm.setOptions({ maxNumFaces:1, refineLandmarks:true, minDetectionConfidence:0.5, minTrackingConfidence:0.5 })
        fm.onResults(onResults)
        fm.initialize().then(() => { faceMeshRef.current = fm; resolve() }).catch(reject)
      } catch(e) { reject(e) }
    }
    if (existing) { doInit(); return }
    const script = document.createElement('script')
    script.id = 'mp-script'
    script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js'
    script.crossOrigin = 'anonymous'
    script.onload = doInit
    script.onerror = () => reject(new Error('Failed to load MediaPipe'))
    document.head.appendChild(script)
  })

  const onResults = (results) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height)

    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      setNoFace(true); return
    }
    setNoFace(false)
    const lm = results.multiFaceLandmarks[0]
    const earL = calcEAR(lm, LEFT_EYE)
    const earR = calcEAR(lm, RIGHT_EYE)
    const ear  = (earL + earR) / 2

    // Draw eye dots
    ctx.fillStyle = ear < EAR_THRESHOLD ? '#ef4444' : '#22c55e'
    ;[...LEFT_EYE, ...RIGHT_EYE].forEach(i => {
      ctx.beginPath()
      ctx.arc(lm[i].x * canvas.width, lm[i].y * canvas.height, 2, 0, 2*Math.PI)
      ctx.fill()
    })

    if (ear < EAR_THRESHOLD) {
      drowsyRef.current++
      if (drowsyRef.current >= DROWSY_FRAMES) setAttention('Drowsy 😴')
    } else {
      drowsyRef.current = 0
      setAttention('Attentive ✅')
    }
  }

  const runDetection = async () => {
    if (!faceMeshRef.current || !videoRef.current || videoRef.current.paused) return
    try { await faceMeshRef.current.send({ image: videoRef.current }) } catch(e) {}
    rafRef.current = requestAnimationFrame(runDetection)
  }

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      sessionRef.current.total++
      const isDrowsy = drowsyRef.current >= DROWSY_FRAMES
      if (isDrowsy) sessionRef.current.drowsy++
      else sessionRef.current.attentive++
      setSessSec(sessionRef.current.total)
      setAttSec(sessionRef.current.attentive)
      setDrwSec(sessionRef.current.drowsy)
    }, 1000)
  }

  const stopSession = () => {
    cancelAnimationFrame(rafRef.current)
    clearInterval(timerRef.current)
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null }
    if (status === 'running') setStatus('stopped')
  }

  const saveSession = async () => {
    if (sessionRef.current.total < 5) { alert('Session too short to save.'); return }
    setSaving(true)
    try {
      const { supabase } = await import('../../lib/supabase')
      const pct = Math.round((sessionRef.current.attentive / sessionRef.current.total) * 100)
      const { data: student } = await supabase.from('students').select('id').eq('id', profile.id).single()
      await supabase.from('focus_logs').insert({
        student_id: profile.id,
        duration_seconds: sessionRef.current.total,
        attentive_seconds: sessionRef.current.attentive,
        drowsy_seconds: sessionRef.current.drowsy,
        attention_percent: pct,
        session_date: new Date().toISOString().split('T')[0]
      })
      await loadLogs()
      setStatus('idle')
      setTab('history')
    } catch(e) { alert('Failed to save session.') }
    setSaving(false)
  }

  const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`
  const pct = sessSec > 0 ? Math.round((attSec/sessSec)*100) : 0
  const isDrowsy = attention.includes('Drowsy')

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h2 style={S.title}>👁️ Focus Tracker</h2>
        <p style={S.sub}>Real-time attention monitoring using your webcam</p>
      </div>

      <div style={S.tabs}>
        {['live','history'].map(t => (
          <button key={t} onClick={()=>setTab(t)} style={{...S.tab, ...(tab===t?S.tabActive:{})}}>
            {t==='live'?'🎥 Live Session':'📋 History'}
          </button>
        ))}
      </div>

      {tab==='live' && (
        <div style={S.liveWrap}>
          <div style={S.camBox}>
            <video ref={videoRef} style={{ display:'none' }} width={640} height={480} muted playsInline />
            <canvas ref={canvasRef} width={640} height={480}
              style={{ width:'100%', borderRadius:'12px', display: status==='running'?'block':'none', background:'#000' }} />
            {status !== 'running' && (
              <div style={S.camPlaceholder}>
                <span style={{ fontSize:'48px' }}>📷</span>
                <p style={{ color:'#94a3b8', margin:'8px 0 0' }}>Camera preview will appear here</p>
              </div>
            )}
            {status==='running' && noFace && (
              <div style={S.noFaceBadge}>⚠️ No face detected</div>
            )}
            {status==='running' && (
              <div style={{...S.statusBadge, background: isDrowsy?'#fef2f2':'#f0fdf4', border:`1px solid ${isDrowsy?'#fca5a5':'#86efac'}`}}>
                <span style={{ fontSize:'20px' }}>{isDrowsy?'😴':'😊'}</span>
                <span style={{ fontWeight:'700', color: isDrowsy?'#ef4444':'#16a34a' }}>{attention}</span>
              </div>
            )}
          </div>

          <div style={S.statsRow}>
            {[
              { label:'Session Time', value: fmt(sessSec), color:'#6366f1', bg:'#eef2ff' },
              { label:'Attentive',    value: fmt(attSec),  color:'#16a34a', bg:'#f0fdf4' },
              { label:'Drowsy',       value: fmt(drwSec),  color:'#ef4444', bg:'#fef2f2' },
              { label:'Focus Score',  value: `${pct}%`,    color:'#f59e0b', bg:'#fffbeb' },
            ].map(s => (
              <div key={s.label} style={{...S.statCard, background:s.bg}}>
                <p style={{ margin:0, fontSize:'12px', color:'#6b7280', fontWeight:'600', textTransform:'uppercase' }}>{s.label}</p>
                <p style={{ margin:'4px 0 0', fontSize:'28px', fontWeight:'800', color:s.color }}>{s.value}</p>
              </div>
            ))}
          </div>

          {sessSec > 0 && (
            <div style={S.progressWrap}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
                <span style={{ fontSize:'13px', fontWeight:'600', color:'#374151' }}>Attention Progress</span>
                <span style={{ fontSize:'13px', fontWeight:'700', color:'#6366f1' }}>{pct}%</span>
              </div>
              <div style={S.progressBar}>
                <div style={{...S.progressFill, width:`${pct}%`, background: pct>70?'#22c55e':pct>40?'#f59e0b':'#ef4444'}} />
              </div>
            </div>
          )}

          {error && <div style={S.error}>{error}</div>}

          <div style={S.btnRow}>
            {status==='idle' && <button style={S.btnStart} onClick={startSession}>▶ Start Session</button>}
            {status==='loading' && <button style={{...S.btnStart, opacity:0.6}} disabled>Loading MediaPipe...</button>}
            {status==='running' && <button style={S.btnStop} onClick={()=>{stopSession();setStatus('stopped')}}>⏹ Stop Session</button>}
            {status==='stopped' && (
              <>
                <button style={S.btnSave} onClick={saveSession} disabled={saving}>{saving?'Saving...':'💾 Save Session'}</button>
                <button style={S.btnStart} onClick={()=>{setStatus('idle');setSessSec(0);setAttSec(0);setDrwSec(0)}}>🔄 New Session</button>
              </>
            )}
          </div>
        </div>
      )}

      {tab==='history' && (
        <div style={S.historyWrap}>
          {logs.length===0 ? (
            <div style={S.empty}><span style={{fontSize:'40px'}}>📭</span><p>No sessions recorded yet.</p></div>
          ) : (
            <div style={S.logGrid}>
              {logs.map(log => {
                const p = log.attention_percent
                const color = p>70?'#16a34a':p>40?'#f59e0b':'#ef4444'
                return (
                  <div key={log.id} style={S.logCard}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <span style={{ fontWeight:'700', color:'#1e293b' }}>{log.session_date}</span>
                      <span style={{...S.scoreBadge, background:`${color}15`, color}}>{p}% Focus</span>
                    </div>
                    <div style={{ display:'flex', gap:'16px', marginTop:'10px' }}>
                      <span style={S.logStat}>⏱ {fmt(log.duration_seconds)}</span>
                      <span style={{...S.logStat, color:'#16a34a'}}>✅ {fmt(log.attentive_seconds)}</span>
                      <span style={{...S.logStat, color:'#ef4444'}}>😴 {fmt(log.drowsy_seconds)}</span>
                    </div>
                    <div style={{ marginTop:'10px' }}>
                      <div style={S.progressBar}>
                        <div style={{...S.progressFill, width:`${p}%`, background:color}} />
                      </div>
                    </div>
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
  liveWrap:    { display:'flex', flexDirection:'column', gap:'20px' },
  camBox:      { position:'relative', background:'#0f172a', borderRadius:'12px', overflow:'hidden', minHeight:'260px' },
  camPlaceholder:{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'260px' },
  statusBadge: { position:'absolute', top:'12px', left:'12px', display:'flex', alignItems:'center', gap:'8px', padding:'6px 14px', borderRadius:'20px', fontSize:'14px', fontWeight:'600' },
  noFaceBadge: { position:'absolute', top:'12px', right:'12px', background:'#fef3c7', color:'#92400e', padding:'6px 14px', borderRadius:'20px', fontSize:'13px', fontWeight:'600' },
  statsRow:    { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px' },
  statCard:    { borderRadius:'10px', padding:'16px', textAlign:'center' },
  progressWrap:{ background:'#fff', borderRadius:'10px', padding:'16px' },
  progressBar: { height:'8px', background:'#e2e8f0', borderRadius:'4px', overflow:'hidden' },
  progressFill:{ height:'100%', borderRadius:'4px', transition:'width 0.5s' },
  error:       { background:'#fef2f2', color:'#dc2626', padding:'12px 16px', borderRadius:'8px', fontSize:'14px' },
  btnRow:      { display:'flex', gap:'12px', flexWrap:'wrap' },
  btnStart:    { padding:'12px 28px', background:'#6366f1', color:'#fff', border:'none', borderRadius:'8px', fontSize:'15px', fontWeight:'700', cursor:'pointer' },
  btnStop:     { padding:'12px 28px', background:'#ef4444', color:'#fff', border:'none', borderRadius:'8px', fontSize:'15px', fontWeight:'700', cursor:'pointer' },
  btnSave:     { padding:'12px 28px', background:'#22c55e', color:'#fff', border:'none', borderRadius:'8px', fontSize:'15px', fontWeight:'700', cursor:'pointer' },
  historyWrap: { },
  empty:       { textAlign:'center', padding:'60px', color:'#94a3b8' },
  logGrid:     { display:'flex', flexDirection:'column', gap:'12px' },
  logCard:     { background:'#fff', borderRadius:'10px', padding:'16px', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' },
  scoreBadge:  { padding:'4px 12px', borderRadius:'20px', fontSize:'13px', fontWeight:'700' },
  logStat:     { fontSize:'13px', fontWeight:'600', color:'#475569' },
}
