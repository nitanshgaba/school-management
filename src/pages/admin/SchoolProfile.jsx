// src/pages/admin/SchoolProfile.jsx
import { useState, useEffect } from 'react'
import { clearSchoolSettingsCache } from '../../lib/schoolSettings'

const BOARDS = ['CBSE', 'ICSE', 'IB', 'State Board', 'NIOS', 'Other']
const DEFAULT_SERVICES = ['Transport', 'Hostel', 'Library', 'Sports', 'Computer Lab', 'Science Lab', 'Canteen', 'Medical']

export default function SchoolProfile() {
  const [settings, setSettings]   = useState(null)
  const [loading,  setLoading]    = useState(true)
  const [saving,   setSaving]     = useState(false)
  const [saved,    setSaved]      = useState(false)
  const [tab,      setTab]        = useState('basic')
  const [services, setServices]   = useState([])
  const [customSvc,setCustomSvc]  = useState('')

  useEffect(() => { loadSettings() }, [])

  const sb = async () => { const { supabase } = await import('../../lib/supabase'); return supabase }

  const loadSettings = async () => {
    setLoading(true)
    const s = await sb()
    const { data } = await s.from('school_settings').select('*').single()
    setSettings(data || {})
    setServices(data?.services || [])
    setLoading(false)
  }

  const save = async () => {
    setSaving(true)
    const s = await sb()
    await s.from('school_settings').update({
      ...settings,
      services,
      updated_at: new Date().toISOString()
    }).eq('id', settings.id)
    clearSchoolSettingsCache()
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    setSaving(false)
  }

  const toggleService = (svc) => {
    setServices(prev => prev.includes(svc) ? prev.filter(s=>s!==svc) : [...prev, svc])
  }

  const addCustomService = () => {
    if (!customSvc.trim() || services.includes(customSvc.trim())) return
    setServices(prev => [...prev, customSvc.trim()])
    setCustomSvc('')
  }

  const F = (key, label, type='text', placeholder='') => (
    <div key={key}>
      <label style={S.label}>{label}</label>
      <input style={S.input} type={type} placeholder={placeholder}
        value={settings?.[key] || ''}
        onChange={e => setSettings({...settings, [key]: e.target.value})} />
    </div>
  )

  if (loading) return <div style={S.empty}>Loading...</div>

  return (
    <div style={S.page}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'20px' }}>
        <div>
          <h2 style={S.title}>🏫 School Profile</h2>
          <p style={S.sub}>Configure school details — reflects on receipts, report cards, and question papers</p>
        </div>
        <button style={{...S.btnPrimary, opacity: saving?0.7:1}} onClick={save} disabled={saving}>
          {saving ? '💾 Saving...' : saved ? '✅ Saved!' : '💾 Save Changes'}
        </button>
      </div>

      <div style={S.tabs}>
        {[['basic','🏫 Basic Info'],['affiliation','📋 Affiliation'],['bank','🏦 Bank Details'],['services','⭐ Services']].map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)} style={{...S.tab,...(tab===t?S.tabActive:{})}}>{l}</button>
        ))}
      </div>

      {tab==='basic' && (
        <div style={S.formCard}>
          <p style={S.cardTitle}>Basic Information</p>
          <div style={S.grid}>
            {F('school_name', 'School Name *', 'text', 'e.g. Sunrise Public School')}
            {F('tagline', 'Tagline / Motto', 'text', 'e.g. Excellence in Education')}
            {F('principal_name', 'Principal Name', 'text', 'e.g. Dr. Rajesh Kumar')}
            {F('established_year', 'Established Year', 'text', 'e.g. 1995')}
            {F('phone', 'Phone', 'text', 'e.g. +91 98765 43210')}
            {F('email', 'Email', 'email', 'e.g. info@school.com')}
            {F('website', 'Website', 'text', 'e.g. www.school.com')}
            {F('logo_url', 'Logo URL', 'text', 'https://...')}
          </div>
          <div style={{ marginTop:'12px' }}>
            <label style={S.label}>Address</label>
            <textarea style={{...S.input, minHeight:'80px', resize:'vertical'}}
              placeholder="Full school address"
              value={settings?.address || ''}
              onChange={e=>setSettings({...settings, address:e.target.value})} />
          </div>

          {/* Preview card */}
          <div style={{ marginTop:'20px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'10px', padding:'20px' }}>
            <p style={{ margin:'0 0 12px', fontSize:'12px', fontWeight:'700', color:'#94a3b8', textTransform:'uppercase' }}>Preview — How it appears on documents</p>
            <div style={{ textAlign:'center', borderBottom:'2px solid #1e293b', paddingBottom:'12px', marginBottom:'12px' }}>
              {settings?.logo_url && <img src={settings.logo_url} alt="logo" style={{ width:'50px', height:'50px', borderRadius:'50%', objectFit:'cover', marginBottom:'8px' }} onError={e=>e.target.style.display='none'} />}
              <p style={{ margin:0, fontSize:'18px', fontWeight:'800', color:'#1e293b' }}>{settings?.school_name || 'School Name'}</p>
              {settings?.tagline && <p style={{ margin:'2px 0 0', fontSize:'13px', color:'#64748b' }}>{settings.tagline}</p>}
              {settings?.address && <p style={{ margin:'4px 0 0', fontSize:'12px', color:'#94a3b8' }}>{settings.address}</p>}
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'12px', color:'#64748b' }}>
              {settings?.phone && <span>📞 {settings.phone}</span>}
              {settings?.email && <span>✉️ {settings.email}</span>}
              {settings?.website && <span>🌐 {settings.website}</span>}
            </div>
          </div>
        </div>
      )}

      {tab==='affiliation' && (
        <div style={S.formCard}>
          <p style={S.cardTitle}>Affiliation & Recognition</p>
          <div style={S.grid}>
            <div>
              <label style={S.label}>Board</label>
              <select style={S.input} value={settings?.board || 'CBSE'} onChange={e=>setSettings({...settings, board:e.target.value})}>
                {BOARDS.map(b=><option key={b}>{b}</option>)}
              </select>
            </div>
            {F('affiliation_no', 'Affiliation Number', 'text', 'e.g. 1234567')}
            {F('school_code', 'School Code', 'text', 'e.g. 12345')}
          </div>
        </div>
      )}

      {tab==='bank' && (
        <div style={S.formCard}>
          <p style={S.cardTitle}>Bank Account Details</p>
          <p style={{ margin:'0 0 16px', fontSize:'13px', color:'#f59e0b', background:'#fffbeb', padding:'10px 14px', borderRadius:'8px', border:'1px solid #fde68a' }}>
            ⚠️ These details appear on fee payment receipts. Keep them accurate.
          </p>
          <div style={S.grid}>
            {F('account_holder', 'Account Holder Name', 'text', 'e.g. Sunrise Public School')}
            {F('bank_name', 'Bank Name', 'text', 'e.g. State Bank of India')}
            {F('account_no', 'Account Number', 'text', 'e.g. 1234567890')}
            {F('ifsc_code', 'IFSC Code', 'text', 'e.g. SBIN0001234')}
            {F('branch_name', 'Branch Name', 'text', 'e.g. Civil Lines, Ludhiana')}
          </div>

          {/* Bank preview */}
          {settings?.bank_name && (
            <div style={{ marginTop:'20px', background:'#f0fdf4', border:'1px solid #86efac', borderRadius:'10px', padding:'16px' }}>
              <p style={{ margin:'0 0 10px', fontSize:'12px', fontWeight:'700', color:'#16a34a', textTransform:'uppercase' }}>Bank Details Preview (on receipts)</p>
              {[['Account Holder', settings.account_holder],['Bank', settings.bank_name],['Account No', settings.account_no],['IFSC', settings.ifsc_code],['Branch', settings.branch_name]].map(([k,v])=> v ? (
                <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:'1px solid #dcfce7' }}>
                  <span style={{ fontSize:'13px', color:'#64748b' }}>{k}</span>
                  <span style={{ fontSize:'13px', fontWeight:'600', color:'#1e293b' }}>{v}</span>
                </div>
              ) : null)}
            </div>
          )}
        </div>
      )}

      {tab==='services' && (
        <div style={S.formCard}>
          <p style={S.cardTitle}>School Services & Facilities</p>
          <p style={{ margin:'0 0 16px', fontSize:'13px', color:'#64748b' }}>Select all services your school offers</p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'10px', marginBottom:'20px' }}>
            {DEFAULT_SERVICES.map(svc=>(
              <div key={svc} onClick={()=>toggleService(svc)} style={{
                padding:'8px 16px', borderRadius:'20px', cursor:'pointer', fontSize:'14px', fontWeight:'600',
                background: services.includes(svc) ? '#6366f1' : '#f1f5f9',
                color: services.includes(svc) ? '#fff' : '#374151',
                border: `1px solid ${services.includes(svc) ? '#6366f1' : '#e2e8f0'}`,
                transition:'all 0.15s'
              }}>
                {services.includes(svc) ? '✅ ' : ''}{svc}
              </div>
            ))}
          </div>

          {/* Custom service */}
          <div style={{ display:'flex', gap:'10px', marginBottom:'16px' }}>
            <input style={{...S.input, flex:1}} placeholder="Add custom service..." value={customSvc} onChange={e=>setCustomSvc(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&addCustomService()} />
            <button style={S.btnPrimary} onClick={addCustomService}>+ Add</button>
          </div>

          {/* Custom services chips */}
          {services.filter(s=>!DEFAULT_SERVICES.includes(s)).length > 0 && (
            <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
              {services.filter(s=>!DEFAULT_SERVICES.includes(s)).map(svc=>(
                <div key={svc} style={{ padding:'6px 14px', borderRadius:'20px', background:'#eef2ff', color:'#6366f1', fontSize:'13px', fontWeight:'600', display:'flex', alignItems:'center', gap:'6px' }}>
                  {svc}
                  <span style={{ cursor:'pointer', fontSize:'16px' }} onClick={()=>toggleService(svc)}>×</span>
                </div>
              ))}
            </div>
          )}

          {services.length > 0 && (
            <div style={{ marginTop:'20px', background:'#f8fafc', borderRadius:'10px', padding:'16px' }}>
              <p style={{ margin:'0 0 10px', fontSize:'12px', fontWeight:'700', color:'#94a3b8', textTransform:'uppercase' }}>Selected Services ({services.length})</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                {services.map(s=>(
                  <span key={s} style={{ background:'#6366f1', color:'#fff', padding:'3px 10px', borderRadius:'12px', fontSize:'12px', fontWeight:'600' }}>{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const S = {
  page:      { maxWidth:'860px', margin:'0 auto' },
  title:     { margin:0, fontSize:'22px', fontWeight:'800', color:'#1e293b' },
  sub:       { margin:'4px 0 0', color:'#64748b', fontSize:'14px' },
  tabs:      { display:'flex', gap:'8px', marginBottom:'20px', flexWrap:'wrap' },
  tab:       { padding:'8px 20px', borderRadius:'8px', border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer', fontSize:'14px', fontWeight:'600', color:'#64748b' },
  tabActive: { background:'#4f46e5', color:'#fff', border:'1px solid #4f46e5' },
  formCard:  { background:'#fff', borderRadius:'12px', padding:'24px', boxShadow:'0 1px 4px rgba(0,0,0,0.07)' },
  cardTitle: { margin:'0 0 16px', fontSize:'13px', fontWeight:'800', color:'#374151', textTransform:'uppercase', letterSpacing:'0.5px' },
  grid:      { display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'14px' },
  label:     { display:'block', fontSize:'12px', fontWeight:'700', color:'#6b7280', marginBottom:'5px', textTransform:'uppercase' },
  input:     { width:'100%', padding:'9px 12px', borderRadius:'8px', border:'1px solid #e2e8f0', fontSize:'14px', outline:'none', boxSizing:'border-box', background:'#fff' },
  btnPrimary:{ padding:'10px 22px', background:'#4f46e5', color:'#fff', border:'none', borderRadius:'8px', fontSize:'14px', fontWeight:'700', cursor:'pointer' },
  empty:     { textAlign:'center', padding:'60px', color:'#94a3b8' },
}
