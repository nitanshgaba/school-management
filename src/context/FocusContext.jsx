// // src/context/FocusContext.jsx
// import { createContext, useContext, useRef, useState, useCallback } from 'react'

// const FocusContext = createContext(null)
// export const useFocus = () => useContext(FocusContext)

// const LEFT_EYE  = [362,385,387,263,373,380]
// const RIGHT_EYE = [33,160,158,133,153,144]
// const NOSE_TIP  = 1
// const LEFT_EAR_PT  = 234
// const RIGHT_EAR_PT = 454

// const EAR_THRESHOLD   = 0.22
// const DROWSY_FRAMES   = 6
// const POSE_THRESHOLD  = 0.25
// const BLINK_MIN_FRAMES = 2
// const BLINK_MAX_FRAMES = 8

// function calcEAR(lm, idx) {
//   const p = i => lm[i]
//   const d = (a,b) => Math.sqrt((a.x-b.x)**2+(a.y-b.y)**2)
//   return (d(p(idx[1]),p(idx[5])) + d(p(idx[2]),p(idx[4]))) / (2*d(p(idx[0]),p(idx[3])))
// }

// function calcHeadPose(lm) {
//   const nose  = lm[NOSE_TIP]
//   const left  = lm[LEFT_EAR_PT]
//   const right = lm[RIGHT_EAR_PT]
//   const cx = (left.x + right.x) / 2
//   return Math.abs(nose.x - cx)
// }

// export function FocusProvider({ children }) {
//   const videoRef    = useRef(null)
//   const canvasRef   = useRef(null)  // exported for FocusTracker page
//   const faceMeshRef = useRef(null)
//   const rafRef      = useRef(null)
//   const streamRef   = useRef(null)
//   const timerRef    = useRef(null)

//   // Detection state refs (no re-render on every frame)
//   const drowsyRef      = useRef(0)
//   const blinkStateRef  = useRef('open') // open | closing | closed
//   const blinkFrameRef  = useRef(0)
//   const sessionRef     = useRef({ total:0, attentive:0, drowsy:0, distracted:0, blinks:0 })
//   const timelineRef    = useRef([]) // array of { t, state } per second: 'A'|'D'|'S' (attentive/drowsy/distracted)
//   const currentStateRef = useRef('A')

//   // React state (for UI updates)
//   const [status,    setStatus]    = useState('idle') // idle|loading|running|stopped
//   const [attention, setAttention] = useState('Attentive')
//   const [sessSec,   setSessSec]   = useState(0)
//   const [attSec,    setAttSec]    = useState(0)
//   const [drwSec,    setDrwSec]    = useState(0)
//   const [disSec,    setDisSec]    = useState(0)
//   const [blinkCount,setBlinkCount]= useState(0)
//   const [noFace,    setNoFace]    = useState(false)
//   const [error,     setError]     = useState(null)

//   const statusRef = useRef('idle')
//   const setStatusBoth = (s) => { statusRef.current = s; setStatus(s) }

//   // ── MediaPipe loader ──────────────────────────────────────────
//   const loadMediaPipe = useCallback(() => new Promise((resolve, reject) => {
//     if (faceMeshRef.current) { resolve(); return }
//     const doInit = () => {
//       try {
//         const fm = new window.FaceMesh({
//           locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}`
//         })
//         fm.setOptions({ maxNumFaces:1, refineLandmarks:true, minDetectionConfidence:0.5, minTrackingConfidence:0.5 })
//         fm.onResults(onResults)
//         fm.initialize().then(() => { faceMeshRef.current = fm; resolve() }).catch(reject)
//       } catch(e) { reject(e) }
//     }
//     if (document.getElementById('mp-script')) { doInit(); return }
//     const s = document.createElement('script')
//     s.id = 'mp-script'
//     s.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js'
//     s.crossOrigin = 'anonymous'
//     s.onload  = doInit
//     s.onerror = () => reject(new Error('MediaPipe load failed'))
//     document.head.appendChild(s)
//   }), [])

//   // ── Detection result handler ──────────────────────────────────
//   const onResults = useCallback((results) => {
//     // Draw to canvas if available
//     const canvas = canvasRef.current
//     if (canvas) {
//       const ctx = canvas.getContext('2d')
//       ctx.clearRect(0, 0, canvas.width, canvas.height)
//       try { ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height) } catch(e) {}
//     }

//     if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
//       setNoFace(true)
//       currentStateRef.current = 'S'
//       return
//     }
//     setNoFace(false)
//     const lm  = results.multiFaceLandmarks[0]
//     const ear = (calcEAR(lm, LEFT_EYE) + calcEAR(lm, RIGHT_EYE)) / 2
//     const pose = calcHeadPose(lm)

//     // ── Blink detection ────────────────────────────────────────
//     if (ear < EAR_THRESHOLD) {
//       if (blinkStateRef.current === 'open') {
//         blinkStateRef.current = 'closing'
//         blinkFrameRef.current = 1
//       } else {
//         blinkFrameRef.current++
//       }
//     } else {
//       if (blinkStateRef.current === 'closing') {
//         const f = blinkFrameRef.current
//         if (f >= BLINK_MIN_FRAMES && f <= BLINK_MAX_FRAMES) {
//           sessionRef.current.blinks++
//           setBlinkCount(sessionRef.current.blinks)
//         }
//       }
//       blinkStateRef.current = 'open'
//       blinkFrameRef.current = 0
//     }

//     // Draw eye landmarks on canvas
//     if (canvas) {
//       const ctx = canvas.getContext('2d')
//       ctx.fillStyle = ear < EAR_THRESHOLD ? '#ef4444' : '#22c55e'
//       ;[...LEFT_EYE, ...RIGHT_EYE].forEach(i => {
//         ctx.beginPath()
//         ctx.arc(lm[i].x * canvas.width, lm[i].y * canvas.height, 2.5, 0, 2*Math.PI)
//         ctx.fill()
//       })
//     }

//     // ── Attention state ────────────────────────────────────────
//     const isDrowsy     = ear < EAR_THRESHOLD && blinkFrameRef.current >= DROWSY_FRAMES
//     const isDistracted = pose > POSE_THRESHOLD

//     if (isDrowsy) {
//       drowsyRef.current++
//       if (drowsyRef.current >= DROWSY_FRAMES) {
//         currentStateRef.current = 'D'
//         setAttention('Drowsy 😴')
//       }
//     } else if (isDistracted) {
//       drowsyRef.current = 0
//       currentStateRef.current = 'S'
//       setAttention('Distracted 👀')
//     } else {
//       drowsyRef.current = 0
//       currentStateRef.current = 'A'
//       setAttention('Attentive ✅')
//     }
//   }, [])

//   // ── Detection loop ────────────────────────────────────────────
//   const runDetection = useCallback(async () => {
//     if (!faceMeshRef.current || !videoRef.current || videoRef.current.paused) return
//     try { await faceMeshRef.current.send({ image: videoRef.current }) } catch(e) {}
//     rafRef.current = requestAnimationFrame(runDetection)
//   }, [])

//   // ── Timer (1s tick) ───────────────────────────────────────────
//   const startTimer = useCallback(() => {
//     timerRef.current = setInterval(() => {
//       const s = currentStateRef.current
//       sessionRef.current.total++
//       if (s === 'A') sessionRef.current.attentive++
//       else if (s === 'D') sessionRef.current.drowsy++
//       else sessionRef.current.distracted++
//       timelineRef.current.push(s)
//       setSessSec(sessionRef.current.total)
//       setAttSec(sessionRef.current.attentive)
//       setDrwSec(sessionRef.current.drowsy)
//       setDisSec(sessionRef.current.distracted)
//     }, 1000)
//   }, [])

//   // ── Start ─────────────────────────────────────────────────────
//   const startSession = useCallback(async () => {
//     setError(null)
//     setStatusBoth('loading')
//     sessionRef.current   = { total:0, attentive:0, drowsy:0, distracted:0, blinks:0 }
//     timelineRef.current  = []
//     currentStateRef.current = 'A'
//     drowsyRef.current    = 0
//     blinkStateRef.current = 'open'
//     blinkFrameRef.current = 0
//     setSessSec(0); setAttSec(0); setDrwSec(0); setDisSec(0); setBlinkCount(0)
//     setAttention('Attentive')

//     try {
//       // Create hidden video element once
//       if (!videoRef.current) {
//         const v = document.createElement('video')
//         v.setAttribute('playsinline','')
//         v.setAttribute('muted','')
//         v.style.display = 'none'
//         v.width = 640; v.height = 480
//         document.body.appendChild(v)
//         videoRef.current = v
//       }
//       const stream = await navigator.mediaDevices.getUserMedia({ video: true })
//       streamRef.current = stream
//       videoRef.current.srcObject = stream
//       await videoRef.current.play()
//       await loadMediaPipe()
//       setStatusBoth('running')
//       startTimer()
//       runDetection()
//     } catch(e) {
//       setError('Camera access denied or MediaPipe failed.')
//       setStatusBoth('idle')
//     }
//   }, [loadMediaPipe, startTimer, runDetection])

//   // ── Stop ──────────────────────────────────────────────────────
//   const stopSession = useCallback(() => {
//     cancelAnimationFrame(rafRef.current)
//     clearInterval(timerRef.current)
//     if (streamRef.current) {
//       streamRef.current.getTracks().forEach(t => t.stop())
//       streamRef.current = null
//     }
//     if (videoRef.current) {
//       videoRef.current.srcObject = null
//     }
//     if (statusRef.current === 'running') setStatusBoth('stopped')
//   }, [])

//   // ── Save ──────────────────────────────────────────────────────
//   const saveSession = useCallback(async (profileId, aiRec) => {
//     if (sessionRef.current.total < 5) { alert('Session too short to save.'); return false }
//     try {
//       const { supabase } = await import('../lib/supabase')
//       const pct = Math.round((sessionRef.current.attentive / sessionRef.current.total) * 100)
//       await supabase.from('focus_logs').insert({
//         student_id:          profileId,
//         duration_seconds:    sessionRef.current.total,
//         attentive_seconds:   sessionRef.current.attentive,
//         drowsy_seconds:      sessionRef.current.drowsy,
//         distracted_seconds:  sessionRef.current.distracted,
//         blink_count:         sessionRef.current.blinks,
//         attention_percent:   pct,
//         session_date:        new Date().toISOString().split('T')[0],
//         timeline:            timelineRef.current,
//         ai_recommendation:   aiRec || ''
//       })
//       setStatusBoth('idle')
//       return true
//     } catch(e) { alert('Failed to save.'); return false }
//   }, [])

//   const getSnapshot = useCallback(() => ({
//     ...sessionRef.current,
//     timeline: [...timelineRef.current]
//   }), [])

//   return (
//     <FocusContext.Provider value={{
//       videoRef, canvasRef,
//       status, attention, sessSec, attSec, drwSec, disSec,
//       blinkCount, noFace, error,
//       startSession, stopSession, saveSession, getSnapshot
//     }}>
//       {children}
//     </FocusContext.Provider>
//   )
// }





// // src/context/FocusContext.jsx
// import { createContext, useContext, useRef, useState, useCallback } from 'react'

// const FocusContext = createContext(null)

// const LANDMARKS = {
//   LEFT_EYE:  [33, 160, 158, 133, 153, 144],
//   RIGHT_EYE: [362, 385, 387, 263, 373, 380],
//   NOSE_TIP:  1,
//   CHIN:      152,
//   LEFT_EAR:  234,
//   RIGHT_EAR: 454,
//   LEFT_MOUTH: 61,
//   RIGHT_MOUTH: 291,
// }

// function earScore(landmarks, indices) {
//   const p = i => ({ x: landmarks[i].x, y: landmarks[i].y })
//   const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)
//   const A = dist(p(indices[1]), p(indices[5]))
//   const B = dist(p(indices[2]), p(indices[4]))
//   const C = dist(p(indices[0]), p(indices[3]))
//   return (A + B) / (2.0 * C)
// }

// function getHeadPose(landmarks, W, H) {
//   const nx = landmarks[LANDMARKS.NOSE_TIP].x
//   const ny = landmarks[LANDMARKS.NOSE_TIP].y
//   const lx = landmarks[LANDMARKS.LEFT_EAR].x
//   const rx = landmarks[LANDMARKS.RIGHT_EAR].x
//   const mx = (lx + rx) / 2
//   const yaw   = (nx - mx) / (rx - lx + 0.001)
//   const pitch = (ny - 0.5)
//   return { yaw, pitch }
// }

// export function FocusProvider({ children }) {
//   const videoRef  = useRef(null)
//   const canvasRef = useRef(null)
//   const holisticRef  = useRef(null)
//   const rafRef       = useRef(null)
//   const streamRef    = useRef(null)
//   const startTimeRef = useRef(null)
//   const tickRef      = useRef(null)

//   // Per-face state tracking
//   const facesDataRef = useRef({})   // { faceId: { attSec, drwSec, disSec, blinks, ... } }
//   const sessionTimelineRef = useRef({}) // { faceId: ['A','D','S',...] }

//   const [status,      setStatus]      = useState('idle')
//   const [sessSec,     setSessSec]     = useState(0)
//   const [facesState,  setFacesState]  = useState({}) // live render state
//   const [faceCount,   setFaceCount]   = useState(0)
//   const [noFace,      setNoFace]      = useState(false)
//   const [error,       setError]       = useState('')

//   const resetFaceData = () => {
//     facesDataRef.current = {}
//     sessionTimelineRef.current = {}
//     setFacesState({})
//     setFaceCount(0)
//   }

//   // ── MediaPipe bootstrap ───────────────────────────────────────
//   const loadMediaPipe = () => new Promise((resolve, reject) => {
//     if (window.__mpFaceMesh) return resolve(window.__mpFaceMesh)
//     const scripts = [
//       'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
//       'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js',
//     ]
//     let loaded = 0
//     scripts.forEach(src => {
//       const s = document.createElement('script')
//       s.src = src
//       s.onload = () => { if (++loaded === scripts.length) resolve() }
//       s.onerror = reject
//       document.head.appendChild(s)
//     })
//   })

//   // ── Per-face analysis ─────────────────────────────────────────
//   const analyzeFace = useCallback((faceId, landmarks, W, H) => {
//     if (!facesDataRef.current[faceId]) {
//       facesDataRef.current[faceId] = {
//         attSec: 0, drwSec: 0, disSec: 0,
//         blinkCount: 0, lastEAR: 0.3,
//         blinkCooldown: 0, attention: 'Attentive',
//         earHistory: [], yawHistory: [],
//       }
//       sessionTimelineRef.current[faceId] = []
//     }
//     const fd = facesDataRef.current[faceId]

//     // EAR
//     const leftEAR  = earScore(landmarks, LANDMARKS.LEFT_EYE)
//     const rightEAR = earScore(landmarks, LANDMARKS.RIGHT_EYE)
//     const avgEAR   = (leftEAR + rightEAR) / 2

//     fd.earHistory.push(avgEAR)
//     if (fd.earHistory.length > 10) fd.earHistory.shift()
//     const smoothEAR = fd.earHistory.reduce((a,b)=>a+b,0)/fd.earHistory.length

//     // Blink detection
//     if (fd.blinkCooldown > 0) fd.blinkCooldown--
//     if (fd.lastEAR > 0.21 && smoothEAR <= 0.21 && fd.blinkCooldown === 0) {
//       fd.blinkCount++
//       fd.blinkCooldown = 6
//     }
//     fd.lastEAR = smoothEAR

//     // Head pose
//     const { yaw, pitch } = getHeadPose(landmarks, W, H)
//     fd.yawHistory.push(yaw)
//     if (fd.yawHistory.length > 5) fd.yawHistory.shift()
//     const smoothYaw = fd.yawHistory.reduce((a,b)=>a+b,0)/fd.yawHistory.length

//     // Classify
//     let att = 'Attentive'
//     if (smoothEAR < 0.18) att = 'Drowsy'
//     else if (Math.abs(smoothYaw) > 0.25 || Math.abs(pitch) > 0.22) att = 'Distracted'

//     fd.attention = att
//     if (att === 'Attentive')   fd.attSec++
//     else if (att === 'Drowsy') fd.drwSec++
//     else                       fd.disSec++

//     sessionTimelineRef.current[faceId].push(
//       att === 'Attentive' ? 'A' : att === 'Drowsy' ? 'D' : 'S'
//     )

//     return { attention: att, ear: smoothEAR, yaw: smoothYaw, pitch,
//              blinks: fd.blinkCount, attSec: fd.attSec,
//              drwSec: fd.drwSec, disSec: fd.disSec }
//   }, [])

//   // ── Start session ─────────────────────────────────────────────
//   const startSession = useCallback(async () => {
//     setStatus('loading')
//     setError('')
//     resetFaceData()
//     setSessSec(0)

//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({
//         video: { width: 640, height: 480, facingMode: 'user' }
//       })
//       streamRef.current = stream
//       const video = videoRef.current
//       video.srcObject = stream
//       await video.play()

//       await loadMediaPipe()

//       const faceMesh = new window.FaceMesh({
//         locateFile: f =>
//           `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}`
//       })
//       faceMesh.setOptions({
//         maxNumFaces: 40,           // ← multi-face!
//         refineLandmarks: true,
//         minDetectionConfidence: 0.5,
//         minTrackingConfidence: 0.5,
//       })

//       faceMesh.onResults(results => {
//         const canvas = canvasRef.current
//         if (!canvas) return
//         const ctx = canvas.getContext('2d')
//         const W = canvas.width  = video.videoWidth  || 640
//         const H = canvas.height = video.videoHeight || 480

//         ctx.clearRect(0, 0, W, H)
//         ctx.drawImage(results.image, 0, 0, W, H)

//         const detected = results.multiFaceLandmarks || []
//         setNoFace(detected.length === 0)
//         setFaceCount(detected.length)

//         const newFacesState = {}
//         detected.forEach((landmarks, idx) => {
//           const faceId = `face_${idx}`
//           const result = analyzeFace(faceId, landmarks, W, H)
//           newFacesState[faceId] = result

//           // Draw face box
//           const xs = landmarks.map(l => l.x * W)
//           const ys = landmarks.map(l => l.y * H)
//           const x1 = Math.min(...xs), x2 = Math.max(...xs)
//           const y1 = Math.min(...ys), y2 = Math.max(...ys)
//           const boxColor = result.attention === 'Attentive' ? '#22c55e'
//                          : result.attention === 'Drowsy'    ? '#ef4444' : '#f59e0b'

//           ctx.strokeStyle = boxColor
//           ctx.lineWidth   = 2
//           ctx.strokeRect(x1, y1, x2 - x1, y2 - y1)

//           // Label
//           ctx.fillStyle = boxColor
//           ctx.font = 'bold 13px sans-serif'
//           ctx.fillText(
//             `Face ${idx + 1}: ${result.attention} | EAR:${result.ear.toFixed(2)}`,
//             x1, y1 - 6
//           )

//           // Dot overlay (simplified)
//           ctx.fillStyle = `${boxColor}88`
//           ;[LANDMARKS.LEFT_EYE, LANDMARKS.RIGHT_EYE].flat().forEach(i => {
//             ctx.beginPath()
//             ctx.arc(landmarks[i].x * W, landmarks[i].y * H, 2, 0, 2 * Math.PI)
//             ctx.fill()
//           })
//         })
//         setFacesState({ ...newFacesState })
//       })

//       holisticRef.current = faceMesh
//       startTimeRef.current = Date.now()

//       // Tick loop
//       tickRef.current = setInterval(() => {
//         const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
//         setSessSec(elapsed)
//       }, 1000)

//       // Send frames
//       const sendFrame = async () => {
//         if (videoRef.current && videoRef.current.readyState >= 2) {
//           await faceMesh.send({ image: videoRef.current })
//         }
//         rafRef.current = requestAnimationFrame(sendFrame)
//       }
//       rafRef.current = requestAnimationFrame(sendFrame)
//       setStatus('running')

//     } catch (e) {
//       setError(`Camera/MediaPipe error: ${e.message}`)
//       setStatus('idle')
//     }
//   }, [analyzeFace])

//   // ── Stop session ──────────────────────────────────────────────
//   const stopSession = useCallback(() => {
//     cancelAnimationFrame(rafRef.current)
//     clearInterval(tickRef.current)
//     streamRef.current?.getTracks().forEach(t => t.stop())
//     setStatus('stopped')
//   }, [])

//   // ── Get snapshot ──────────────────────────────────────────────
//   const getSnapshot = useCallback(() => {
//     const faceIds = Object.keys(facesDataRef.current)
//     const perFace = faceIds.map(id => {
//       const fd = facesDataRef.current[id]
//       const tl = sessionTimelineRef.current[id] || []
//       const total = fd.attSec + fd.drwSec + fd.disSec
//       return {
//         id, total,
//         attSec: fd.attSec, drwSec: fd.drwSec, disSec: fd.disSec,
//         attentive: fd.attSec, drowsy: fd.drwSec, distracted: fd.disSec,
//         blinks: fd.blinkCount,
//         timeline: tl,
//         attPct: total > 0 ? Math.round((fd.attSec / total) * 100) : 0,
//         drwPct: total > 0 ? Math.round((fd.drwSec / total) * 100) : 0,
//         disPct: total > 0 ? Math.round((fd.disSec / total) * 100) : 0,
//       }
//     })
//     // Aggregate
//     const aggTotal = sessSec || 1
//     const aggAtt   = perFace.reduce((s,f)=>s+f.attSec,0)
//     const aggDrw   = perFace.reduce((s,f)=>s+f.drwSec,0)
//     const aggDis   = perFace.reduce((s,f)=>s+f.disSec,0)
//     const aggBlinks= perFace.reduce((s,f)=>s+f.blinks,0)

//     return {
//       total: aggTotal, attentive: aggAtt, drowsy: aggDrw, distracted: aggDis,
//       blinks: aggBlinks, perFace,
//       faceCount: faceIds.length,
//       timeline: perFace[0]?.timeline || [],
//     }
//   }, [sessSec])

//   // ── Save session ──────────────────────────────────────────────
//   const saveSession = useCallback(async (studentId, aiRec) => {
//     const snap = getSnapshot()
//     const { supabase } = await import('../lib/supabase')
//     const total = snap.total || 1
//     const { error: err } = await supabase.from('focus_logs').insert({
//       student_id: studentId,
//       session_date: new Date().toLocaleDateString(),
//       duration_seconds: total,
//       attentive_seconds: snap.attentive,
//       drowsy_seconds: snap.drowsy,
//       distracted_seconds: snap.distracted,
//       attention_percent: Math.round((snap.attentive / total) * 100),
//       blink_count: snap.blinks,
//       timeline: snap.perFace[0]?.timeline || [],
//       face_count: snap.faceCount,
//       per_face_data: snap.perFace,
//       ai_recommendation: aiRec,
//     })
//     return !err
//   }, [getSnapshot])

//   return (
//     <FocusContext.Provider value={{
//       videoRef, canvasRef,
//       status, sessSec, faceCount, noFace, error,
//       facesState,
//       startSession, stopSession, saveSession, getSnapshot
//     }}>
//       {children}
//     </FocusContext.Provider>
//   )
// }

// export const useFocus = () => useContext(FocusContext)







// src/context/FocusContext.jsx
import { createContext, useContext, useRef, useState, useCallback } from 'react'

const FocusContext = createContext(null)

const LANDMARKS = {
  LEFT_EYE:  [33, 160, 158, 133, 153, 144],
  RIGHT_EYE: [362, 385, 387, 263, 373, 380],
  NOSE_TIP:  1,
  CHIN:      152,
  LEFT_EAR:  234,
  RIGHT_EAR: 454,
  LEFT_MOUTH: 61,
  RIGHT_MOUTH: 291,
}

function earScore(landmarks, indices) {
  const p = i => ({ x: landmarks[i].x, y: landmarks[i].y })
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)
  const A = dist(p(indices[1]), p(indices[5]))
  const B = dist(p(indices[2]), p(indices[4]))
  const C = dist(p(indices[0]), p(indices[3]))
  return (A + B) / (2.0 * C)
}

function getHeadPose(landmarks, W, H) {
  const nx = landmarks[LANDMARKS.NOSE_TIP].x
  const ny = landmarks[LANDMARKS.NOSE_TIP].y
  const lx = landmarks[LANDMARKS.LEFT_EAR].x
  const rx = landmarks[LANDMARKS.RIGHT_EAR].x
  const mx = (lx + rx) / 2
  const yaw   = (nx - mx) / (rx - lx + 0.001)
  const pitch = (ny - 0.5)
  return { yaw, pitch }
}

export function FocusProvider({ children }) {
  const videoRef  = useRef(null)
  const canvasRef = useRef(null)
  const holisticRef  = useRef(null)
  const rafRef       = useRef(null)
  const streamRef    = useRef(null)
  const startTimeRef = useRef(null)
  const tickRef      = useRef(null)

  const facesDataRef = useRef({})   
  const sessionTimelineRef = useRef({}) 

  const [status,      setStatus]      = useState('idle')
  const [sessSec,     setSessSec]     = useState(0) // Now stores float seconds (e.g. 1.25)
  const [facesState,  setFacesState]  = useState({}) 
  const [faceCount,   setFaceCount]   = useState(0)
  const [noFace,      setNoFace]      = useState(false)
  const [error,       setError]       = useState('')

  const resetFaceData = () => {
    facesDataRef.current = {}
    sessionTimelineRef.current = {}
    setFacesState({})
    setFaceCount(0)
  }

  const loadMediaPipe = () => new Promise((resolve, reject) => {
    if (window.__mpFaceMesh) return resolve(window.__mpFaceMesh)
    const scripts = [
      'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
      'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js',
    ]
    let loaded = 0
    scripts.forEach(src => {
      const s = document.createElement('script')
      s.src = src
      s.onload = () => { if (++loaded === scripts.length) resolve() }
      s.onerror = reject
      document.head.appendChild(s)
    })
  })

  const analyzeFace = useCallback((faceId, landmarks, W, H) => {
    const now = performance.now() / 1000; // Current time in precise seconds

    if (!facesDataRef.current[faceId]) {
      facesDataRef.current[faceId] = {
        attSec: 0, drwSec: 0, disSec: 0,
        blinkCount: 0, lastEAR: 0.3,
        blinkCooldown: 0, attention: 'Attentive',
        earHistory: [], yawHistory: [],
        lastUpdate: now
      }
      sessionTimelineRef.current[faceId] = []
    }
    const fd = facesDataRef.current[faceId]

    // Calculate exact time elapsed since the last video frame
    const dt = now - fd.lastUpdate;
    fd.lastUpdate = now;

    // EAR
    const leftEAR  = earScore(landmarks, LANDMARKS.LEFT_EYE)
    const rightEAR = earScore(landmarks, LANDMARKS.RIGHT_EYE)
    const avgEAR   = (leftEAR + rightEAR) / 2

    fd.earHistory.push(avgEAR)
    if (fd.earHistory.length > 5) fd.earHistory.shift() // Faster reaction
    const smoothEAR = fd.earHistory.reduce((a,b)=>a+b,0)/fd.earHistory.length

    // Blink detection (Tweaked sensitivity for glasses)
    if (fd.blinkCooldown > 0) fd.blinkCooldown--
    if (fd.lastEAR > 0.23 && smoothEAR <= 0.23 && fd.blinkCooldown === 0) {
      fd.blinkCount++
      fd.blinkCooldown = 12 // Prevent double counting a single blink
    }
    fd.lastEAR = smoothEAR

    // Head pose (Tweaked sensitivity for faster distraction detection)
    const { yaw, pitch } = getHeadPose(landmarks, W, H)
    fd.yawHistory.push(yaw)
    if (fd.yawHistory.length > 5) fd.yawHistory.shift()
    const smoothYaw = fd.yawHistory.reduce((a,b)=>a+b,0)/fd.yawHistory.length

    // Classify
    let att = 'Attentive'
    if (smoothEAR < 0.20) att = 'Drowsy' // Increased from 0.18 to catch narrow eyes
    else if (Math.abs(smoothYaw) > 0.18 || Math.abs(pitch) > 0.20) att = 'Distracted' // Increased sensitivity

    fd.attention = att
    
    // Accumulate REAL TIME, not frames
    if (att === 'Attentive')   fd.attSec += dt
    else if (att === 'Drowsy') fd.drwSec += dt
    else                       fd.disSec += dt

    // Push to timeline array once per second
    if (Math.floor(now) > Math.floor(now - dt)) {
        sessionTimelineRef.current[faceId].push(
          att === 'Attentive' ? 'A' : att === 'Drowsy' ? 'D' : 'S'
        )
    }

    return { attention: att, ear: smoothEAR, yaw: smoothYaw, pitch,
             blinks: fd.blinkCount, attSec: fd.attSec,
             drwSec: fd.drwSec, disSec: fd.disSec }
  }, [])

  const startSession = useCallback(async () => {
    setStatus('loading')
    setError('')
    resetFaceData()
    setSessSec(0)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      })
      streamRef.current = stream
      const video = videoRef.current
      video.srcObject = stream
      await video.play()

      await loadMediaPipe()

      const faceMesh = new window.FaceMesh({
        locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}`
      })
      faceMesh.setOptions({
        maxNumFaces: 10, // Track up to 10 faces
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      })

      faceMesh.onResults(results => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        const W = canvas.width  = video.videoWidth  || 640
        const H = canvas.height = video.videoHeight || 480

        ctx.clearRect(0, 0, W, H)
        ctx.drawImage(results.image, 0, 0, W, H)

        const detected = results.multiFaceLandmarks || []
        setNoFace(detected.length === 0)
        setFaceCount(detected.length)

        const newFacesState = {}
        detected.forEach((landmarks, idx) => {
          const faceId = `face_${idx}`
          const result = analyzeFace(faceId, landmarks, W, H)
          newFacesState[faceId] = result

          const xs = landmarks.map(l => l.x * W)
          const ys = landmarks.map(l => l.y * H)
          const x1 = Math.min(...xs), x2 = Math.max(...xs)
          const y1 = Math.min(...ys), y2 = Math.max(...ys)
          const boxColor = result.attention === 'Attentive' ? '#22c55e'
                         : result.attention === 'Drowsy'    ? '#ef4444' : '#f59e0b'

          ctx.strokeStyle = boxColor
          ctx.lineWidth   = 2
          ctx.strokeRect(x1, y1, x2 - x1, y2 - y1)

          ctx.fillStyle = boxColor
          ctx.font = 'bold 13px sans-serif'
          ctx.fillText(`Face ${idx + 1}: ${result.attention} | EAR:${result.ear.toFixed(2)}`, x1, y1 - 6)
        })
        setFacesState({ ...newFacesState })
      })

      holisticRef.current = faceMesh
      startTimeRef.current = Date.now()

      // Ultra-fast UI tick loop (updates the clock 20 times a second for smooth ms)
      tickRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000
        setSessSec(elapsed)
      }, 50)

      const sendFrame = async () => {
        if (videoRef.current && videoRef.current.readyState >= 2) {
          await faceMesh.send({ image: videoRef.current })
        }
        rafRef.current = requestAnimationFrame(sendFrame)
      }
      rafRef.current = requestAnimationFrame(sendFrame)
      setStatus('running')

    } catch (e) {
      setError(`Camera/MediaPipe error: ${e.message}`)
      setStatus('idle')
    }
  }, [analyzeFace])

  const stopSession = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    clearInterval(tickRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    setStatus('stopped')
  }, [])

  const getSnapshot = useCallback(() => {
    const faceIds = Object.keys(facesDataRef.current)
    const perFace = faceIds.map(id => {
      const fd = facesDataRef.current[id]
      const tl = sessionTimelineRef.current[id] || []
      const total = fd.attSec + fd.drwSec + fd.disSec
      return {
        id, total,
        attSec: fd.attSec, drwSec: fd.drwSec, disSec: fd.disSec,
        attentive: fd.attSec, drowsy: fd.drwSec, distracted: fd.disSec,
        blinks: fd.blinkCount,
        timeline: tl,
        attPct: total > 0 ? Math.round((fd.attSec / total) * 100) : 0,
        drwPct: total > 0 ? Math.round((fd.drwSec / total) * 100) : 0,
        disPct: total > 0 ? Math.round((fd.disSec / total) * 100) : 0,
      }
    })
    const aggTotal = sessSec || 1
    const aggAtt   = perFace.reduce((s,f)=>s+f.attSec,0)
    const aggDrw   = perFace.reduce((s,f)=>s+f.drwSec,0)
    const aggDis   = perFace.reduce((s,f)=>s+f.disSec,0)
    const aggBlinks= perFace.reduce((s,f)=>s+f.blinks,0)

    return {
      total: aggTotal, attentive: aggAtt, drowsy: aggDrw, distracted: aggDis,
      blinks: aggBlinks, perFace,
      faceCount: faceIds.length,
      timeline: perFace[0]?.timeline || [],
    }
  }, [sessSec])

  const saveSession = useCallback(async (studentId, aiRec) => {
    const snap = getSnapshot()
    const { supabase } = await import('../lib/supabase')
    const total = snap.total || 1
    const { error: err } = await supabase.from('focus_logs').insert({
      student_id: studentId,
      session_date: new Date().toLocaleDateString(),
      duration_seconds: Math.round(total),             // Rounded for DB safety
      attentive_seconds: Math.round(snap.attentive),   // Rounded for DB safety
      drowsy_seconds: Math.round(snap.drowsy),         // Rounded for DB safety
      distracted_seconds: Math.round(snap.distracted), // Rounded for DB safety
      attention_percent: Math.round((snap.attentive / total) * 100),
      blink_count: snap.blinks,
      timeline: snap.perFace[0]?.timeline || [],
      face_count: snap.faceCount,
      per_face_data: snap.perFace,
      ai_recommendation: aiRec,
    })
    return !err
  }, [getSnapshot])

  return (
    <FocusContext.Provider value={{
      videoRef, canvasRef,
      status, sessSec, faceCount, noFace, error,
      facesState,
      startSession, stopSession, saveSession, getSnapshot
    }}>
      {children}
    </FocusContext.Provider>
  )
}

export const useFocus = () => useContext(FocusContext)