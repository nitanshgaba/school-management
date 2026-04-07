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
    period_start: '', period_end: '', subject_id: '', is_lunch: false, is_holiday: false
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
    
    if (!classId) {
      setSections([])
      setSubjects([])
      return
    }

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
      subject_id: (!form.is_lunch && !form.is_holiday && form.subject_id) ? parseInt(form.subject_id) : null,
      is_lunch: form.is_lunch,
      is_holiday: form.is_holiday || false,
      created_by: user.id,
    })
    if (!error) {
      await fetchPeriods()
      setShowModal(false)
      setForm({ period_start: '', period_end: '', subject_id: '', is_lunch: false, is_holiday: false })
    } else {
      console.error(error)
      alert("Error adding period. Make sure 'is_holiday' boolean column exists in your database.")
    }
    setSaving(false)
  }

  const handleEditSave = async () => {
    setSaving(true)
    const { error } = await supabase.from('timetable').update({
      period_start: editPeriod.period_start,
      period_end: editPeriod.period_end,
      subject_id: (!editPeriod.is_lunch && !editPeriod.is_holiday && editPeriod.subject_id) ? parseInt(editPeriod.subject_id) : null,
      is_lunch: editPeriod.is_lunch,
      is_holiday: editPeriod.is_holiday || false,
    }).eq('id', editPeriod.id)
    if (!error) {
      await fetchPeriods()
      setEditPeriod(null)
    } else {
      console.error(error)
    }
    setSaving(false)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this?')) return
    await supabase.from('timetable').delete().eq('id', id)
    setPeriods(periods.filter(p => p.id !== id))
  }

  // Dynamic lecture counter (skips lunch and holidays)
  let lectureCount = 0;

  return (
    <div style={styles.container}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Schedule Management</h1>
          <p style={styles.pageSubtitle}>Organize and view class timetables effectively</p>
        </div>
      </div>

      <div style={styles.card}>
        {/* Add Period Modal */}
        {showModal && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <div style={styles.modalHeader}>
                <h3 style={styles.formTitle}>Add to Schedule</h3>
                <span style={styles.modalBadge}>{currentDay}</span>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', opacity: form.is_holiday ? 0.5 : 1, pointerEvents: form.is_holiday ? 'none' : 'auto' }}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Start Time</label>
                  <input style={styles.input} type="time" value={form.period_start}
                    onChange={e => setForm({ ...form, period_start: e.target.value })} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>End Time</label>
                  <input style={styles.input} type="time" value={form.period_end}
                    onChange={e => setForm({ ...form, period_end: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ ...styles.checkRow, flex: 1, backgroundColor: form.is_lunch ? '#f0fdf4' : '#f8fafc', border: form.is_lunch ? '1px solid #bbf7d0' : '1px solid #e2e8f0' }}>
                  <input type="checkbox" id="isLunch" checked={form.is_lunch}
                    onChange={e => setForm({ ...form, is_lunch: e.target.checked, is_holiday: false, subject_id: e.target.checked ? '' : form.subject_id })} 
                    style={styles.checkbox} disabled={form.is_holiday}
                  />
                  <label htmlFor="isLunch" style={{ ...styles.label, margin: 0, cursor: 'pointer', color: form.is_lunch ? '#16a34a' : '#475569' }}>
                    Lunch Break
                  </label>
                </div>

                <div style={{ ...styles.checkRow, flex: 1, backgroundColor: form.is_holiday ? '#fef2f2' : '#f8fafc', border: form.is_holiday ? '1px solid #fecaca' : '1px solid #e2e8f0' }}>
                  <input type="checkbox" id="isHoliday" checked={form.is_holiday}
                    onChange={e => setForm({ 
                      ...form, 
                      is_holiday: e.target.checked, 
                      is_lunch: false,
                      subject_id: '',
                      period_start: e.target.checked ? '00:00' : form.period_start,
                      period_end: e.target.checked ? '23:59' : form.period_end
                    })} 
                    style={styles.checkbox} 
                  />
                  <label htmlFor="isHoliday" style={{ ...styles.label, margin: 0, cursor: 'pointer', color: form.is_holiday ? '#dc2626' : '#475569' }}>
                    Full Holiday
                  </label>
                </div>
              </div>

              <div style={{ ...styles.formGroup, opacity: (form.is_lunch || form.is_holiday) ? 0.5 : 1, pointerEvents: (form.is_lunch || form.is_holiday) ? 'none' : 'auto' }}>
                <label style={styles.label}>Assign Subject</label>
                <select style={styles.input} value={form.subject_id}
                  onChange={e => setForm({ ...form, subject_id: e.target.value })}
                  disabled={form.is_lunch || form.is_holiday}
                >
                  <option value="">-- Select Subject --</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              
              <div style={styles.formButtons}>
                <button style={styles.cancelBtn} onClick={() => { setShowModal(false); setForm({ period_start: '', period_end: '', subject_id: '', is_lunch: false, is_holiday: false }); }}>Cancel</button>
                <button style={styles.submitBtn} onClick={handleAdd} disabled={saving || !form.period_start || !form.period_end}>
                  {saving ? '⏳ Adding...' : '＋ Save Record'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Period Modal */}
        {editPeriod && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <div style={styles.modalHeader}>
                <h3 style={styles.formTitle}>Edit Record</h3>
                <span style={styles.modalBadge}>{editPeriod.day}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', opacity: editPeriod.is_holiday ? 0.5 : 1, pointerEvents: editPeriod.is_holiday ? 'none' : 'auto' }}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Start Time</label>
                  <input style={styles.input} type="time" value={editPeriod.period_start}
                    onChange={e => setEditPeriod({ ...editPeriod, period_start: e.target.value })} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>End Time</label>
                  <input style={styles.input} type="time" value={editPeriod.period_end}
                    onChange={e => setEditPeriod({ ...editPeriod, period_end: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ ...styles.checkRow, flex: 1, backgroundColor: editPeriod.is_lunch ? '#f0fdf4' : '#f8fafc', border: editPeriod.is_lunch ? '1px solid #bbf7d0' : '1px solid #e2e8f0' }}>
                  <input type="checkbox" id="editLunch" checked={editPeriod.is_lunch}
                    onChange={e => setEditPeriod({ ...editPeriod, is_lunch: e.target.checked, is_holiday: false, subject_id: e.target.checked ? '' : editPeriod.subject_id })} 
                    style={styles.checkbox} disabled={editPeriod.is_holiday}
                  />
                  <label htmlFor="editLunch" style={{ ...styles.label, margin: 0, cursor: 'pointer', color: editPeriod.is_lunch ? '#16a34a' : '#475569' }}>
                    Lunch Break
                  </label>
                </div>

                <div style={{ ...styles.checkRow, flex: 1, backgroundColor: editPeriod.is_holiday ? '#fef2f2' : '#f8fafc', border: editPeriod.is_holiday ? '1px solid #fecaca' : '1px solid #e2e8f0' }}>
                  <input type="checkbox" id="editHoliday" checked={editPeriod.is_holiday}
                    onChange={e => setEditPeriod({ 
                      ...editPeriod, 
                      is_holiday: e.target.checked, 
                      is_lunch: false,
                      subject_id: '',
                      period_start: e.target.checked ? '00:00' : editPeriod.period_start,
                      period_end: e.target.checked ? '23:59' : editPeriod.period_end
                    })} 
                    style={styles.checkbox} 
                  />
                  <label htmlFor="editHoliday" style={{ ...styles.label, margin: 0, cursor: 'pointer', color: editPeriod.is_holiday ? '#dc2626' : '#475569' }}>
                    Full Holiday
                  </label>
                </div>
              </div>

              <div style={{ ...styles.formGroup, opacity: (editPeriod.is_lunch || editPeriod.is_holiday) ? 0.5 : 1, pointerEvents: (editPeriod.is_lunch || editPeriod.is_holiday) ? 'none' : 'auto' }}>
                <label style={styles.label}>Assign Subject</label>
                <select style={styles.input} value={editPeriod.subject_id || ''}
                  onChange={e => setEditPeriod({ ...editPeriod, subject_id: e.target.value })}
                  disabled={editPeriod.is_lunch || editPeriod.is_holiday}
                >
                  <option value="">-- Select Subject --</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              
              <div style={styles.formButtons}>
                <button style={styles.cancelBtn} onClick={() => setEditPeriod(null)}>Cancel</button>
                <button style={styles.submitBtn} onClick={handleEditSave} disabled={saving || !editPeriod.period_start || !editPeriod.period_end}>
                  {saving ? '⏳ Saving...' : '💾 Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filter Box */}
        <div style={styles.cardHeader}>
          <h2 style={styles.sectionTitle}>🎯 Select Class to View</h2>
        </div>

        <div style={styles.filterBox}>
          <div style={styles.filterRow}>
            <div style={styles.filterGroup}>
              <label style={styles.label}>Class</label>
              <select style={styles.input} value={selectedClass} onChange={e => handleClassChange(e.target.value)}>
                <option value="">-- Select Class --</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div style={styles.filterGroup}>
              <label style={styles.label}>Section (Optional)</label>
              <select style={styles.input} value={selectedSection}
                onChange={e => { setSelectedSection(e.target.value); setSelectedSectionName(sections.find(s => s.id == e.target.value)?.name || '') }}>
                <option value="">-- All Sections --</option>
                {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <button style={styles.findBtn} onClick={handleFind}>
              <span style={{ marginRight: '6px' }}>🔍</span> Fetch Timetable
            </button>
          </div>
        </div>

        {!searched ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyStateIcon}>🗓️</div>
            <h3 style={{ color: '#374151', margin: '0 0 8px 0' }}>Ready to view schedules</h3>
            <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>Select a class from the dropdown above to load the timetable.</p>
          </div>
        ) : (
          <div style={styles.fadeIn}>
            {/* Header + Add Button */}
            <div style={styles.ttHeader}>
              <h3 style={styles.ttTitle}>
                📋 Class {selectedClassName} {selectedSectionName && `- Sec ${selectedSectionName}`}
              </h3>
              <button style={styles.addBtn} onClick={() => setShowModal(true)}>
                ＋ Add Period
              </button>
            </div>

            {/* Day Navigator */}
            <div style={styles.dayNav}>
              <button
                style={{ ...styles.dayNavBtn, opacity: currentDayIndex === 0 ? 0.3 : 1 }}
                onClick={() => setCurrentDayIndex(i => Math.max(0, i - 1))}
                disabled={currentDayIndex === 0}
              >
                ← Previous Day
              </button>
              <div style={styles.dayLabel}>
                <span style={{ fontSize: '18px', marginRight: '8px' }}>📅</span> {currentDay}
              </div>
              <button
                style={{ ...styles.dayNavBtn, opacity: currentDayIndex === DAYS.length - 1 ? 0.3 : 1 }}
                onClick={() => setCurrentDayIndex(i => Math.min(DAYS.length - 1, i + 1))}
                disabled={currentDayIndex === DAYS.length - 1}
              >
                Next Day →
              </button>
            </div>

            {/* Periods Table */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>⏳ Loading schedule...</div>
            ) : (
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Time Window</th>
                      <th style={styles.th}>Subject</th>
                      <th style={{ ...styles.th, textAlign: 'right', paddingRight: '24px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dayPeriods.length === 0 ? (
                      <tr>
                        <td colSpan={3} style={styles.emptyCell}>
                          <p style={{ margin: 0, color: '#64748b' }}>No periods scheduled for {currentDay}. Click "+ Add Period" above to create one.</p>
                        </td>
                      </tr>
                    ) : (
                      dayPeriods.map((p) => {
                        
                        // Handle Holiday Rendering
                        if (p.is_holiday) {
                          return (
                            <tr key={p.id}>
                              <td colSpan={3} style={{ padding: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', backgroundColor: '#fef2f2', borderBottom: '1px solid #fecaca' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <span style={{ fontSize: '24px' }}>🏝️</span>
                                    <div>
                                      <div style={{ fontWeight: '800', color: '#dc2626', letterSpacing: '1px' }}>FULL DAY HOLIDAY</div>
                                      <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '2px', fontWeight: '600' }}>
                                        No classes scheduled for today
                                      </div>
                                    </div>
                                  </div>
                                  <div style={{ display: 'flex', gap: '8px' }}>
                                    <button style={styles.editBtnLight} onClick={() => setEditPeriod(p)}>✏️ Edit</button>
                                    <button style={styles.deleteBtnLight} onClick={() => handleDelete(p.id)}>🗑️ Delete</button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )
                        }

                        // Handle Lunch Break Rendering
                        if (p.is_lunch) {
                          return (
                            <tr key={p.id}>
                              <td colSpan={3} style={{ padding: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', backgroundColor: '#f0fdf4', borderBottom: '1px solid #bbf7d0', borderTop: '1px solid #bbf7d0' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <span style={{ fontSize: '20px' }}>🍱</span>
                                    <div>
                                      <div style={{ fontWeight: '700', letterSpacing: '1px', color: '#15803d' }}>LUNCH BREAK</div>
                                      <div style={{ fontSize: '12px', color: '#16a34a', marginTop: '2px', fontWeight: '600' }}>
                                        {p.period_start} — {p.period_end}
                                      </div>
                                    </div>
                                  </div>
                                  <div style={{ display: 'flex', gap: '8px' }}>
                                    <button style={styles.editBtnLight} onClick={() => setEditPeriod(p)}>✏️ Edit</button>
                                    <button style={styles.deleteBtnLight} onClick={() => handleDelete(p.id)}>🗑️ Delete</button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )
                        }

                        // Handle Standard Lecture Rendering (Increment counter here)
                        lectureCount++;
                        return (
                          <tr key={p.id} style={styles.tr}>
                            <td style={{ ...styles.td, fontWeight: '600', color: '#334155' }}>
                              <span style={{ backgroundColor: '#f1f5f9', padding: '4px 10px', borderRadius: '6px', fontSize: '13px', border: '1px solid #e2e8f0' }}>
                                {p.period_start} — {p.period_end}
                              </span>
                            </td>
                            <td style={styles.td}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#e0e7ff', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700' }}>
                                  {lectureCount}
                                </div>
                                <span style={{ fontWeight: '600', color: '#1e293b' }}>{p.subjects?.name || <span style={{ color: '#9ca3af', fontStyle: 'italic', fontWeight: '400' }}>Unassigned</span>}</span>
                              </div>
                            </td>
                            <td style={{ ...styles.td, textAlign: 'right', paddingRight: '20px' }}>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button style={styles.editBtnLight} onClick={() => setEditPeriod(p)}>✏️ Edit</button>
                                <button style={styles.deleteBtnLight} onClick={() => handleDelete(p.id)}>🗑️ Delete</button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── STYLES ────────────────────────────────────────────────
const styles = {
  container: { maxWidth: '1000px', margin: '0 auto', padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' },
  pageHeader: { marginBottom: '32px' },
  pageTitle: { fontSize: '32px', fontWeight: '800', color: '#111827', margin: '0 0 8px 0', letterSpacing: '-0.5px' },
  pageSubtitle: { fontSize: '15px', color: '#6b7280', margin: 0 },
  
  card: { backgroundColor: '#fff', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', border: '1px solid #f3f4f6' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  sectionTitle: { fontSize: '18px', fontWeight: '700', color: '#1f2937', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' },
  
  fadeIn: { opacity: 1, transition: 'opacity 0.3s ease-in' },
  
  filterBox: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '32px' },
  filterRow: { display: 'flex', gap: '20px', alignItems: 'flex-end', flexWrap: 'wrap' },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: '8px', flex: '1', minWidth: '200px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', backgroundColor: '#fff', color: '#1e293b', transition: 'border-color 0.2s', width: '100%' },
  
  findBtn: { padding: '12px 24px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', height: '44px', display: 'flex', alignItems: 'center', transition: 'background-color 0.2s', boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)' },
  
  ttHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '0 4px' },
  ttTitle: { fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: 0 },
  addBtn: { padding: '10px 20px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)' },
  
  dayNav: { display: 'flex', justifyContent: 'space-between', alignItems: 'stretch', backgroundColor: '#f1f5f9', borderRadius: '12px', marginBottom: '24px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  dayNavBtn: { flex: '1', padding: '16px 20px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#475569', fontWeight: '600', transition: 'background-color 0.2s' },
  dayLabel: { flex: '2', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2563eb', color: '#fff', fontWeight: '700', fontSize: '16px', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)' },
  
  tableWrapper: { borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff' },
  th: { textAlign: 'left', fontSize: '12px', color: '#64748b', fontWeight: '700', padding: '16px 20px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textTransform: 'uppercase', letterSpacing: '0.5px' },
  tr: { borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s ease' },
  td: { padding: '16px 20px', fontSize: '14px', color: '#1e293b', verticalAlign: 'middle' },
  emptyCell: { padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '15px' },
  
  editBtnLight: { padding: '6px 12px', backgroundColor: '#fff', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all 0.2s' },
  deleteBtnLight: { padding: '6px 12px', backgroundColor: '#fff', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all 0.2s' },
  
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, backdropFilter: 'blur(4px)' },
  modal: { backgroundColor: '#fff', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  formTitle: { fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: 0 },
  modalBadge: { backgroundColor: '#eff6ff', color: '#2563eb', padding: '4px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: '700', border: '1px solid #bfdbfe' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '8px', transition: 'opacity 0.2s' },
  checkRow: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '8px', transition: 'all 0.2s' },
  checkbox: { width: '18px', height: '18px', cursor: 'pointer', accentColor: '#16a34a' },
  formButtons: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '20px' },
  cancelBtn: { padding: '10px 20px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#475569' },
  submitBtn: { padding: '10px 24px', borderRadius: '8px', border: 'none', backgroundColor: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600', boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)' },
  
  emptyState: { textAlign: 'center', padding: '60px 20px', border: '2px dashed #e2e8f0', borderRadius: '12px', backgroundColor: '#fafaf9', marginTop: '16px' },
  emptyStateIcon: { fontSize: '56px', marginBottom: '16px', opacity: 0.8 },
}