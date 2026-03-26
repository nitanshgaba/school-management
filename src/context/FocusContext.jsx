// src/context/FocusContext.jsx
import { createContext, useContext, useRef, useState, useCallback } from 'react'

const FocusContext = createContext(null)
export const useFocus = () => useContext(FocusContext)

const LEFT_EYE  = [362,385,387,263,373,380]
const RIGHT_EYE = [33,160,158,133,153,144]
const NOSE_TIP  = 1
const LEFT_EAR_PT  = 234
const RIGHT_EAR_PT = 454

const EAR_THRESHOLD   = 0.22
const DROWSY_FRAMES   = 6
const POSE_THRESHOLD  = 0.25
const BLINK_MIN_FRAMES = 2
const BLINK_MAX_FRAMES = 8

function calcEAR(lm, idx) {
  const p = i => lm[i]
  const d = (a,b) => Math.sqrt((a.x-b.x)**2+(a.y-b.y)**2)
  return (d(p(idx[1]),p(idx[5])) + d(p(idx[2]),p(idx[4]))) / (2*d(p(idx[0]),p(idx[3])))
}

function calcHeadPose(lm) {
  const nose  = lm[NOSE_TIP]
  const left  = lm[LEFT_EAR_PT]
  const right = lm[RIGHT_EAR_PT]
  const cx = (left.x + right.x) / 2
  return Math.abs(nose.x - cx)
}

export function FocusProvider({ children }) {
  const videoRef    = useRef(null)
  const canvasRef   = useRef(null)  // exported for FocusTracker page
  const faceMeshRef = useRef(null)
  const rafRef      = useRef(null)
  const streamRef   = useRef(null)
  const timerRef    = useRef(null)

  // Detection state refs (no re-render on every frame)
  const drowsyRef      = useRef(0)
  const blinkStateRef  = useRef('open') // open | closing | closed
  const blinkFrameRef  = useRef(0)
  const sessionRef     = useRef({ total:0, attentive:0, drowsy:0, distracted:0, blinks:0 })
  const timelineRef    = useRef([]) // array of { t, state } per second: 'A'|'D'|'S' (attentive/drowsy/distracted)
  const currentStateRef = useRef('A')

  // React state (for UI updates)
  const [status,    setStatus]    = useState('idle') // idle|loading|running|stopped
  const [attention, setAttention] = useState('Attentive')
  const [sessSec,   setSessSec]   = useState(0)
  const [attSec,    setAttSec]    = useState(0)
  const [drwSec,    setDrwSec]    = useState(0)
  const [disSec,    setDisSec]    = useState(0)
  const [blinkCount,setBlinkCount]= useState(0)
  const [noFace,    setNoFace]    = useState(false)
  const [error,     setError]     = useState(null)

  const statusRef = useRef('idle')
  const setStatusBoth = (s) => { statusRef.current = s; setStatus(s) }

  // ── MediaPipe loader ──────────────────────────────────────────
  const loadMediaPipe = useCallback(() => new Promise((resolve, reject) => {
    if (faceMeshRef.current) { resolve(); return }
    const doInit = () => {
      try {
        const fm = new window.FaceMesh({
          locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}`
        })
        fm.setOptions({ maxNumFaces:1, refineLandmarks:true, minDetectionConfidence:0.5, minTrackingConfidence:0.5 })
        fm.onResults(onResults)
        fm.initialize().then(() => { faceMeshRef.current = fm; resolve() }).catch(reject)
      } catch(e) { reject(e) }
    }
    if (document.getElementById('mp-script')) { doInit(); return }
    const s = document.createElement('script')
    s.id = 'mp-script'
    s.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js'
    s.crossOrigin = 'anonymous'
    s.onload  = doInit
    s.onerror = () => reject(new Error('MediaPipe load failed'))
    document.head.appendChild(s)
  }), [])

  // ── Detection result handler ──────────────────────────────────
  const onResults = useCallback((results) => {
    // Draw to canvas if available
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      try { ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height) } catch(e) {}
    }

    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      setNoFace(true)
      currentStateRef.current = 'S'
      return
    }
    setNoFace(false)
    const lm  = results.multiFaceLandmarks[0]
    const ear = (calcEAR(lm, LEFT_EYE) + calcEAR(lm, RIGHT_EYE)) / 2
    const pose = calcHeadPose(lm)

    // ── Blink detection ────────────────────────────────────────
    if (ear < EAR_THRESHOLD) {
      if (blinkStateRef.current === 'open') {
        blinkStateRef.current = 'closing'
        blinkFrameRef.current = 1
      } else {
        blinkFrameRef.current++
      }
    } else {
      if (blinkStateRef.current === 'closing') {
        const f = blinkFrameRef.current
        if (f >= BLINK_MIN_FRAMES && f <= BLINK_MAX_FRAMES) {
          sessionRef.current.blinks++
          setBlinkCount(sessionRef.current.blinks)
        }
      }
      blinkStateRef.current = 'open'
      blinkFrameRef.current = 0
    }

    // Draw eye landmarks on canvas
    if (canvas) {
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = ear < EAR_THRESHOLD ? '#ef4444' : '#22c55e'
      ;[...LEFT_EYE, ...RIGHT_EYE].forEach(i => {
        ctx.beginPath()
        ctx.arc(lm[i].x * canvas.width, lm[i].y * canvas.height, 2.5, 0, 2*Math.PI)
        ctx.fill()
      })
    }

    // ── Attention state ────────────────────────────────────────
    const isDrowsy     = ear < EAR_THRESHOLD && blinkFrameRef.current >= DROWSY_FRAMES
    const isDistracted = pose > POSE_THRESHOLD

    if (isDrowsy) {
      drowsyRef.current++
      if (drowsyRef.current >= DROWSY_FRAMES) {
        currentStateRef.current = 'D'
        setAttention('Drowsy 😴')
      }
    } else if (isDistracted) {
      drowsyRef.current = 0
      currentStateRef.current = 'S'
      setAttention('Distracted 👀')
    } else {
      drowsyRef.current = 0
      currentStateRef.current = 'A'
      setAttention('Attentive ✅')
    }
  }, [])

  // ── Detection loop ────────────────────────────────────────────
  const runDetection = useCallback(async () => {
    if (!faceMeshRef.current || !videoRef.current || videoRef.current.paused) return
    try { await faceMeshRef.current.send({ image: videoRef.current }) } catch(e) {}
    rafRef.current = requestAnimationFrame(runDetection)
  }, [])

  // ── Timer (1s tick) ───────────────────────────────────────────
  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => {
      const s = currentStateRef.current
      sessionRef.current.total++
      if (s === 'A') sessionRef.current.attentive++
      else if (s === 'D') sessionRef.current.drowsy++
      else sessionRef.current.distracted++
      timelineRef.current.push(s)
      setSessSec(sessionRef.current.total)
      setAttSec(sessionRef.current.attentive)
      setDrwSec(sessionRef.current.drowsy)
      setDisSec(sessionRef.current.distracted)
    }, 1000)
  }, [])

  // ── Start ─────────────────────────────────────────────────────
  const startSession = useCallback(async () => {
    setError(null)
    setStatusBoth('loading')
    sessionRef.current   = { total:0, attentive:0, drowsy:0, distracted:0, blinks:0 }
    timelineRef.current  = []
    currentStateRef.current = 'A'
    drowsyRef.current    = 0
    blinkStateRef.current = 'open'
    blinkFrameRef.current = 0
    setSessSec(0); setAttSec(0); setDrwSec(0); setDisSec(0); setBlinkCount(0)
    setAttention('Attentive')

    try {
      // Create hidden video element once
      if (!videoRef.current) {
        const v = document.createElement('video')
        v.setAttribute('playsinline','')
        v.setAttribute('muted','')
        v.style.display = 'none'
        v.width = 640; v.height = 480
        document.body.appendChild(v)
        videoRef.current = v
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      streamRef.current = stream
      videoRef.current.srcObject = stream
      await videoRef.current.play()
      await loadMediaPipe()
      setStatusBoth('running')
      startTimer()
      runDetection()
    } catch(e) {
      setError('Camera access denied or MediaPipe failed.')
      setStatusBoth('idle')
    }
  }, [loadMediaPipe, startTimer, runDetection])

  // ── Stop ──────────────────────────────────────────────────────
  const stopSession = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    clearInterval(timerRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    if (statusRef.current === 'running') setStatusBoth('stopped')
  }, [])

  // ── Save ──────────────────────────────────────────────────────
  const saveSession = useCallback(async (profileId, aiRec) => {
    if (sessionRef.current.total < 5) { alert('Session too short to save.'); return false }
    try {
      const { supabase } = await import('../lib/supabase')
      const pct = Math.round((sessionRef.current.attentive / sessionRef.current.total) * 100)
      await supabase.from('focus_logs').insert({
        student_id:          profileId,
        duration_seconds:    sessionRef.current.total,
        attentive_seconds:   sessionRef.current.attentive,
        drowsy_seconds:      sessionRef.current.drowsy,
        distracted_seconds:  sessionRef.current.distracted,
        blink_count:         sessionRef.current.blinks,
        attention_percent:   pct,
        session_date:        new Date().toISOString().split('T')[0],
        timeline:            timelineRef.current,
        ai_recommendation:   aiRec || ''
      })
      setStatusBoth('idle')
      return true
    } catch(e) { alert('Failed to save.'); return false }
  }, [])

  const getSnapshot = useCallback(() => ({
    ...sessionRef.current,
    timeline: [...timelineRef.current]
  }), [])

  return (
    <FocusContext.Provider value={{
      videoRef, canvasRef,
      status, attention, sessSec, attSec, drwSec, disSec,
      blinkCount, noFace, error,
      startSession, stopSession, saveSession, getSnapshot
    }}>
      {children}
    </FocusContext.Provider>
  )
}
