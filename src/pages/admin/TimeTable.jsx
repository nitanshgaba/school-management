import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function TimeTable() {
  const [classes, setClasses] = useState([])
  const [sections, setSections] = useState([])
  const [subjects, setSubjects] = useState([])
  const [periods, setPeriods] = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSection, setSelectedSection] = useState('')
  const [selectedClassName, setSelectedClassName] = useState('')
  const [selectedSectionName, setSelectedSectionName] = useState('')
  const [currentDayIndex, setCurrentDayIndex] = useState(0)
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editPeriod, setEditPeriod] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    period_start: '', period_end: '', subject_id: '', is_lunch: false
  })

  useEffect(() => {
    supabase.from('classes').select('*').order('id').then(({ data }) => setClasses(data || []))
  }, [])

  const handleClassChange = async (classId) => {
    setSelectedClass(classId)
    setSelectedClassName(classes.find(c => c.id == classId)?.name || '')
    setSelectedSection('')
    setSelectedSectionName('')
    setSearched(false)
    const { data } = await supabase.from('sections').select('*').eq('class_id', classId)
    setSections(data || [])
    // Load subjects for this class
    const { data: subs } = await supabase.from('subjects').select('*').eq('class_id', classId)
    setSubjects(subs || [])
  }

  const handleFind = async () => {
    if (!selectedClass) return
    setLoading(true)
    setSearched(true)
    await fetchPeriods()
    setLoading(false)
  }

  const fetchPeriods = async () => {
    let query = supabase
      .from('timetable')
      .select('*, subjects(name)')
      .eq('class_id', selectedClass)
      .order('period_start')
    if (selectedSection) query = query.eq('section_id', selectedSection)
    const { data } = await query
    setPeriods(data || [])
  }

  const currentDay = DAYS[currentDayIndex]
  const dayPeriods = periods.filter(p => p.day === currentDay)

  const handleAdd = async () => {
    if (!form.period_start || !form.period_end) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('timetable').insert({
      class_id: parseInt(selectedClass),
      section_id: selectedSection ? parseInt(selectedSection) : null,
      day: currentDay,
      period_start: form.period_start,
      period_end: form.period_end,
      subject_id: form.subject_id ? parseInt(form.subject_id) : null,
      is_lunch: form.is_lunch,
      created_by: user.id,
    })
    if (!error) {
      await fetchPeriods()
      setShowModal(false)
      setForm({ period_start: '', period_end: '', subject_id: '', is_lunch: false })
    }
    setSaving(false)
  }

  const handleEditSave = async () => {
    setSaving(true)
    const { error } = await supabase.from('timetable').update({
      period_start: editPeriod.period_start,
      period_end: editPeriod.period_end,
      subject_id: editPeriod.subject_id ? parseInt(editPeriod.subject_id) : null,
      is_lunch: editPeriod.is_lunch,
    }).eq('id', editPeriod.id)
    if (!error) {
      await fetchPeriods()
      setEditPeriod(null)
    }
    setSaving(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this period?')) return
    await supabase.from('timetable').delete().eq('id', id)
    setPeriods(periods.filter(p => p.id !== id))
  }

  return (
    <div>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Time Table</h1>
      </div>

      <div style={styles.card}>
        {/* Add Period Modal */}
        {showModal && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <h3 style={styles.formTitle}>Add Period — {currentDay}</h3>
              <div style={styles.formGroup}>
                <label style={styles.label}>Period Start</label>
                <input style={styles.input} type="time" value={form.period_start}
                  onChange={e => setForm({ ...form, period_start: e.target.value })} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Period End</label>
                <input style={styles.input} type="time" value={form.period_end}
                  onChange={e => setForm({ ...form, period_end: e.target.value })} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Subject</label>
                <select style={styles.input} value={form.subject_id}
                  onChange={e => setForm({ ...form, subject_id: e.target.value })}>
                  <option value="">-- Select Subject --</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div style={styles.checkRow}>
                <input type="checkbox" id="isLunch" checked={form.is_lunch}
                  onChange={e => setForm({ ...form, is_lunch: e.target.checked })} />
                <label htmlFor="isLunch" style={styles.label}>Is Lunch Break?</label>
              </div>
              <div style={styles.formButtons}>
                <button style={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
                <button style={styles.submitBtn} onClick={handleAdd} disabled={saving}>
                  {saving ? 'Adding...' : 'Add Period'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Period Modal */}
        {editPeriod && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <h3 style={styles.formTitle}>Edit Period</h3>
              <div style={styles.formGroup}>
                <label style={styles.label}>Period Start</label>
                <input style={styles.input} type="time" value={editPeriod.period_start}
                  onChange={e => setEditPeriod({ ...editPeriod, period_start: e.target.value })} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Period End</label>
                <input style={styles.input} type="time" value={editPeriod.period_end}
                  onChange={e => setEditPeriod({ ...editPeriod, period_end: e.target.value })} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Subject</label>
                <select style={styles.input} value={editPeriod.subject_id || ''}
                  onChange={e => setEditPeriod({ ...editPeriod, subject_id: e.target.value })}>
                  <option value="">-- Select Subject --</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div style={styles.checkRow}>
                <input type="checkbox" id="editLunch" checked={editPeriod.is_lunch}
                  onChange={e => setEditPeriod({ ...editPeriod, is_lunch: e.target.checked })} />
                <label htmlFor="editLunch" style={styles.label}>Is Lunch Break?</label>
              </div>
              <div style={styles.formButtons}>
                <button style={styles.cancelBtn} onClick={() => setEditPeriod(null)}>Cancel</button>
                <button style={styles.submitBtn} onClick={handleEditSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filter */}
        <div style={styles.filterBox}>
          <h2 style={styles.sectionTitle}>🗓️ Time Table</h2>
          <div style={styles.filterRow}>
            <div style={styles.filterGroup}>
              <label style={styles.label}>Class</label>
              <select style={styles.input} value={selectedClass} onChange={e => handleClassChange(e.target.value)}>
                <option value="">-- Select Class --</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div style={styles.filterGroup}>
              <label style={styles.label}>Section</label>
              <select style={styles.input} value={selectedSection}
                onChange={e => { setSelectedSection(e.target.value); setSelectedSectionName(sections.find(s => s.id == e.target.value)?.name || '') }}>
                <option value="">-- Select Section --</option>
                {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <button style={styles.findBtn} onClick={handleFind}>🔍 Find</button>
          </div>
        </div>

        {!searched ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: '64px' }}>🗓️</div>
            <p style={{ color: '#9ca3af', marginTop: '12px' }}>Select class and section to view timetable</p>
          </div>
        ) : (
          <>
            {/* Class Title + Add Button */}
            <div style={styles.ttHeader}>
              <h3 style={styles.ttTitle}>
                Class {selectedClassName} {selectedSectionName}
              </h3>
              <button style={styles.addBtn} onClick={() => setShowModal(true)}>＋ Add Period</button>
            </div>

            {/* Day Navigator */}
            <div style={styles.dayNav}>
              <button
                style={styles.dayNavBtn}
                onClick={() => setCurrentDayIndex(i => Math.max(0, i - 1))}
                disabled={currentDayIndex === 0}
              >
                ← prev
              </button>
              <div style={styles.dayLabel}>{currentDay}</div>
              <button
                style={styles.dayNavBtn}
                onClick={() => setCurrentDayIndex(i => Math.min(DAYS.length - 1, i + 1))}
                disabled={currentDayIndex === DAYS.length - 1}
              >
                next →
              </button>
            </div>

            {/* Periods Table */}
            {loading ? (
              <p style={{ color: '#9ca3af', padding: '20px' }}>Loading...</p>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Period Start</th>
                    <th style={styles.th}>Period End</th>
                    <th style={styles.th}>Subject</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {dayPeriods.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={styles.emptyCell}>
                        No periods for {currentDay}. Click "+ Add Period" to add one.
                      </td>
                    </tr>
                  ) : (
                    dayPeriods.map(p => (
                      p.is_lunch ? (
                        <tr key={p.id}>
                          <td colSpan={4} style={styles.lunchRow}>
                            🍱 L &nbsp; U &nbsp; N &nbsp; C &nbsp; H &nbsp;&nbsp; ({p.period_start} - {p.period_end})
                            <button style={{ ...styles.iconBtn, marginLeft: '16px', color: '#ef4444' }}
                              onClick={() => handleDelete(p.id)}>🗑</button>
                          </td>
                        </tr>
                      ) : (
                        <tr key={p.id}>
                          <td style={styles.td}>{p.period_start}</td>
                          <td style={styles.td}>{p.period_end}</td>
                          <td style={styles.td}>{p.subjects?.name || '—'}</td>
                          <td style={styles.td}>
                            <div style={styles.actionBtns}>
                              <button style={styles.editBtn} onClick={() => setEditPeriod(p)}>✏️ Edit</button>
                              <button style={styles.deleteBtn} onClick={() => handleDelete(p.id)}>🗑 Delete</button>
                            </div>
                          </td>
                        </tr>
                      )
                    ))
                  )}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
    </div>
  )
}

const styles = {
  pageHeader: { marginBottom: '24px' },
  pageTitle: { fontSize: '28px', fontWeight: '700', color: '#1a1a2e', margin: 0 },
  card: { backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  sectionTitle: { fontSize: '16px', fontWeight: '700', color: '#1a1a2e', marginBottom: '16px' },
  filterBox: { backgroundColor: '#f9fafb', borderRadius: '10px', padding: '16px', marginBottom: '24px' },
  filterRow: { display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '160px' },
  findBtn: { padding: '10px 20px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', height: '40px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#374151' },
  input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none' },
  ttHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  ttTitle: { fontSize: '18px', fontWeight: '700', color: '#1a1a2e' },
  addBtn: { padding: '8px 16px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  dayNav: { display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: '10px', marginBottom: '16px', overflow: 'hidden' },
  dayNavBtn: { padding: '12px 20px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#374151', fontWeight: '500', textAlign: 'center' },
  dayLabel: { padding: '12px 32px', backgroundColor: '#4f46e5', color: '#fff', fontWeight: '700', fontSize: '15px', textAlign: 'center' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', fontSize: '13px', color: '#6b7280', fontWeight: '600', padding: '10px 12px', borderBottom: '2px solid #f3f4f6' },
  td: { padding: '12px', fontSize: '14px', color: '#374151', borderBottom: '1px solid #f9fafb' },
  emptyCell: { padding: '32px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' },
  lunchRow: { padding: '12px', textAlign: 'center', backgroundColor: '#f0fdf4', color: '#16a34a', fontWeight: '700', fontSize: '14px', letterSpacing: '2px' },
  actionBtns: { display: 'flex', gap: '8px' },
  editBtn: { padding: '6px 12px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
  deleteBtn: { padding: '6px 12px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal: { backgroundColor: '#fff', borderRadius: '12px', padding: '28px', width: '420px', display: 'flex', flexDirection: 'column', gap: '16px' },
  formTitle: { fontSize: '18px', fontWeight: '700', color: '#1a1a2e' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  checkRow: { display: 'flex', alignItems: 'center', gap: '8px' },
  formButtons: { display: 'flex', gap: '12px', marginTop: '4px' },
  cancelBtn: { padding: '10px 20px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '14px' },
  submitBtn: { padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#4f46e5', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  emptyState: { textAlign: 'center', padding: '60px 0' },
}