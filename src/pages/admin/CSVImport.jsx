// src/pages/admin/CSVImport.jsx
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { logActivity } from '../../lib/logActivity'

const SAMPLE_CSV = `name,email,password,phone,gender,class_name,roll_no
Rahul Sharma,rahul@school.com,pass1234,9876543210,Male,1,101
Priya Singh,priya@school.com,pass1234,9876543211,Female,2,201`

export default function CSVImport({ onClose, onDone }) {
  const { profile } = useAuth()
  const [step,     setStep]     = useState('upload') // upload|preview|importing|done
  const [rows,     setRows]     = useState([])
  const [results,  setResults]  = useState([])
  const [error,    setError]    = useState('')

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'sample_students.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text  = ev.target.result
      const lines = text.trim().split('\n')
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      const required = ['name','email','password','class_name','roll_no']
      const missing  = required.filter(r => !headers.includes(r))
      if (missing.length > 0) { setError(`Missing columns: ${missing.join(', ')}`); return }
      const parsed = lines.slice(1).map((line, i) => {
        const vals = line.split(',').map(v => v.trim())
        const obj  = {}
        headers.forEach((h, j) => obj[h] = vals[j] || '')
        obj._row = i + 2
        return obj
      }).filter(r => r.name && r.email)
      setRows(parsed)
      setError('')
      setStep('preview')
    }
    reader.readAsText(file)
  }

  const runImport = async () => {
    setStep('importing')
    const { supabase } = await import('../../lib/supabase')
      const res = []

    for (const row of rows) {
      try {
        // 1. Get class_id
        const { data: cls } = await supabase.from('classes').select('id').eq('name', row.class_name).single()
        if (!cls) { res.push({ ...row, status:'error', msg:`Class "${row.class_name}" not found` }); continue }

        // 2. Create auth user via Edge Function
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
          body: JSON.stringify({ email: row.email, password: row.password })
        })
        const authResult = await response.json()
        if (authResult.error) { res.push({ ...row, status:'error', msg: authResult.error }); continue }

        const userId = authResult.user?.id
        const uid = row.roll_no || `1${new Date().getFullYear().toString().slice(-2)}${Math.floor(1000+Math.random()*9000)}`

        // 3. Create profile
        await supabase.from('profiles').insert({
          id: userId, uid, role:'student',
          name: row.name, email: row.email,
          phone: row.phone || '', gender: row.gender || ''
        })

        // 4. Create student record
        await supabase.from('students').insert({
          id: userId,
          student_id: uid,
          class_id: cls.id,
          roll_no: uid
        })

        res.push({ ...row, status:'success', msg:'Created successfully' })
      } catch(e) {
        res.push({ ...row, status:'error', msg: e.message })
      }
    }

    const successCount = res.filter(r=>r.status==='success').length
    await logActivity({
      performed_by: profile.id,
      performed_by_name: profile.name,
      role: 'admin',
      action: 'CSV Import',
      target_type: 'students',
      target_name: `${successCount} students`,
      details: `Imported ${successCount}/${rows.length} students successfully`
    })

    setResults(res)
    setStep('done')
    if (successCount > 0) onDone()
  }

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
          <div>
            <h3 style={{ margin:0, fontSize:'18px', fontWeight:'800', color:'#1e293b' }}>📥 Bulk CSV Import</h3>
            <p style={{ margin:'3px 0 0', fontSize:'13px', color:'#64748b' }}>Import multiple students at once via CSV</p>
          </div>
          <button style={{ background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'#9ca3af' }} onClick={onClose}>✕</button>
        </div>

        {step==='upload' && (
          <div>
            <div style={{ background:'#f8fafc', border:'2px dashed #e2e8f0', borderRadius:'12px', padding:'30px', textAlign:'center', marginBottom:'16px' }}>
              <span style={{ fontSize:'40px' }}>📄</span>
              <p style={{ margin:'10px 0 4px', fontWeight:'700', color:'#374151' }}>Upload CSV File</p>
              <p style={{ margin:'0 0 16px', fontSize:'13px', color:'#94a3b8' }}>Columns: name, email, password, phone, gender, class_name, roll_no</p>
              <input type="file" accept=".csv" onChange={handleFile} style={{ display:'none' }} id="csv-input" />
              <label htmlFor="csv-input" style={{ padding:'10px 24px', background:'#4f46e5', color:'#fff', borderRadius:'8px', cursor:'pointer', fontSize:'14px', fontWeight:'700' }}>
                Choose File
              </label>
            </div>
            {error && <div style={{ background:'#fef2f2', color:'#dc2626', padding:'10px 14px', borderRadius:'8px', fontSize:'13px', marginBottom:'12px' }}>❌ {error}</div>}
            <button style={S.btnGhost} onClick={downloadSample}>⬇️ Download Sample CSV</button>
          </div>
        )}

        {step==='preview' && (
          <div>
            <div style={{ background:'#f0fdf4', border:'1px solid #86efac', borderRadius:'8px', padding:'10px 14px', marginBottom:'14px', fontSize:'13px', color:'#16a34a', fontWeight:'600' }}>
              ✅ {rows.length} students ready to import
            </div>
            <div style={{ maxHeight:'300px', overflowY:'auto', border:'1px solid #e2e8f0', borderRadius:'8px' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr>{['Row','Name','Email','Class','Roll No'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {rows.map((r,i)=>(
                    <tr key={i}>
                      <td style={S.td}>{r._row}</td>
                      <td style={{...S.td,fontWeight:'600'}}>{r.name}</td>
                      <td style={S.td}>{r.email}</td>
                      <td style={S.td}>{r.class_name}</td>
                      <td style={S.td}>{r.roll_no}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display:'flex', gap:'10px', marginTop:'16px' }}>
              <button style={S.btnPrimary} onClick={runImport}>🚀 Import {rows.length} Students</button>
              <button style={S.btnGhost} onClick={()=>setStep('upload')}>← Back</button>
            </div>
          </div>
        )}

        {step==='importing' && (
          <div style={{ textAlign:'center', padding:'40px' }}>
            <span style={{ fontSize:'40px' }}>⏳</span>
            <p style={{ color:'#6366f1', fontWeight:'700', fontSize:'16px', margin:'12px 0 4px' }}>Importing students...</p>
            <p style={{ color:'#94a3b8', fontSize:'13px' }}>Please wait, do not close this window</p>
          </div>
        )}

        {step==='done' && (
          <div>
            <div style={{ display:'flex', gap:'12px', marginBottom:'14px' }}>
              <div style={{ flex:1, background:'#f0fdf4', borderRadius:'8px', padding:'12px', textAlign:'center' }}>
                <p style={{ margin:0, fontSize:'24px', fontWeight:'800', color:'#16a34a' }}>{results.filter(r=>r.status==='success').length}</p>
                <p style={{ margin:'3px 0 0', fontSize:'12px', color:'#16a34a', fontWeight:'600' }}>Imported</p>
              </div>
              <div style={{ flex:1, background:'#fef2f2', borderRadius:'8px', padding:'12px', textAlign:'center' }}>
                <p style={{ margin:0, fontSize:'24px', fontWeight:'800', color:'#ef4444' }}>{results.filter(r=>r.status==='error').length}</p>
                <p style={{ margin:'3px 0 0', fontSize:'12px', color:'#ef4444', fontWeight:'600' }}>Failed</p>
              </div>
            </div>
            <div style={{ maxHeight:'280px', overflowY:'auto', border:'1px solid #e2e8f0', borderRadius:'8px' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr>{['Name','Email','Class','Status','Message'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {results.map((r,i)=>(
                    <tr key={i}>
                      <td style={{...S.td,fontWeight:'600'}}>{r.name}</td>
                      <td style={S.td}>{r.email}</td>
                      <td style={S.td}>{r.class_name}</td>
                      <td style={S.td}>
                        <span style={{ background:r.status==='success'?'#f0fdf4':'#fef2f2', color:r.status==='success'?'#16a34a':'#ef4444', padding:'2px 8px', borderRadius:'8px', fontSize:'12px', fontWeight:'700' }}>
                          {r.status==='success'?'✅ Success':'❌ Failed'}
                        </span>
                      </td>
                      <td style={{...S.td,fontSize:'12px',color:'#64748b'}}>{r.msg}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button style={{...S.btnPrimary, marginTop:'16px'}} onClick={onClose}>Done</button>
          </div>
        )}
      </div>
    </div>
  )
}

const S = {
  overlay:    { position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'20px' },
  modal:      { background:'#fff', borderRadius:'16px', padding:'28px', width:'100%', maxWidth:'640px', maxHeight:'90vh', overflow:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' },
  th:         { padding:'10px 14px', fontSize:'11px', fontWeight:'700', color:'#6b7280', textTransform:'uppercase', background:'#f8fafc', textAlign:'left', borderBottom:'1px solid #f1f5f9' },
  td:         { padding:'10px 14px', fontSize:'13px', color:'#374151', borderBottom:'1px solid #f8fafc' },
  btnPrimary: { padding:'10px 22px', background:'#4f46e5', color:'#fff', border:'none', borderRadius:'8px', fontSize:'14px', fontWeight:'700', cursor:'pointer' },
  btnGhost:   { padding:'10px 18px', background:'#f1f5f9', color:'#374151', border:'none', borderRadius:'8px', fontSize:'14px', fontWeight:'600', cursor:'pointer' },
}
