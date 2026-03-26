import React, { useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

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
const scoreBg = (s) => s >= 75 ? "#dcfce7" : s >= 50 ? "#fef9c3" : "#fee2e2"
const parseList = (val) => { if (!val) return []; try { return JSON.parse(val) } catch { return [val] } }

function ResultCard({ data }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ backgroundColor: scoreBg(data.score), borderRadius: "12px", padding: "20px", textAlign: "center" }}>
        <p style={{ fontSize: "48px", fontWeight: "800", color: scoreColor(data.score), margin: 0 }}>{data.score}</p>
        <p style={{ fontSize: "13px", color: "#6b7280", margin: "4px 0 0" }}>Score out of 100</p>
      </div>
      {data.summary && (
        <div style={{ backgroundColor: "#f9fafb", borderRadius: "10px", padding: "16px" }}>
          <p style={{ fontSize: "13px", fontWeight: "700", color: "#374151", margin: "0 0 6px", textTransform: "uppercase" }}>Summary</p>
          <p style={{ fontSize: "14px", color: "#374151", lineHeight: "1.6", margin: 0 }}>{data.summary}</p>
        </div>
      )}
      {[
        { key: "strengths", label: "Strengths", bg: "#dcfce7", color: "#166534", icon: "✅" },
        { key: "weaknesses", label: "Weaknesses", bg: "#fee2e2", color: "#dc2626", icon: "⚠️" },
        { key: "suggestions", label: "Suggestions", bg: "#dbeafe", color: "#1d4ed8", icon: "💡" },
      ].map(({ key, label, bg, color, icon }) => (
        <div key={key} style={{ backgroundColor: bg, borderRadius: "10px", padding: "16px" }}>
          <p style={{ fontSize: "13px", fontWeight: "700", color, margin: "0 0 10px", textTransform: "uppercase" }}>{icon} {label}</p>
          <ul style={{ margin: 0, paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "6px" }}>
            {parseList(data[key]).map((item, i) => (
              <li key={i} style={{ fontSize: "14px", color: "#374151", lineHeight: "1.5" }}>{item}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

function HistoryCard({ h }) {
  const [expanded, setExpanded] = React.useState(false)
  const [showText, setShowText] = React.useState(false)
  return (
    <div style={{ backgroundColor: "#fff", borderRadius: "12px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", borderLeft: "4px solid " + scoreColor(h.score), overflow: "hidden" }}>
      <div onClick={() => setExpanded(!expanded)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", cursor: "pointer" }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: "700", color: "#1a1a2e", margin: "0 0 2px", fontSize: "14px" }}>{h.file_name}</p>
          <p style={{ fontSize: "12px", color: "#9ca3af", margin: 0 }}>{new Date(h.created_at).toLocaleDateString("en-IN")}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ backgroundColor: scoreBg(h.score), borderRadius: "20px", padding: "4px 14px" }}>
            <span style={{ fontSize: "15px", fontWeight: "800", color: scoreColor(h.score) }}>{h.score}/100</span>
          </div>
          <span style={{ color: "#9ca3af", fontSize: "16px", display: "inline-block", transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>▾</span>
        </div>
      </div>
      {expanded && (
        <div style={{ padding: "0 18px 18px", borderTop: "1px solid #f3f4f6" }}>
          {h.summary && (
            <div style={{ backgroundColor: "#f9fafb", borderRadius: "8px", padding: "12px", margin: "14px 0 12px" }}>
              <p style={{ fontSize: "12px", fontWeight: "700", color: "#9ca3af", textTransform: "uppercase", margin: "0 0 4px" }}>Summary</p>
              <p style={{ fontSize: "13px", color: "#374151", lineHeight: "1.6", margin: 0 }}>{h.summary}</p>
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "12px" }}>
            {[
              { key: "strengths", label: "Strengths", bg: "#dcfce7", color: "#166534", icon: "✅" },
              { key: "weaknesses", label: "Weaknesses", bg: "#fee2e2", color: "#dc2626", icon: "⚠️" },
              { key: "suggestions", label: "Suggestions", bg: "#dbeafe", color: "#1d4ed8", icon: "💡" },
            ].map(({ key, label, bg, color, icon }) => (
              <div key={key} style={{ backgroundColor: bg, borderRadius: "8px", padding: "12px" }}>
                <p style={{ fontSize: "11px", fontWeight: "700", color, margin: "0 0 8px", textTransform: "uppercase" }}>{icon} {label}</p>
                <ul style={{ margin: 0, paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  {parseList(h[key]).map((item, i) => (
                    <li key={i} style={{ fontSize: "12px", color: "#374151", lineHeight: "1.5" }}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {h.extracted_text && (
            <div>
              <button onClick={(e) => { e.stopPropagation(); setShowText(!showText) }} style={{ fontSize: "12px", color: "#4f46e5", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: "600" }}>
                {showText ? "▲ Hide submitted text" : "▼ View submitted text"}
              </button>
              {showText && (
                <div style={{ backgroundColor: "#f9fafb", borderRadius: "8px", padding: "12px", marginTop: "8px", maxHeight: "200px", overflowY: "auto" }}>
                  <p style={{ fontSize: "13px", color: "#374151", lineHeight: "1.6", margin: 0, whiteSpace: "pre-wrap" }}>{h.extracted_text}</p>
                </div>
              )}
            </div>
          )}
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

  const handleTabChange = (t) => {
    setTab(t)
    if (t === "history") loadHistory()
  }

  const handleAnalyze = async (file) => {
    setLoading(true)
    setError("")
    setResult(null)
    try {
      let text = ""
      let name = ""
      if (mode === "file" && file) {
        text = await extractText(file)
        name = file.name
      } else {
        text = pastedText.trim()
        name = "Pasted Text"
      }
      if (!text || text.length < 50) throw new Error("Text too short. Please provide more content.")
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

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) { setFileName(file.name); handleAnalyze(file) }
  }

  return (
    <div>
      <h1 style={S.title}>AI Assignment Analyzer</h1>
      <div style={S.tabs}>
        {["analyze", "history"].map(t => (
          <button key={t} onClick={() => handleTabChange(t)} style={{ ...S.tab, borderBottom: tab === t ? "2px solid #4f46e5" : "2px solid transparent", color: tab === t ? "#4f46e5" : "#6b7280", fontWeight: tab === t ? "600" : "400" }}>
            {t === "analyze" ? "📝 Analyze" : "📂 History"}
          </button>
        ))}
      </div>

      {tab === "analyze" && (
        <div style={{ display: "grid", gridTemplateColumns: result ? "1fr 1fr" : "1fr", gap: "24px" }}>
          <div style={S.card}>
            <div style={S.modeTabs}>
              {[["file", "Upload File"], ["text", "Paste Text"]].map(([m, l]) => (
                <button key={m} onClick={() => { setMode(m); setResult(null); setError("") }} style={{ ...S.modeTab, backgroundColor: mode === m ? "#4f46e5" : "#f3f4f6", color: mode === m ? "#fff" : "#374151" }}>{l}</button>
              ))}
            </div>
            {mode === "file" ? (
              <div onClick={() => fileRef.current.click()} style={S.dropzone}>
                <p style={{ fontSize: "32px", margin: "0 0 8px" }}>📄</p>
                <p style={{ fontSize: "15px", fontWeight: "600", color: "#374151", margin: "0 0 4px" }}>{fileName || "Click to upload file"}</p>
                <p style={{ fontSize: "13px", color: "#9ca3af", margin: 0 }}>Supports PDF, DOCX, TXT</p>
                <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" style={{ display: "none" }} onChange={handleFileChange} />
              </div>
            ) : (
              <div>
                <textarea style={{ ...S.input, minHeight: "200px", resize: "vertical" }} value={pastedText} onChange={e => setPastedText(e.target.value)} placeholder="Paste your assignment text here..." />
                <button style={{ ...S.analyzeBtn, marginTop: "12px", opacity: loading ? 0.7 : 1 }} onClick={() => handleAnalyze(null)} disabled={loading || !pastedText.trim()}>
                  {loading ? "Analyzing..." : "🔍 Analyze"}
                </button>
              </div>
            )}
            {loading && (
              <div style={{ textAlign: "center", padding: "24px" }}>
                <p style={{ fontSize: "24px", margin: "0 0 8px" }}>🤖</p>
                <p style={{ color: "#4f46e5", fontWeight: "600" }}>AI is analyzing your assignment...</p>
              </div>
            )}
            {error && <p style={{ color: "#ef4444", fontSize: "14px", marginTop: "12px", backgroundColor: "#fee2e2", padding: "12px", borderRadius: "8px" }}>{error}</p>}
          </div>
          {result && (
            <div style={S.card}>
              <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#1a1a2e", marginBottom: "16px" }}>Analysis Result</h2>
              <ResultCard data={result} />
            </div>
          )}
        </div>
      )}

      {tab === "history" && (
        <div>
          {history.length === 0 ? (
            <div style={S.empty}>
              <p style={{ fontSize: "40px", margin: "0 0 12px" }}>📂</p>
              <p style={{ color: "#6b7280" }}>No past analyses yet.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {history.map(h => <HistoryCard key={h.id} h={h} />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const S = {
  title: { fontSize: "24px", fontWeight: "700", color: "#1a1a2e", marginBottom: "24px" },
  tabs: { display: "flex", gap: "4px", borderBottom: "1px solid #e5e7eb", marginBottom: "24px" },
  tab: { padding: "10px 16px", background: "none", border: "none", cursor: "pointer", fontSize: "14px" },
  card: { backgroundColor: "#fff", borderRadius: "12px", padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" },
  modeTabs: { display: "flex", gap: "8px", marginBottom: "20px" },
  modeTab: { padding: "8px 16px", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "600" },
  dropzone: { border: "2px dashed #e5e7eb", borderRadius: "12px", padding: "40px 20px", textAlign: "center", cursor: "pointer" },
  input: { width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "14px", outline: "none", boxSizing: "border-box", fontFamily: "inherit" },
  analyzeBtn: { width: "100%", padding: "12px", backgroundColor: "#4f46e5", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "600" },
  empty: { textAlign: "center", padding: "60px 0" },
}
