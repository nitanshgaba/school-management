
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const TABS = ['Schedule Exam', 'View Exams']

export default function Exams() {
  const [activeTab, setActiveTab] = useState('Schedule Exam')
  
  return (
    <div style={styles.container}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Examination Management</h1>
          <p style={styles.pageSubtitle}>Schedule, manage, and view upcoming exams</p>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.tabContainer}>
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                ...styles.tab,
                backgroundColor: activeTab === tab ? '#fff' : 'transparent',
                color: activeTab === tab ? '#111827' : '#6b7280',
                boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                fontWeight: activeTab === tab ? '600' : '500',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'Schedule Exam' && <ScheduleExam onCreated={() => setActiveTab('View Exams')} />}
        {activeTab === 'View Exams' && <ViewExams />}
      </div>
    </div>
  )
}

// ─── SCHEDULE EXAM ─────────────────────────────────────────
function ScheduleExam({ onCreated }) {
  const [classes, setClasses] = useState([])
  const [sections, setSections] = useState([])
  const [subjects, setSubjects] = useState([])
  const [form, setForm] = useState({ class_id: '', section_id: '', subject_id: '', exam_name: '', session: '', exam_date: '', max_marks: '' })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    supabase.from('classes').select('*').then(({ data }) => setClasses(data || []))
  }, [])

  const handleClassChange = async (classId) => {
    setForm({ ...form, class_id: classId, section_id: '', subject_id: '' })
    
    if (!classId) {
      setSections([])
      setSubjects([])
      return
    }

    const { data: sec } = await supabase.from('sections').select('*').eq('class_id', classId)
    setSections(sec || [])
    const { data: sub } = await supabase.from('subjects').select('*').eq('class_id', classId)
    setSubjects(sub || [])
  }

  const handleSubmit = async () => {
    if (!form.exam_name || !form.class_id || !form.exam_date || !form.max_marks) {
      setMessage('❌ Please fill all required fields.')
      return
    }
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('exams').insert({
      exam_name: form.exam_name,
      session: form.session,
      class_id: parseInt(form.class_id),
      section_id: form.section_id ? parseInt(form.section_id) : null,
      subject_id: form.subject_id ? parseInt(form.subject_id) : null,
      exam_date: form.exam_date,
      max_marks: parseInt(form.max_marks),
      created_by: user.id,
    })
    
    if (error) { 
      setMessage('❌ Error: ' + error.message)
      setLoading(false)
      return 
    }
    
    setMessage('✅ Exam scheduled successfully!')
    setForm({ class_id: '', section_id: '', subject_id: '', exam_name: '', session: '', exam_date: '', max_marks: '' })
    setSections([])
    setSubjects([])
    setTimeout(() => onCreated(), 1500)
    setLoading(false)
  }

  return (
    <div style={styles.fadeIn}>
      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>📝 Schedule New Exam</h2>
      </div>
      
      <div style={styles.form}>
        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Exam Name <span style={{color: '#ef4444'}}>*</span></label>
            <input style={styles.input} placeholder="e.g. Mid Term Examination" value={form.exam_name} onChange={e => setForm({ ...form, exam_name: e.target.value })} />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Academic Session</label>
            <input style={styles.input} placeholder="e.g. 2025-26" value={form.session} onChange={e => setForm({ ...form, session: e.target.value })} />
          </div>
        </div>

        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Class <span style={{color: '#ef4444'}}>*</span></label>
            <select style={styles.input} value={form.class_id} onChange={e => handleClassChange(e.target.value)}>
              <option value="">-- Select Class --</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Section (Optional)</label>
            <select style={styles.input} value={form.section_id} onChange={e => setForm({ ...form, section_id: e.target.value })}>
              <option value="">-- All Sections --</option>
              {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Subject (Optional)</label>
            <select style={styles.input} value={form.subject_id} onChange={e => setForm({ ...form, subject_id: e.target.value })}>
              <option value="">-- General / All Subjects --</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Max Marks <span style={{color: '#ef4444'}}>*</span></label>
            <input style={styles.input} type="number" placeholder="e.g. 100" value={form.max_marks} onChange={e => setForm({ ...form, max_marks: e.target.value })} />
          </div>
        </div>

        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Exam Date <span style={{color: '#ef4444'}}>*</span></label>
            <input style={styles.input} type="date" value={form.exam_date} onChange={e => setForm({ ...form, exam_date: e.target.value })} />
          </div>
        </div>

        {message && (
          <div style={{ ...styles.alertBox, backgroundColor: message.startsWith('✅') ? '#f0fdf4' : '#fef2f2', border: message.startsWith('✅') ? '1px solid #bbf7d0' : '1px solid #fecaca', color: message.startsWith('✅') ? '#15803d' : '#991b1b', marginTop: '8px' }}>
            {message}
          </div>
        )}

        <div style={styles.formButtons}>
          <button style={styles.submitBtn} onClick={handleSubmit} disabled={loading}>
            {loading ? '⏳ Scheduling...' : '📅 Schedule Exam'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── VIEW EXAMS ────────────────────────────────────────────
function ViewExams() {
  const [exams, setExams] = useState([])
  const [classes, setClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [loading, setLoading] = useState(true)
  const [editExam, setEditExam] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchExams()
    supabase.from('classes').select('*').then(({ data }) => setClasses(data || []))
  }, [])

  const fetchExams = async (classId) => {
    setLoading(true)
    let query = supabase.from('exams').select('*, classes(name), sections(name), subjects(name)').order('exam_date', { ascending: false })
    if (classId) query = query.eq('class_id', classId)
    const { data } = await query
    setExams(data || [])
    setLoading(false)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this exam?')) return
    await supabase.from('exams').delete().eq('id', id)
    setExams(exams.filter(e => e.id !== id))
  }

  const handleEdit = async () => {
    setSaving(true)
    await supabase.from('exams').update({
      exam_name: editExam.exam_name,
      session: editExam.session,
      exam_date: editExam.exam_date,
      max_marks: editExam.max_marks,
    }).eq('id', editExam.id)
    
    setExams(exams.map(e => e.id === editExam.id ? { ...e, ...editExam } : e))
    setEditExam(null)
    setSaving(false)
  }

  return (
    <div style={styles.fadeIn}>
      {editExam && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.formTitle}>Edit Exam Details</h3>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Exam Name</label>
              <input style={styles.input} value={editExam.exam_name} onChange={e => setEditExam({ ...editExam, exam_name: e.target.value })} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Academic Session</label>
              <input style={styles.input} value={editExam.session || ''} onChange={e => setEditExam({ ...editExam, session: e.target.value })} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Exam Date</label>
                <input style={styles.input} type="date" value={editExam.exam_date} onChange={e => setEditExam({ ...editExam, exam_date: e.target.value })} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Max Marks</label>
                <input style={styles.input} type="number" value={editExam.max_marks} onChange={e => setEditExam({ ...editExam, max_marks: e.target.value })} />
              </div>
            </div>
            <div style={styles.modalButtons}>
              <button style={styles.cancelBtn} onClick={() => setEditExam(null)}>Cancel</button>
              <button style={styles.submitBtn} onClick={handleEdit} disabled={saving}>{saving ? '⏳ Saving...' : '💾 Save Changes'}</button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.filterBox}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1', minWidth: '200px' }}>
            <label style={styles.label}>Filter by Class</label>
            <select style={styles.input} value={selectedClass} onChange={e => { setSelectedClass(e.target.value); fetchExams(e.target.value) }}>
              <option value="">-- All Classes --</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>⏳ Loading exams...</div>
      ) : exams.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyStateIcon}>📝</div>
          <h3 style={{ color: '#374151', margin: '0 0 8px 0' }}>No exams found</h3>
          <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>There are no exams scheduled for this selection.</p>
        </div>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, width: '25%' }}>Exam Info</th>
                <th style={styles.th}>Class / Section</th>
                <th style={styles.th}>Subject</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Max Marks</th>
                <th style={{ ...styles.th, textAlign: 'right', paddingRight: '24px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {exams.map(e => (
                <tr key={e.id} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={{ fontWeight: '600', color: '#1e293b' }}>{e.exam_name}</div>
                    {e.session && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Session: {e.session}</div>}
                  </td>
                  <td style={{ ...styles.td, color: '#475569', fontWeight: '500' }}>
                    <span style={{ backgroundColor: '#f1f5f9', padding: '4px 10px', borderRadius: '6px', fontSize: '13px', border: '1px solid #e2e8f0' }}>
                      Class {e.classes?.name} {e.sections?.name && ` - Sec ${e.sections.name}`}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {e.subjects?.name ? (
                       <span style={{ fontWeight: '500', color: '#334155' }}>{e.subjects.name}</span>
                    ) : (
                       <span style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '13px' }}>General</span>
                    )}
                  </td>
                  <td style={{ ...styles.td, color: '#334155' }}>
                    🗓️ {new Date(e.exam_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={styles.td}>
                    <span style={{ backgroundColor: '#eff6ff', color: '#2563eb', padding: '4px 10px', borderRadius: '20px', fontSize: '13px', fontWeight: '700' }}>
                      {e.max_marks}
                    </span>
                  </td>
                  <td style={{ ...styles.td, textAlign: 'right', paddingRight: '20px' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button style={styles.editBtnLight} onClick={() => setEditExam(e)}>✏️ Edit</button>
                      <button style={styles.deleteBtnLight} onClick={() => handleDelete(e.id)}>🗑️ Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── STYLES ────────────────────────────────────────────────
const styles = {
  container: { maxWidth: '1100px', margin: '0 auto', padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' },
  pageHeader: { marginBottom: '32px' },
  pageTitle: { fontSize: '32px', fontWeight: '800', color: '#111827', margin: '0 0 8px 0', letterSpacing: '-0.5px' },
  pageSubtitle: { fontSize: '15px', color: '#6b7280', margin: 0 },
  
  card: { backgroundColor: '#fff', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', border: '1px solid #f3f4f6' },
  
  tabContainer: { display: 'inline-flex', background: '#f1f5f9', padding: '4px', borderRadius: '12px', marginBottom: '32px' },
  tab: { padding: '10px 24px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s ease' },
  
  fadeIn: { opacity: 1, transition: 'opacity 0.3s ease-in' },
  sectionHeader: { marginBottom: '24px' },
  sectionTitle: { fontSize: '18px', fontWeight: '700', color: '#1f2937', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' },
  
  form: { maxWidth: '700px', display: 'flex', flexDirection: 'column', gap: '20px' },
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', backgroundColor: '#fff', color: '#1e293b', transition: 'border-color 0.2s', width: '100%' },
  
  formButtons: { display: 'flex', justifyContent: 'flex-start', marginTop: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '24px' },
  submitBtn: { padding: '12px 32px', borderRadius: '8px', border: 'none', backgroundColor: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600', transition: 'background-color 0.2s', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.3)' },
  cancelBtn: { padding: '12px 24px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontSize: '14px', color: '#475569', fontWeight: '600', transition: 'background-color 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
  
  filterBox: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '24px' },
  
  alertBox: { padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center' },
  
  tableWrapper: { borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff' },
  th: { textAlign: 'left', fontSize: '12px', color: '#64748b', fontWeight: '700', padding: '16px 20px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textTransform: 'uppercase', letterSpacing: '0.5px' },
  tr: { borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s ease' },
  td: { padding: '16px 20px', fontSize: '14px', color: '#1e293b', verticalAlign: 'middle' },
  
  editBtnLight: { padding: '6px 12px', backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all 0.2s' },
  deleteBtnLight: { padding: '6px 12px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all 0.2s' },
  
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, backdropFilter: 'blur(4px)' },
  modal: { backgroundColor: '#fff', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  formTitle: { fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: 0 },
  modalButtons: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '20px' },
  
  emptyState: { textAlign: 'center', padding: '60px 20px', border: '2px dashed #e2e8f0', borderRadius: '12px', backgroundColor: '#fafaf9', marginTop: '16px' },
  emptyStateIcon: { fontSize: '56px', marginBottom: '16px', opacity: 0.8 },
}