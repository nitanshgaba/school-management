import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const TABS = ['Schedule Exam', 'View Exams']

export default function Exams() {
  const [activeTab, setActiveTab] = useState('Schedule Exam')
  return (
    <div>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Exams</h1>
      </div>
      <div style={styles.card}>
        <div style={styles.tabs}>
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              ...styles.tab,
              borderBottom: activeTab === tab ? '2px solid #22c55e' : '2px solid transparent',
              color: activeTab === tab ? '#22c55e' : '#6b7280',
              fontWeight: activeTab === tab ? '600' : '400',
            }}>{tab}</button>
          ))}
        </div>
        {activeTab === 'Schedule Exam' && <ScheduleExam onCreated={() => setActiveTab('View Exams')} />}
        {activeTab === 'View Exams' && <ViewExams />}
      </div>
    </div>
  )
}

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
    const { data: sec } = await supabase.from('sections').select('*').eq('class_id', classId)
    setSections(sec || [])
    const { data: sub } = await supabase.from('subjects').select('*').eq('class_id', classId)
    setSubjects(sub || [])
  }

  const handleSubmit = async () => {
    if (!form.exam_name || !form.class_id || !form.exam_date || !form.max_marks) {
      setMessage('Please fill all required fields.')
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
    if (error) { setMessage('❌ Error: ' + error.message); setLoading(false); return }
    setMessage('✅ Exam scheduled successfully!')
    setForm({ class_id: '', section_id: '', subject_id: '', exam_name: '', session: '', exam_date: '', max_marks: '' })
    setSections([]); setSubjects([])
    setTimeout(() => onCreated(), 1000)
    setLoading(false)
  }

  return (
    <div>
      <div style={styles.sectionHeader}><h2 style={styles.sectionTitle}>📝 Schedule New Exam</h2></div>
      <div style={styles.form}>
        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Exam Name *</label>
            <input style={styles.input} placeholder="e.g. Mid Term Exam" value={form.exam_name} onChange={e => setForm({ ...form, exam_name: e.target.value })} />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Session</label>
            <input style={styles.input} placeholder="e.g. 2025-26" value={form.session} onChange={e => setForm({ ...form, session: e.target.value })} />
          </div>
        </div>
        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Class *</label>
            <select style={styles.input} value={form.class_id} onChange={e => handleClassChange(e.target.value)}>
              <option value="">-- Select Class --</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Section</label>
            <select style={styles.input} value={form.section_id} onChange={e => setForm({ ...form, section_id: e.target.value })}>
              <option value="">-- All Sections --</option>
              {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Subject</label>
            <select style={styles.input} value={form.subject_id} onChange={e => setForm({ ...form, subject_id: e.target.value })}>
              <option value="">-- All Subjects --</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Max Marks *</label>
            <input style={styles.input} type="number" placeholder="e.g. 100" value={form.max_marks} onChange={e => setForm({ ...form, max_marks: e.target.value })} />
          </div>
        </div>
        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Exam Date *</label>
            <input style={styles.input} type="date" value={form.exam_date} onChange={e => setForm({ ...form, exam_date: e.target.value })} />
          </div>
        </div>
        {message && <p style={{ color: message.startsWith('✅') ? '#22c55e' : '#ef4444', fontSize: '14px' }}>{message}</p>}
        <div style={styles.formButtons}>
          <button style={styles.submitBtn} onClick={handleSubmit} disabled={loading}>{loading ? 'Scheduling...' : '📅 Schedule Exam'}</button>
        </div>
      </div>
    </div>
  )
}

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
    if (!confirm('Delete this exam?')) return
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
    <div>
      {editExam && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.formTitle}>Edit Exam</h3>
            <div style={styles.formGroup}>
              <label style={styles.label}>Exam Name</label>
              <input style={styles.input} value={editExam.exam_name} onChange={e => setEditExam({ ...editExam, exam_name: e.target.value })} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Session</label>
              <input style={styles.input} value={editExam.session || ''} onChange={e => setEditExam({ ...editExam, session: e.target.value })} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Exam Date</label>
              <input style={styles.input} type="date" value={editExam.exam_date} onChange={e => setEditExam({ ...editExam, exam_date: e.target.value })} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Max Marks</label>
              <input style={styles.input} type="number" value={editExam.max_marks} onChange={e => setEditExam({ ...editExam, max_marks: e.target.value })} />
            </div>
            <div style={styles.formButtons}>
              <button style={styles.cancelBtn} onClick={() => setEditExam(null)}>Cancel</button>
              <button style={styles.submitBtn} onClick={handleEdit} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
      <div style={styles.filterRow}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Filter by Class</label>
          <select style={styles.input} value={selectedClass} onChange={e => { setSelectedClass(e.target.value); fetchExams(e.target.value) }}>
            <option value="">All Classes</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>
      {loading ? <p style={{ color: '#9ca3af' }}>Loading...</p> :
        exams.length === 0 ? (
          <div style={styles.emptyState}><div style={{ fontSize: '64px' }}>📝</div><p style={{ color: '#9ca3af' }}>No exams scheduled yet</p></div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Exam</th>
                <th style={styles.th}>Class</th>
                <th style={styles.th}>Subject</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Max Marks</th>
                <th style={styles.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {exams.map(e => (
                <tr key={e.id}>
                  <td style={styles.td}><strong>{e.exam_name}</strong>{e.session && <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: '6px' }}>{e.session}</span>}</td>
                  <td style={styles.td}>{e.classes?.name} {e.sections?.name && `- ${e.sections.name}`}</td>
                  <td style={styles.td}>{e.subjects?.name || '—'}</td>
                  <td style={styles.td}>{new Date(e.exam_date).toLocaleDateString('en-IN')}</td>
                  <td style={styles.td}>{e.max_marks}</td>
                  <td style={styles.td}>
                    <div style={styles.actionBtns}>
                      <button style={styles.editBtn} onClick={() => setEditExam(e)}>✏️ Edit</button>
                      <button style={styles.deleteBtn} onClick={() => handleDelete(e.id)}>🗑 Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      }
    </div>
  )
}

const styles = {
  pageHeader: { marginBottom: '24px' },
  pageTitle: { fontSize: '28px', fontWeight: '700', color: '#1a1a2e', margin: 0 },
  card: { backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  tabs: { display: 'flex', gap: '4px', borderBottom: '1px solid #e5e7eb', marginBottom: '24px' },
  tab: { padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' },
  sectionHeader: { marginBottom: '20px' },
  sectionTitle: { fontSize: '16px', fontWeight: '700', color: '#1a1a2e' },
  form: { maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '16px' },
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#374151' },
  input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none' },
  formButtons: { display: 'flex', gap: '12px', marginTop: '8px' },
  cancelBtn: { padding: '10px 20px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '14px' },
  submitBtn: { padding: '10px 24px', borderRadius: '8px', border: 'none', backgroundColor: '#4f46e5', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  filterRow: { display: 'flex', gap: '16px', marginBottom: '20px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', fontSize: '13px', color: '#6b7280', fontWeight: '600', padding: '10px 12px', borderBottom: '2px solid #f3f4f6' },
  td: { padding: '12px', fontSize: '14px', color: '#374151', borderBottom: '1px solid #f9fafb' },
  actionBtns: { display: 'flex', gap: '8px' },
  editBtn: { padding: '6px 12px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
  deleteBtn: { padding: '6px 12px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
  emptyState: { textAlign: 'center', padding: '60px 0' },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal: { backgroundColor: '#fff', borderRadius: '12px', padding: '28px', width: '420px', display: 'flex', flexDirection: 'column', gap: '16px' },
  formTitle: { fontSize: '18px', fontWeight: '700', color: '#1a1a2e' },
}
