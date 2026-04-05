// import React, { useState, useRef } from 'react'
// import { supabase } from '../../lib/supabase'
// import { useAuth } from '../../context/AuthContext'

// async function extractText(file) {
//   const ext = file.name.split(".").pop().toLowerCase()
//   if (ext === "txt") return await file.text()
//   if (ext === "pdf") {
//     const pdfjsLib = await import("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js")
//     pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"
//     const arrayBuffer = await file.arrayBuffer()
//     const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
//     let text = ""
//     for (let i = 1; i <= pdf.numPages; i++) {
//       const page = await pdf.getPage(i)
//       const content = await page.getTextContent()
//       text += content.items.map(item => item.str).join(" ") + "\n"
//     }
//     return text
//   }
//   if (ext === "docx") {
//     const mammoth = await import("mammoth")
//     const arrayBuffer = await file.arrayBuffer()
//     const result = await mammoth.extractRawText({ arrayBuffer })
//     return result.value
//   }
//   throw new Error("Unsupported file type. Use PDF, DOCX, or TXT.")
// }

// async function hashText(text) {
//   const encoder = new TextEncoder()
//   const data = encoder.encode(text.trim())
//   const hashBuffer = await crypto.subtle.digest("SHA-256", data)
//   return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("")
// }

// async function callEdgeFunction(text) {
//   const { data: { session } } = await supabase.auth.getSession()
//   const response = await fetch("https://haifltxssolrfkgabxee.supabase.co/functions/v1/analyze-assignment", {
//     method: "POST",
//     headers: { "Content-Type": "application/json", "Authorization": "Bearer " + session?.access_token },
//     body: JSON.stringify({ text })
//   })
//   return await response.json()
// }

// const scoreColor = (s) => s >= 75 ? "#16a34a" : s >= 50 ? "#f59e0b" : "#ef4444"
// const scoreBg = (s) => s >= 75 ? "#dcfce7" : s >= 50 ? "#fef9c3" : "#fee2e2"
// const parseList = (val) => { if (!val) return []; try { return JSON.parse(val) } catch { return [val] } }

// function ResultCard({ data }) {
//   return (
//     <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
//       <div style={{ backgroundColor: scoreBg(data.score), borderRadius: "12px", padding: "20px", textAlign: "center" }}>
//         <p style={{ fontSize: "48px", fontWeight: "800", color: scoreColor(data.score), margin: 0 }}>{data.score}</p>
//         <p style={{ fontSize: "13px", color: "#6b7280", margin: "4px 0 0" }}>Score out of 100</p>
//       </div>
//       {data.summary && (
//         <div style={{ backgroundColor: "#f9fafb", borderRadius: "10px", padding: "16px" }}>
//           <p style={{ fontSize: "13px", fontWeight: "700", color: "#374151", margin: "0 0 6px", textTransform: "uppercase" }}>Summary</p>
//           <p style={{ fontSize: "14px", color: "#374151", lineHeight: "1.6", margin: 0 }}>{data.summary}</p>
//         </div>
//       )}
//       {[
//         { key: "strengths", label: "Strengths", bg: "#dcfce7", color: "#166534", icon: "✅" },
//         { key: "weaknesses", label: "Weaknesses", bg: "#fee2e2", color: "#dc2626", icon: "⚠️" },
//         { key: "suggestions", label: "Suggestions", bg: "#dbeafe", color: "#1d4ed8", icon: "💡" },
//       ].map(({ key, label, bg, color, icon }) => (
//         <div key={key} style={{ backgroundColor: bg, borderRadius: "10px", padding: "16px" }}>
//           <p style={{ fontSize: "13px", fontWeight: "700", color, margin: "0 0 10px", textTransform: "uppercase" }}>{icon} {label}</p>
//           <ul style={{ margin: 0, paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "6px" }}>
//             {parseList(data[key]).map((item, i) => (
//               <li key={i} style={{ fontSize: "14px", color: "#374151", lineHeight: "1.5" }}>{item}</li>
//             ))}
//           </ul>
//         </div>
//       ))}
//     </div>
//   )
// }

// function HistoryCard({ h }) {
//   const [expanded, setExpanded] = React.useState(false)
//   const [showText, setShowText] = React.useState(false)
//   return (
//     <div style={{ backgroundColor: "#fff", borderRadius: "12px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", borderLeft: "4px solid " + scoreColor(h.score), overflow: "hidden" }}>
//       <div onClick={() => setExpanded(!expanded)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", cursor: "pointer" }}>
//         <div style={{ flex: 1 }}>
//           <p style={{ fontWeight: "700", color: "#1a1a2e", margin: "0 0 2px", fontSize: "14px" }}>{h.file_name}</p>
//           <p style={{ fontSize: "12px", color: "#9ca3af", margin: 0 }}>{new Date(h.created_at).toLocaleDateString("en-IN")}</p>
//         </div>
//         <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
//           <div style={{ backgroundColor: scoreBg(h.score), borderRadius: "20px", padding: "4px 14px" }}>
//             <span style={{ fontSize: "15px", fontWeight: "800", color: scoreColor(h.score) }}>{h.score}/100</span>
//           </div>
//           <span style={{ color: "#9ca3af", fontSize: "16px", display: "inline-block", transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>▾</span>
//         </div>
//       </div>
//       {expanded && (
//         <div style={{ padding: "0 18px 18px", borderTop: "1px solid #f3f4f6" }}>
//           {h.summary && (
//             <div style={{ backgroundColor: "#f9fafb", borderRadius: "8px", padding: "12px", margin: "14px 0 12px" }}>
//               <p style={{ fontSize: "12px", fontWeight: "700", color: "#9ca3af", textTransform: "uppercase", margin: "0 0 4px" }}>Summary</p>
//               <p style={{ fontSize: "13px", color: "#374151", lineHeight: "1.6", margin: 0 }}>{h.summary}</p>
//             </div>
//           )}
//           <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "12px" }}>
//             {[
//               { key: "strengths", label: "Strengths", bg: "#dcfce7", color: "#166534", icon: "✅" },
//               { key: "weaknesses", label: "Weaknesses", bg: "#fee2e2", color: "#dc2626", icon: "⚠️" },
//               { key: "suggestions", label: "Suggestions", bg: "#dbeafe", color: "#1d4ed8", icon: "💡" },
//             ].map(({ key, label, bg, color, icon }) => (
//               <div key={key} style={{ backgroundColor: bg, borderRadius: "8px", padding: "12px" }}>
//                 <p style={{ fontSize: "11px", fontWeight: "700", color, margin: "0 0 8px", textTransform: "uppercase" }}>{icon} {label}</p>
//                 <ul style={{ margin: 0, paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "4px" }}>
//                   {parseList(h[key]).map((item, i) => (
//                     <li key={i} style={{ fontSize: "12px", color: "#374151", lineHeight: "1.5" }}>{item}</li>
//                   ))}
//                 </ul>
//               </div>
//             ))}
//           </div>
//           {h.extracted_text && (
//             <div>
//               <button onClick={(e) => { e.stopPropagation(); setShowText(!showText) }} style={{ fontSize: "12px", color: "#4f46e5", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: "600" }}>
//                 {showText ? "▲ Hide submitted text" : "▼ View submitted text"}
//               </button>
//               {showText && (
//                 <div style={{ backgroundColor: "#f9fafb", borderRadius: "8px", padding: "12px", marginTop: "8px", maxHeight: "200px", overflowY: "auto" }}>
//                   <p style={{ fontSize: "13px", color: "#374151", lineHeight: "1.6", margin: 0, whiteSpace: "pre-wrap" }}>{h.extracted_text}</p>
//                 </div>
//               )}
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   )
// }

// export default function AssignmentAnalyzer() {
//   const { profile } = useAuth()
//   const [mode, setMode] = useState("file")
//   const [pastedText, setPastedText] = useState("")
//   const [fileName, setFileName] = useState("")
//   const [result, setResult] = useState(null)
//   const [history, setHistory] = useState([])
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState("")
//   const [tab, setTab] = useState("analyze")
//   const fileRef = useRef()

//   const loadHistory = async () => {
//     const { data } = await supabase.from("assignment_analysis").select("*").eq("student_id", profile.id).order("created_at", { ascending: false })
//     setHistory(data || [])
//   }

//   const handleTabChange = (t) => {
//     setTab(t)
//     if (t === "history") loadHistory()
//   }

//   const handleAnalyze = async (file) => {
//     setLoading(true)
//     setError("")
//     setResult(null)
//     try {
//       let text = ""
//       let name = ""
//       if (mode === "file" && file) {
//         text = await extractText(file)
//         name = file.name
//       } else {
//         text = pastedText.trim()
//         name = "Pasted Text"
//       }
//       if (!text || text.length < 50) throw new Error("Text too short. Please provide more content.")
//       const hash = await hashText(text)
//       const { data: cached } = await supabase.from("assignment_analysis").select("*").eq("student_id", profile.id).eq("file_hash", hash).maybeSingle()
//       if (cached) { setResult(cached); setLoading(false); return }
//       const analysis = await callEdgeFunction(text)
//       const { data: saved } = await supabase.from("assignment_analysis").insert({
//         student_id: profile.id,
//         file_hash: hash,
//         file_name: name,
//         extracted_text: text.slice(0, 5000),
//         strengths: JSON.stringify(analysis.strengths || []),
//         weaknesses: JSON.stringify(analysis.weaknesses || []),
//         suggestions: JSON.stringify(analysis.suggestions || []),
//         score: analysis.score || 0,
//         summary: analysis.summary || "",
//       }).select().single()
//       setResult(saved)
//     } catch (e) {
//       setError(e.message)
//     }
//     setLoading(false)
//   }

//   const handleFileChange = (e) => {
//     const file = e.target.files[0]
//     if (file) { setFileName(file.name); handleAnalyze(file) }
//   }

//   return (
//     <div>
//       <h1 style={S.title}>AI Assignment Analyzer</h1>
//       <div style={S.tabs}>
//         {["analyze", "history"].map(t => (
//           <button key={t} onClick={() => handleTabChange(t)} style={{ ...S.tab, borderBottom: tab === t ? "2px solid #4f46e5" : "2px solid transparent", color: tab === t ? "#4f46e5" : "#6b7280", fontWeight: tab === t ? "600" : "400" }}>
//             {t === "analyze" ? "📝 Analyze" : "📂 History"}
//           </button>
//         ))}
//       </div>

//       {tab === "analyze" && (
//         <div style={{ display: "grid", gridTemplateColumns: result ? "1fr 1fr" : "1fr", gap: "24px" }}>
//           <div style={S.card}>
//             <div style={S.modeTabs}>
//               {[["file", "Upload File"], ["text", "Paste Text"]].map(([m, l]) => (
//                 <button key={m} onClick={() => { setMode(m); setResult(null); setError("") }} style={{ ...S.modeTab, backgroundColor: mode === m ? "#4f46e5" : "#f3f4f6", color: mode === m ? "#fff" : "#374151" }}>{l}</button>
//               ))}
//             </div>
//             {mode === "file" ? (
//               <div onClick={() => fileRef.current.click()} style={S.dropzone}>
//                 <p style={{ fontSize: "32px", margin: "0 0 8px" }}>📄</p>
//                 <p style={{ fontSize: "15px", fontWeight: "600", color: "#374151", margin: "0 0 4px" }}>{fileName || "Click to upload file"}</p>
//                 <p style={{ fontSize: "13px", color: "#9ca3af", margin: 0 }}>Supports PDF, DOCX, TXT</p>
//                 <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" style={{ display: "none" }} onChange={handleFileChange} />
//               </div>
//             ) : (
//               <div>
//                 <textarea style={{ ...S.input, minHeight: "200px", resize: "vertical" }} value={pastedText} onChange={e => setPastedText(e.target.value)} placeholder="Paste your assignment text here..." />
//                 <button style={{ ...S.analyzeBtn, marginTop: "12px", opacity: loading ? 0.7 : 1 }} onClick={() => handleAnalyze(null)} disabled={loading || !pastedText.trim()}>
//                   {loading ? "Analyzing..." : "🔍 Analyze"}
//                 </button>
//               </div>
//             )}
//             {loading && (
//               <div style={{ textAlign: "center", padding: "24px" }}>
//                 <p style={{ fontSize: "24px", margin: "0 0 8px" }}>🤖</p>
//                 <p style={{ color: "#4f46e5", fontWeight: "600" }}>AI is analyzing your assignment...</p>
//               </div>
//             )}
//             {error && <p style={{ color: "#ef4444", fontSize: "14px", marginTop: "12px", backgroundColor: "#fee2e2", padding: "12px", borderRadius: "8px" }}>{error}</p>}
//           </div>
//           {result && (
//             <div style={S.card}>
//               <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#1a1a2e", marginBottom: "16px" }}>Analysis Result</h2>
//               <ResultCard data={result} />
//             </div>
//           )}
//         </div>
//       )}

//       {tab === "history" && (
//         <div>
//           {history.length === 0 ? (
//             <div style={S.empty}>
//               <p style={{ fontSize: "40px", margin: "0 0 12px" }}>📂</p>
//               <p style={{ color: "#6b7280" }}>No past analyses yet.</p>
//             </div>
//           ) : (
//             <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
//               {history.map(h => <HistoryCard key={h.id} h={h} />)}
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   )
// }

// const S = {
//   title: { fontSize: "24px", fontWeight: "700", color: "#1a1a2e", marginBottom: "24px" },
//   tabs: { display: "flex", gap: "4px", borderBottom: "1px solid #e5e7eb", marginBottom: "24px" },
//   tab: { padding: "10px 16px", background: "none", border: "none", cursor: "pointer", fontSize: "14px" },
//   card: { backgroundColor: "#fff", borderRadius: "12px", padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" },
//   modeTabs: { display: "flex", gap: "8px", marginBottom: "20px" },
//   modeTab: { padding: "8px 16px", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "600" },
//   dropzone: { border: "2px dashed #e5e7eb", borderRadius: "12px", padding: "40px 20px", textAlign: "center", cursor: "pointer" },
//   input: { width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "14px", outline: "none", boxSizing: "border-box", fontFamily: "inherit" },
//   analyzeBtn: { width: "100%", padding: "12px", backgroundColor: "#4f46e5", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "600" },
//   empty: { textAlign: "center", padding: "60px 0" },
// }


import React, { useState, useRef, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

// --- HELPER FUNCTIONS ---
async function extractText(file) {
  const ext = file.name.split(".").pop().toLowerCase()
  if (ext === "txt") return await file.text()
  if (ext === "pdf") {
    const pdfjsLib = await import("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js")
    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    let text = ""
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      text += content.items.map(item => item.str).join(" ") + "\n"
    }
    return text
  }
  if (ext === "docx") {
    const mammoth = await import("mammoth")
    const arrayBuffer = await file.arrayBuffer()
    const result = await mammoth.extractRawText({ arrayBuffer })
    return result.value
  }
  throw new Error("Unsupported file type. Use PDF, DOCX, or TXT.")
}

async function hashText(text) {
  const encoder = new TextEncoder()
  const data = encoder.encode(text.trim())
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("")
}

async function callEdgeFunction(text) {
  const { data: { session } } = await supabase.auth.getSession()
  const response = await fetch("https://haifltxssolrfkgabxee.supabase.co/functions/v1/analyze-assignment", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + session?.access_token },
    body: JSON.stringify({ text })
  })
  return await response.json()
}

const scoreColor = (s) => s >= 75 ? "#16a34a" : s >= 50 ? "#f59e0b" : "#ef4444"
const scoreBg = (s) => s >= 75 ? "#f0fdf4" : s >= 50 ? "#fffbeb" : "#fef2f2"
const parseList = (val) => { if (!val) return []; try { return JSON.parse(val) } catch { return [val] } }

// --- UI COMPONENTS ---

function ResultCard({ data }) {
  return (
    <div style={styles.fadeIn}>
      <div style={{ ...styles.scoreCircle, backgroundColor: scoreBg(data.score), border: `2px solid ${scoreColor(data.score)}` }}>
        <p style={{ fontSize: "42px", fontWeight: "900", color: scoreColor(data.score), margin: 0 }}>{data.score}</p>
        <p style={{ fontSize: "11px", color: scoreColor(data.score), fontWeight: '700', textTransform: 'uppercase' }}>AI Score</p>
      </div>

      {data.summary && (
        <div style={styles.summaryBox}>
          <p style={styles.boxLabel}>🤖 Executive Summary</p>
          <p style={styles.boxText}>{data.summary}</p>
        </div>
      )}

      <div style={styles.bentoGrid}>
        {[
          { key: "strengths", label: "Key Strengths", bg: "#f0fdf4", color: "#166534", icon: "💎", border: '#bbf7d0' },
          { key: "weaknesses", label: "Areas to Improve", bg: "#fef2f2", color: "#991b1b", icon: "🎯", border: '#fecaca' },
          { key: "suggestions", label: "AI Suggestions", bg: "#eff6ff", color: "#1e40af", icon: "💡", border: '#bfdbfe' },
        ].map(({ key, label, bg, color, icon, border }) => (
          <div key={key} style={{ ...styles.bentoItem, backgroundColor: bg, border: `1px solid ${border}` }}>
            <p style={{ ...styles.bentoLabel, color }}>{icon} {label}</p>
            <ul style={styles.bentoList}>
              {parseList(data[key]).map((item, i) => (
                <li key={i} style={{ ...styles.bentoText, color }}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

function HistoryCard({ h }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div style={{ ...styles.card, padding: 0, marginBottom: '12px', borderLeft: `6px solid ${scoreColor(h.score)}` }}>
      <div onClick={() => setExpanded(!expanded)} style={styles.historyHeader}>
        <div style={{ flex: 1 }}>
          <p style={styles.historyTitle}>{h.file_name}</p>
          <p style={styles.historyDate}>{new Date(h.created_at).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ ...styles.historyBadge, color: scoreColor(h.score), backgroundColor: scoreBg(h.score) }}>{h.score}/100</span>
          <span style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }}>▼</span>
        </div>
      </div>
      {expanded && (
        <div style={styles.historyBody}>
          <ResultCard data={h} />
        </div>
      )}
    </div>
  )
}

export default function AssignmentAnalyzer() {
  const { profile } = useAuth()
  const [mode, setMode] = useState("file")
  const [pastedText, setPastedText] = useState("")
  const [fileName, setFileName] = useState("")
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [tab, setTab] = useState("analyze")
  const fileRef = useRef()

  const loadHistory = async () => {
    const { data } = await supabase.from("assignment_analysis").select("*").eq("student_id", profile.id).order("created_at", { ascending: false })
    setHistory(data || [])
  }

  const handleAnalyze = async (file) => {
    setLoading(true); setError(""); setResult(null)
    try {
      let text = ""
      let name = ""
      if (mode === "file" && file) {
        text = await extractText(file); name = file.name
      } else {
        text = pastedText.trim(); name = "Pasted Content"
      }
      if (!text || text.length < 50) throw new Error("Content too short. Please provide at least a few sentences.")
      
      const hash = await hashText(text)
      const { data: cached } = await supabase.from("assignment_analysis").select("*").eq("student_id", profile.id).eq("file_hash", hash).maybeSingle()
      if (cached) { setResult(cached); setLoading(false); return }
      
      const analysis = await callEdgeFunction(text)
      const { data: saved } = await supabase.from("assignment_analysis").insert({
        student_id: profile.id,
        file_hash: hash,
        file_name: name,
        extracted_text: text.slice(0, 5000),
        strengths: JSON.stringify(analysis.strengths || []),
        weaknesses: JSON.stringify(analysis.weaknesses || []),
        suggestions: JSON.stringify(analysis.suggestions || []),
        score: analysis.score || 0,
        summary: analysis.summary || "",
      }).select().single()
      setResult(saved)
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  return (
    <div style={styles.container}>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>AI Assignment Analyzer</h1>
        <p style={styles.pageSubtitle}>Upload your work and let AI provide instant feedback and grading</p>
      </div>

      <div style={styles.tabBar}>
        {["analyze", "history"].map(t => (
          <button key={t} onClick={() => { setTab(t); if(t==='history') loadHistory() }} style={{ 
            ...styles.tab, 
            color: tab === t ? "#4f46e5" : "#64748b",
            borderBottom: tab === t ? "3px solid #4f46e5" : "3px solid transparent",
            fontWeight: tab === t ? '700' : '500'
          }}>
            {t === "analyze" ? "🧠 New Analysis" : "📂 Past Reports"}
          </button>
        ))}
      </div>

      {tab === "analyze" && (
        <div style={{ display: "grid", gridTemplateColumns: result ? "450px 1fr" : "1fr", gap: "24px", alignItems: 'start' }}>
          <div style={styles.card}>
            <div style={styles.modeTabs}>
              {["file", "text"].map(m => (
                <button key={m} onClick={() => { setMode(m); setResult(null); setError("") }} style={{ 
                  ...styles.modeTab, 
                  backgroundColor: mode === m ? "#4f46e5" : "#f1f5f9", 
                  color: mode === m ? "#fff" : "#475569" 
                }}>
                  {m === "file" ? "📎 Upload Document" : "✍️ Paste Text"}
                </button>
              ))}
            </div>

            {mode === "file" ? (
              <div onClick={() => fileRef.current.click()} style={styles.dropzone}>
                <div style={styles.dropIcon}>☁️</div>
                <p style={styles.dropTitle}>{fileName || "Choose a file to analyze"}</p>
                <p style={styles.dropSub}>PDF, DOCX, or TXT (Max 5MB)</p>
                <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" style={{ display: "none" }} onChange={(e) => handleFileChange(e, handleAnalyze)} />
              </div>
            ) : (
              <div>
                <textarea style={styles.textarea} value={pastedText} onChange={e => setPastedText(e.target.value)} placeholder="Paste your assignment or essay here..." />
                <button style={{ ...styles.analyzeBtn, marginTop: "16px" }} onClick={() => handleAnalyze(null)} disabled={loading || !pastedText.trim()}>
                  {loading ? "⌛ Processing..." : "🚀 Run AI Analysis"}
                </button>
              </div>
            )}

            {loading && (
              <div style={styles.loadingOverlay}>
                <div style={styles.spinner}></div>
                <p style={{ color: "#4f46e5", fontWeight: "700", marginTop: '12px' }}>AI is reading your work...</p>
              </div>
            )}
            
            {error && <div style={styles.errorBox}>{error}</div>}
          </div>

          {result && (
            <div style={{ ...styles.card, animation: 'slideIn 0.4s ease-out' }}>
              <div style={styles.cardHeader}>
                <h2 style={styles.sectionTitle}>✨ Analysis Results</h2>
                <button onClick={() => setResult(null)} style={styles.closeBtnSmall}>Reset</button>
              </div>
              <ResultCard data={result} />
            </div>
          )}
        </div>
      )}

      {tab === "history" && (
        <div style={styles.fadeIn}>
          {history.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🗃️</div>
              <p style={{ color: "#64748b", fontWeight: '500' }}>No previous analyses found.</p>
            </div>
          ) : (
            history.map(h => <HistoryCard key={h.id} h={h} />)
          )}
        </div>
      )}
    </div>
  )
}

const handleFileChange = (e, callback) => {
  const file = e.target.files[0]
  if (file) callback(file)
}

// --- STYLES ---
const styles = {
  container: { maxWidth: '1200px', margin: '0 auto', padding: '20px', fontFamily: 'Inter, sans-serif' },
  pageHeader: { marginBottom: '32px' },
  pageTitle: { fontSize: '32px', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-1px' },
  pageSubtitle: { fontSize: '15px', color: '#64748b', marginTop: '6px' },
  
  tabBar: { display: "flex", gap: "24px", marginBottom: "32px", borderBottom: "1px solid #e2e8f0" },
  tab: { padding: "12px 4px", background: "none", border: "none", cursor: "pointer", fontSize: "15px", transition: '0.2s' },

  card: { backgroundColor: "#fff", borderRadius: "20px", padding: "32px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.04), 0 4px 6px -2px rgba(0,0,0,0.02)", border: "1px solid #f1f5f9", position: 'relative' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  sectionTitle: { fontSize: "20px", fontWeight: "800", color: "#0f172a", margin: 0 },
  
  modeTabs: { display: "flex", gap: "10px", marginBottom: "24px", backgroundColor: '#f1f5f9', padding: '6px', borderRadius: '12px' },
  modeTab: { flex: 1, padding: "10px", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "700", transition: '0.2s' },
  
  dropzone: { border: "2px dashed #e2e8f0", borderRadius: "16px", padding: "60px 20px", textAlign: "center", cursor: "pointer", transition: '0.2s', backgroundColor: '#fcfcfd' },
  dropIcon: { fontSize: "40px", marginBottom: "12px" },
  dropTitle: { fontSize: "16px", fontWeight: "700", color: "#1e293b", margin: "0 0 4px" },
  dropSub: { fontSize: "13px", color: "#94a3b8", margin: 0 },
  
  textarea: { width: "100%", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "14px", outline: "none", minHeight: "250px", fontFamily: "inherit", backgroundColor: '#f8fafc' },
  analyzeBtn: { width: "100%", padding: "14px", backgroundColor: "#4f46e5", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontSize: "15px", fontWeight: "700", boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.4)' },
  
  scoreCircle: { width: '100px', height: '100px', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' },
  
  summaryBox: { backgroundColor: "#f8fafc", borderRadius: "14px", padding: "20px", marginBottom: "20px", border: '1px solid #e2e8f0' },
  boxLabel: { fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: '1px', marginBottom: '8px' },
  boxText: { fontSize: "14px", color: "#334155", lineHeight: "1.7", margin: 0 },
  
  bentoGrid: { display: 'flex', flexDirection: 'column', gap: '12px' },
  bentoItem: { padding: '20px', borderRadius: '16px' },
  bentoLabel: { fontSize: '14px', fontWeight: '800', margin: '0 0 10px 0' },
  bentoList: { margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' },
  bentoText: { fontSize: '13px', fontWeight: '500', lineHeight: '1.4' },
  
  historyHeader: { padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' },
  historyTitle: { fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0' },
  historyDate: { fontSize: '12px', color: '#94a3b8', margin: 0 },
  historyBadge: { padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '800' },
  historyBody: { padding: '24px', borderTop: '1px solid #f1f5f9', backgroundColor: '#fcfcfd' },

  loadingOverlay: { textAlign: "center", padding: "40px 0" },
  errorBox: { color: "#ef4444", fontSize: "13px", marginTop: "16px", backgroundColor: "#fef2f2", padding: "12px", borderRadius: "10px", border: '1px solid #fecaca', fontWeight: '600' },
  emptyState: { textAlign: "center", padding: "100px 0", border: '2px dashed #e2e8f0', borderRadius: '20px' },
  closeBtnSmall: { background: '#f1f5f9', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' },
  fadeIn: { animation: 'fadeIn 0.3s ease-in' },
}