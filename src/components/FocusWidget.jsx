// // src/components/FocusWidget.jsx
// import { useFocus } from '../context/FocusContext'
// import { useNavigate } from 'react-router-dom'

// export default function FocusWidget() {
//   const { status, attention, sessSec, attSec } = useFocus()
//   const navigate = useNavigate()

//   if (status === 'idle' || status === 'loading') return null

//   const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`
//   const pct = sessSec > 0 ? Math.round((attSec/sessSec)*100) : 0
//   const isDrowsy     = attention.includes('Drowsy')
//   const isDistracted = attention.includes('Distracted')
//   const isStopped    = status === 'stopped'

//   const bg     = isStopped ? '#64748b' : isDrowsy ? '#ef4444' : isDistracted ? '#f59e0b' : '#22c55e'
//   const emoji  = isStopped ? '⏸' : isDrowsy ? '😴' : isDistracted ? '👀' : '✅'
//   const label  = isStopped ? 'Stopped' : isDrowsy ? 'Drowsy' : isDistracted ? 'Distracted' : 'Attentive'

//   return (
//     <div
//       onClick={() => navigate('/student/focus-tracker')}
//       style={{
//         position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
//         background: bg, color: '#fff', borderRadius: '50px',
//         padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '10px',
//         cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
//         transition: 'all 0.3s', userSelect: 'none',
//         fontFamily: 'inherit'
//       }}
//     >
//       <span style={{ fontSize: '18px' }}>{emoji}</span>
//       <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
//         <span style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '0.3px' }}>{label}</span>
//         <span style={{ fontSize: '11px', opacity: 0.85 }}>{fmt(sessSec)} · {pct}% focus</span>
//       </div>
//       <div style={{
//         width: '6px', height: '6px', borderRadius: '50%',
//         background: '#fff', opacity: isStopped ? 0 : 1,
//         animation: isStopped ? 'none' : 'pulse 1.5s infinite'
//       }} />
//       <style>{`@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.8)} }`}</style>
//     </div>
//   )
// }







// // src/components/FocusWidget.jsx
// import { useFocus } from '../context/FocusContext'
// import { useNavigate } from 'react-router-dom'

// export default function FocusWidget() {
//   const {
//     status,
//     sessSec,
//     faceCount,
//     facesState,
//     getSnapshot,
//   } = useFocus()

//   const navigate = useNavigate()

//   const fmt = s =>
//     `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

//   // ── Safely derive attention from facesState ──────────────────
//   const faceIds   = Object.keys(facesState || {})
//   const firstFace = faceIds.length > 0 ? facesState[faceIds[0]] : null
//   const attention = firstFace?.attention ?? 'Attentive'

//   // ── Safely derive pct ────────────────────────────────────────
//   const snap    = getSnapshot ? getSnapshot() : null
//   const aggAtt  = snap?.attentive ?? (firstFace?.attSec ?? 0)
//   const pct     = sessSec > 0 ? Math.round((aggAtt / sessSec) * 100) : 0

//   // ── Flags ────────────────────────────────────────────────────
//   const isStopped    = status === 'stopped'
//   const isDrowsy     = attention === 'Drowsy'
//   const isDistracted = attention === 'Distracted'

//   const bg    = isStopped   ? '#64748b'
//               : isDrowsy    ? '#ef4444'
//               : isDistracted? '#f59e0b'
//               :               '#22c55e'

//   const emoji = isStopped   ? '⏸'
//               : isDrowsy    ? '😴'
//               : isDistracted? '👀'
//               :               '✅'

//   const label = isStopped   ? 'Stopped'
//               : isDrowsy    ? 'Drowsy'
//               : isDistracted? 'Distracted'
//               :               'Attentive'

//   if (status === 'idle' || status === 'loading') return null

//   return (
//     <div
//       onClick={() => navigate('/student/focus-tracker')}
//       style={{
//         position:   'fixed',
//         bottom:     '24px',
//         right:      '24px',
//         zIndex:     9999,
//         background: bg,
//         color:      '#fff',
//         borderRadius: '50px',
//         padding:    '10px 18px',
//         display:    'flex',
//         alignItems: 'center',
//         gap:        '10px',
//         cursor:     'pointer',
//         boxShadow:  '0 4px 20px rgba(0,0,0,0.2)',
//         transition: 'all 0.3s',
//         userSelect: 'none',
//         fontFamily: 'inherit',
//       }}
//     >
//       <span style={{ fontSize: '18px' }}>{emoji}</span>

//       <div style={{ display:'flex', flexDirection:'column', lineHeight: 1.2 }}>
//         <span style={{ fontSize:'12px', fontWeight:'800', letterSpacing:'0.3px' }}>
//           {label}
//           {!isStopped && faceCount > 1 && (
//             <span style={{ marginLeft:'5px', opacity: 0.85, fontWeight:'600' }}>
//               ×{faceCount}
//             </span>
//           )}
//         </span>
//         <span style={{ fontSize:'11px', opacity: 0.85 }}>
//           {fmt(sessSec)} · {pct}% focus
//         </span>
//       </div>

//       {/* Pulse dot */}
//       <div style={{
//         width:        '6px',
//         height:       '6px',
//         borderRadius: '50%',
//         background:   '#fff',
//         opacity:      isStopped ? 0 : 1,
//         animation:    isStopped ? 'none' : 'pulse 1.5s infinite',
//       }} />

//       <style>{`
//         @keyframes pulse {
//           0%,100% { opacity:1; transform:scale(1)   }
//           50%      { opacity:0.4; transform:scale(0.8) }
//         }
//       `}</style>
//     </div>
//   )
// }







// // src/components/FocusWidget.jsx
// import { useFocus } from '../context/FocusContext'
// import { useNavigate } from 'react-router-dom'

// export default function FocusWidget() {
//   const {
//     status,
//     sessSec,
//     faceCount,
//     facesState,
//     getSnapshot,
//   } = useFocus()

//   const navigate = useNavigate()

//   const fmt = s =>
//     `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

//   // ── Safely derive attention from facesState ──────────────────
//   const faceIds   = Object.keys(facesState || {})
//   const firstFace = faceIds.length > 0 ? facesState[faceIds[0]] : null
//   const attention = firstFace?.attention ?? 'Attentive'

//   // ── Safely derive pct ────────────────────────────────────────
//   const snap    = getSnapshot ? getSnapshot() : null
//   const aggAtt  = snap?.attentive ?? (firstFace?.attSec ?? 0)
//   const pct     = sessSec > 0 ? Math.round((aggAtt / sessSec) * 100) : 0

//   // ── Flags ────────────────────────────────────────────────────
//   const isStopped    = status === 'stopped'
//   const isDrowsy     = attention === 'Drowsy'
//   const isDistracted = attention === 'Distracted'

//   const bg    = isStopped   ? '#64748b'
//               : isDrowsy    ? '#ef4444'
//               : isDistracted? '#f59e0b'
//               :               '#22c55e'

//   const emoji = isStopped   ? '⏸'
//               : isDrowsy    ? '😴'
//               : isDistracted? '👀'
//               :               '✅'

//   const label = isStopped   ? 'Stopped'
//               : isDrowsy    ? 'Drowsy'
//               : isDistracted? 'Distracted'
//               :               'Attentive'

//   if (status === 'idle' || status === 'loading') return null

//   return (
//     <div
//       onClick={() => navigate('/teacher/focus-tracker')} // <--- UPDATED PATH
//       style={{
//         position:   'fixed',
//         bottom:     '24px',
//         right:      '24px',
//         zIndex:     9999,
//         background: bg,
//         color:      '#fff',
//         borderRadius: '50px',
//         padding:    '10px 18px',
//         display:    'flex',
//         alignItems: 'center',
//         gap:        '10px',
//         cursor:     'pointer',
//         boxShadow:  '0 4px 20px rgba(0,0,0,0.2)',
//         transition: 'all 0.3s',
//         userSelect: 'none',
//         fontFamily: 'inherit',
//       }}
//     >
//       <span style={{ fontSize: '18px' }}>{emoji}</span>

//       <div style={{ display:'flex', flexDirection:'column', lineHeight: 1.2 }}>
//         <span style={{ fontSize:'12px', fontWeight:'800', letterSpacing:'0.3px' }}>
//           {label}
//           {!isStopped && faceCount > 1 && (
//             <span style={{ marginLeft:'5px', opacity: 0.85, fontWeight:'600' }}>
//               ×{faceCount}
//             </span>
//           )}
//         </span>
//         <span style={{ fontSize:'11px', opacity: 0.85 }}>
//           {fmt(sessSec)} · {pct}% focus
//         </span>
//       </div>

//       {/* Pulse dot */}
//       <div style={{
//         width:        '6px',
//         height:       '6px',
//         borderRadius: '50%',
//         background:   '#fff',
//         opacity:      isStopped ? 0 : 1,
//         animation:    isStopped ? 'none' : 'pulse 1.5s infinite',
//       }} />

//       <style>{`
//         @keyframes pulse {
//           0%,100% { opacity:1; transform:scale(1)   }
//           50%      { opacity:0.4; transform:scale(0.8) }
//         }
//       `}</style>
//     </div>
//   )
// }



// src/components/FocusWidget.jsx
import { useFocus } from '../context/FocusContext'
import { useNavigate } from 'react-router-dom'

const formatTime = (totalSeconds) => {
  if (!totalSeconds || isNaN(totalSeconds)) return "00:00";
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function FocusWidget() {
  const { status, sessSec, faceCount, facesState, getSnapshot } = useFocus()
  const navigate = useNavigate()

  const faceIds   = Object.keys(facesState || {})
  const firstFace = faceIds.length > 0 ? facesState[faceIds[0]] : null
  const attention = firstFace?.attention ?? 'Attentive'

  const snap    = getSnapshot ? getSnapshot() : null
  const aggAtt  = snap?.attentive ?? (firstFace?.attSec ?? 0)
  const pct     = sessSec > 0 ? Math.round((aggAtt / sessSec) * 100) : 0

  const isStopped    = status === 'stopped'
  const isDrowsy     = attention === 'Drowsy'
  const isDistracted = attention === 'Distracted'

  const bg    = isStopped   ? '#64748b' : isDrowsy ? '#ef4444' : isDistracted? '#f59e0b' : '#22c55e'
  const emoji = isStopped   ? '⏸' : isDrowsy ? '😴' : isDistracted? '👀' : '✅'
  const label = isStopped   ? 'Stopped' : isDrowsy ? 'Drowsy' : isDistracted? 'Distracted' : 'Attentive'

  if (status === 'idle' || status === 'loading') return null

  return (
    <div
      onClick={() => navigate('/teacher/focus-tracker')}
      style={{
        position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, background: bg,
        color: '#fff', borderRadius: '50px', padding: '10px 18px', display: 'flex',
        alignItems: 'center', gap: '10px', cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        transition: 'all 0.3s', userSelect: 'none', fontFamily: 'inherit',
      }}
    >
      <span style={{ fontSize: '18px' }}>{emoji}</span>
      <div style={{ display:'flex', flexDirection:'column', lineHeight: 1.2 }}>
        <span style={{ fontSize:'12px', fontWeight:'800', letterSpacing:'0.3px' }}>
          {label} {!isStopped && faceCount > 1 && <span style={{ marginLeft:'5px', opacity: 0.85, fontWeight:'600' }}>×{faceCount}</span>}
        </span>
        <span style={{ fontSize:'11px', opacity: 0.85, fontVariantNumeric: 'tabular-nums' }}>
          {formatTime(sessSec)} · {pct}% focus
        </span>
      </div>
      <div style={{
        width: '6px', height: '6px', borderRadius: '50%', background: '#fff',
        opacity: isStopped ? 0 : 1, animation: isStopped ? 'none' : 'pulse 1.5s infinite',
      }} />
      <style>{`@keyframes pulse { 0%,100% { opacity:1; transform:scale(1) } 50% { opacity:0.4; transform:scale(0.8) } }`}</style>
    </div>
  )
}