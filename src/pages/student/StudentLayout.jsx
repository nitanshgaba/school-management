// import { useState, useEffect, useRef } from 'react'
// import { Outlet, useNavigate, useLocation, NavLink } from 'react-router-dom'
// import { useAuth } from '../../context/AuthContext'
// import { getSchoolSettings } from '../../lib/schoolSettings'
// import { FocusProvider } from '../../context/FocusContext'
// import FocusWidget from '../../components/FocusWidget'

// const MENU = [
//   { label: 'Dashboard', icon: '📊', path: '/student/dashboard' },
//   { label: 'Attendance', icon: '✅', path: '/student/attendance' },
//   { label: 'Time Table', icon: '🗓️', path: '/student/timetable' },
//   { label: 'Syllabus', icon: '📖', path: '/student/syllabus' },
//   { label: 'Notes', icon: '📝', path: '/student/notes' },
//   { label: 'Marks', icon: '🏆', path: '/student/marks' },
//   { label: 'Fees', icon: '💰', path: '/student/fees' },
//   { label: 'Exams', icon: '📝', path: '/student/exams' },
//   { label: 'Events', icon: '🎉', path: '/student/events' },
//   { label: 'Announcements', icon: '📢', path: '/student/announcements' },
//   { label: 'AI Analyzer', icon: '🤖', path: '/student/assignment-analyzer' },
//   { label: 'Question Papers', icon: '📄', path: '/student/question-papers' },
//   { label: 'Focus Tracker', icon: '👁️', path: '/student/focus-tracker' },
//   { label: 'Feedback', icon: '💬', path: '/student/feedback' },
//   { label: 'Settings', icon: '⚙️', path: '/student/settings' },
// ]

// export default function StudentLayout() {
//   const { profile, logout } = useAuth()
//   const navigate = useNavigate()
//   const location = useLocation()
  
//   const [sidebarOpen, setSidebarOpen] = useState(true)
//   const [schoolName, setSchoolName] = useState('ERP System')
//   const [schoolLogo, setSchoolLogo] = useState('')
//   const [showProfile, setShowProfile] = useState(false)
//   const [studentInfo, setStudentInfo] = useState(null)
  
//   // Search Logic
//   const [searchQuery, setSearchQuery] = useState('')
//   const [isSearchFocused, setIsSearchFocused] = useState(false)
//   const searchRef = useRef(null)

//   useEffect(() => {
//     const fetchSettings = async () => {
//       try {
//         const response = await getSchoolSettings()
//         let settings = response?.data || response
//         if (Array.isArray(settings)) settings = settings[0]
//         if (settings) {
//           const validName = settings.school_name || settings.schoolName || settings.name
//           if (validName) setSchoolName(validName)
//           if (settings.logo_url) setSchoolLogo(settings.logo_url)
//         }
//       } catch (err) { console.error(err) }
//     }
//     fetchSettings()

//     const handleClickOutside = (e) => {
//       if (searchRef.current && !searchRef.current.contains(e.target)) {
//         setIsSearchFocused(false)
//       }
//     }
//     document.addEventListener("mousedown", handleClickOutside)
//     return () => document.removeEventListener("mousedown", handleClickOutside)
//   }, [])

//   useEffect(() => { if (profile?.id) fetchStudentInfo() }, [profile])

//   const fetchStudentInfo = async () => {
//     const { supabase } = await import('../../lib/supabase')
//     const { data } = await supabase
//       .from('students')
//       .select('roll_no, class_id, section_id, classes(name), sections(name), profiles(name, email, phone, uid, gender, avatar_url)')
//       .eq('id', profile.id)
//       .single()
//     setStudentInfo(data)
//   }

//   const filteredMenu = MENU.filter(item => 
//     item.label.toLowerCase().includes(searchQuery.toLowerCase())
//   )

//   const renderAvatar = (size = '36px', fontSize = '14px') => {
//     if (profile?.avatar_url) {
//       return <img src={profile.avatar_url} alt="Profile" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '2px solid #fff', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }} />
//     }
//     return (
//       <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: '#4f46e5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: fontSize, border: '2px solid #fff', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
//         {profile?.name?.charAt(0).toUpperCase() || 'S'}
//       </div>
//     )
//   }

//   return (
//     <FocusProvider>
//       <div style={styles.wrapper}>
//         {/* Sidebar */}
//         <aside style={{ ...styles.sidebar, width: sidebarOpen ? '260px' : '0px' }}>
//           <div style={styles.logoContainer}>
//             {schoolLogo ? (
//               <img src={schoolLogo} alt="Logo" style={styles.logoImg} onError={e => e.target.style.display = 'none'} />
//             ) : (
//               <div style={styles.logoPlaceholder}>🎓</div>
//             )}
//             <div style={styles.logoTextWrapper}>
//               <span style={styles.logoText}>{schoolName}</span>
//               <span style={styles.logoSubtext}>Student Portal</span>
//             </div>
//           </div>

//           <nav style={styles.nav}>
//             <div style={styles.navSectionTitle}>ACADEMICS</div>
//             {MENU.map((item) => (
//               <NavLink
//                 key={item.path}
//                 to={item.path}
//                 style={({ isActive }) => ({
//                   ...styles.navItem,
//                   backgroundColor: isActive ? '#eef2ff' : 'transparent',
//                   color: isActive ? '#4f46e5' : '#475569',
//                   fontWeight: isActive ? '700' : '500',
//                   borderRight: isActive ? '3px solid #4f46e5' : '3px solid transparent',
//                 })}
//               >
//                 <span style={styles.navIcon}>{item.icon}</span>
//                 <span style={styles.navLabel}>{item.label}</span>
//               </NavLink>
//             ))}
//           </nav>

//           <div style={styles.sidebarFooter}>
//             <button onClick={logout} style={styles.logoutBtn}>
//               <span>🚪</span> <span>Secure Logout</span>
//             </button>
//           </div>
//         </aside>

//         {/* Main Content Area */}
//         <div style={styles.main}>
//           <header style={styles.topbar}>
//             <div style={styles.topbarLeft}>
//               <button onClick={() => setSidebarOpen(!sidebarOpen)} style={styles.menuBtn}>☰</button>
              
//               <div style={styles.searchWrapper} ref={searchRef}>
//                 <span style={styles.searchIcon}>🔍</span>
//                 <input 
//                   style={styles.searchInput} 
//                   placeholder="Search features..." 
//                   value={searchQuery}
//                   onChange={(e) => setSearchQuery(e.target.value)}
//                   onFocus={() => setIsSearchFocused(true)}
//                 />
//                 {isSearchFocused && searchQuery && (
//                   <div style={styles.searchDropdown}>
//                     {filteredMenu.map(item => (
//                       <div key={item.path} style={styles.searchDropdownItem} onClick={() => { navigate(item.path); setSearchQuery(''); setIsSearchFocused(false); }}>
//                         <span>{item.icon}</span> <span>{item.label}</span>
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             </div>

//             <div style={styles.topbarRight}>
//               <div style={styles.profileTrigger} onClick={() => setShowProfile(true)}>
//                 <div style={styles.profileTextInfo}>
//                   <span style={styles.profileName}>{profile?.name || 'Student'}</span>
//                   <span style={styles.profileRole}>Roll: {studentInfo?.roll_no || profile?.uid}</span>
//                 </div>
//                 {renderAvatar('40px', '16px')}
//               </div>
//             </div>
//           </header>

//           {showProfile && studentInfo && (
//             <div style={styles.overlay} onClick={() => setShowProfile(false)}>
//               <div style={styles.profileModal} onClick={e => e.stopPropagation()}>
//                 <div style={styles.profileModalHeader}>
//                   {renderAvatar('64px', '24px')}
//                   <div>
//                     <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>{profile?.name}</h2>
//                     <p style={styles.modalBadge}>Class {studentInfo.classes?.name || 'N/A'}</p>
//                   </div>
//                   <button style={styles.modalCloseBtn} onClick={() => setShowProfile(false)}>✕</button>
//                 </div>
                
//                 <div style={styles.infoGrid}>
//                   {[
//                     { label: 'Student ID', value: studentInfo.profiles?.uid },
//                     { label: 'Roll Number', value: studentInfo.roll_no },
//                     { label: 'Email', value: studentInfo.profiles?.email },
//                     { label: 'Phone', value: studentInfo.profiles?.phone },
//                     { label: 'Gender', value: studentInfo.profiles?.gender }
//                   ].map(item => (
//                     <div key={item.label} style={styles.infoItem}>
//                       <span style={styles.infoLabel}>{item.label}</span>
//                       <span style={styles.infoValue}>{item.value || '—'}</span>
//                     </div>
//                   ))}
//                 </div>

//                 <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
//                   <button style={styles.settingsBtn} onClick={() => { setShowProfile(false); navigate('/student/settings'); }}>⚙️ Account Settings</button>
//                   <button style={styles.modalLogoutBtn} onClick={logout}>🚪 Logout</button>
//                 </div>
//               </div>
//             </div>
//           )}

//           <main style={styles.content}>
//             <div style={styles.contentInner}>
//               <Outlet />
//             </div>
//           </main>
//         </div>
//       </div>
//       <FocusWidget />
//     </FocusProvider>
//   )
// }

// const styles = {
//   wrapper: { display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'Inter, sans-serif' },
//   sidebar: { backgroundColor: '#fff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)', position: 'sticky', top: 0, height: '100vh', zIndex: 20, flexShrink: 0, overflowY: 'hidden' },
  
//   logoContainer: { display: 'flex', alignItems: 'center', gap: '12px', padding: '24px 20px', borderBottom: '1px solid #f1f5f9', minHeight: '90px', boxSizing: 'border-box', overflow: 'hidden' },
//   logoImg: { width: '42px', height: '42px', borderRadius: '8px', objectFit: 'cover', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
//   logoPlaceholder: { width: '42px', height: '42px', borderRadius: '8px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' },
//   logoTextWrapper: { display: 'flex', flexDirection: 'column', minWidth: 0 },
//   logoText: { fontSize: '16px', fontWeight: '800', color: '#0f172a', lineHeight: '1.2', whiteSpace: 'normal', wordBreak: 'break-word' },
//   logoSubtext: { fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' },

//   nav: { display: 'flex', flexDirection: 'column', padding: '20px 12px', gap: '4px', flex: 1, overflowY: 'auto' },
//   navSectionTitle: { fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', padding: '0 12px', marginBottom: '8px' },
//   navItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '8px 0 0 8px', textDecoration: 'none', transition: 'all 0.2s', whiteSpace: 'nowrap', overflow: 'hidden' },
//   navIcon: { fontSize: '18px', width: '24px', display: 'flex', justifyContent: 'center' },
//   navLabel: { fontSize: '14px', letterSpacing: '0.3px' },

//   sidebarFooter: { padding: '16px', borderTop: '1px solid #f1f5f9', backgroundColor: '#fafaf9' },
//   logoutBtn: { width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontWeight: '700', fontSize: '13px', cursor: 'pointer', borderRadius: '8px' },

//   main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
//   topbar: { backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 24px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 },
//   topbarLeft: { display: 'flex', alignItems: 'center', gap: '20px', flex: 1 },
//   menuBtn: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#475569' },

//   searchWrapper: { position: 'relative', width: '100%', maxWidth: '350px', display: 'flex', alignItems: 'center' },
//   searchIcon: { position: 'absolute', left: '14px', fontSize: '14px', color: '#94a3b8' },
//   searchInput: { width: '100%', padding: '10px 14px 10px 38px', borderRadius: '24px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', backgroundColor: '#f8fafc', color: '#1e293b' },
//   searchDropdown: { position: 'absolute', top: '110%', left: 0, width: '100%', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 50, maxHeight: '300px', overflowY: 'auto' },
//   searchDropdownItem: { padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: '#334155', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' },

//   topbarRight: { display: 'flex', alignItems: 'center', gap: '16px' },
//   profileTrigger: { display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '6px 8px', borderRadius: '32px', transition: 'background-color 0.2s', ':hover': { backgroundColor: '#f1f5f9' } },
//   profileTextInfo: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textAlign: 'right' },
//   profileName: { fontSize: '14px', fontWeight: '700', color: '#0f172a' },
//   profileRole: { fontSize: '11px', color: '#64748b', fontWeight: '600' },

//   content: { padding: '32px', flex: 1, overflowY: 'auto' },
//   contentInner: { maxWidth: '1400px', margin: '0 auto', width: '100%' },

//   overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)', padding: '20px' },
//   profileModal: { backgroundColor: '#fff', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '440px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' },
//   profileModalHeader: { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #e2e8f0' },
//   modalBadge: { margin: '4px 0 0', fontSize: '12px', color: '#2563eb', fontWeight: '700', backgroundColor: '#eff6ff', padding: '2px 10px', borderRadius: '12px', display: 'inline-block' },
//   modalCloseBtn: { marginLeft: 'auto', alignSelf: 'flex-start', background: '#f1f5f9', border: 'none', fontSize: '16px', cursor: 'pointer', color: '#475569', width: '32px', height: '32px', borderRadius: '50%' },

//   infoGrid: { display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#f8fafc', borderRadius: '12px', padding: '20px', border: '1px solid #f1f5f9' },
//   infoItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px dashed #e2e8f0' },
//   infoLabel: { fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' },
//   infoValue: { fontSize: '14px', fontWeight: '600', color: '#0f172a' },

//   settingsBtn: { flex: 1, padding: '12px', backgroundColor: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
//   modalLogoutBtn: { flex: 1, padding: '12px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
// }










// src/pages/student/StudentLayout.jsx
import { useState, useEffect, useRef } from 'react'
import { Outlet, useNavigate, useLocation, NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getSchoolSettings } from '../../lib/schoolSettings'

const MENU = [
  { label: 'Dashboard', icon: '📊', path: '/student/dashboard' },
  { label: 'Attendance', icon: '✅', path: '/student/attendance' },
  { label: 'Time Table', icon: '🗓️', path: '/student/timetable' },
  { label: 'Syllabus', icon: '📖', path: '/student/syllabus' },
  { label: 'Notes', icon: '📝', path: '/student/notes' },
  { label: 'Marks', icon: '🏆', path: '/student/marks' },
  { label: 'Fees', icon: '💰', path: '/student/fees' },
  { label: 'Exams', icon: '📝', path: '/student/exams' },
  { label: 'Events', icon: '🎉', path: '/student/events' },
  { label: 'Announcements', icon: '📢', path: '/student/announcements' },
  { label: 'AI Analyzer', icon: '🤖', path: '/student/assignment-analyzer' },
  { label: 'Question Papers', icon: '📄', path: '/student/question-papers' },
  { label: 'Feedback', icon: '💬', path: '/student/feedback' },
  { label: 'Settings', icon: '⚙️', path: '/student/settings' },
]

export default function StudentLayout() {
  const { profile, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [schoolName, setSchoolName] = useState('ERP System')
  const [schoolLogo, setSchoolLogo] = useState('')
  const [showProfile, setShowProfile] = useState(false)
  const [studentInfo, setStudentInfo] = useState(null)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const searchRef = useRef(null)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await getSchoolSettings()
        let settings = response?.data || response
        if (Array.isArray(settings)) settings = settings[0]
        if (settings) {
          const validName = settings.school_name || settings.schoolName || settings.name
          if (validName) setSchoolName(validName)
          if (settings.logo_url) setSchoolLogo(settings.logo_url)
        }
      } catch (err) { console.error(err) }
    }
    fetchSettings()

    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchFocused(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => { if (profile?.id) fetchStudentInfo() }, [profile])

  const fetchStudentInfo = async () => {
    const { supabase } = await import('../../lib/supabase')
    const { data } = await supabase
      .from('students')
      .select('roll_no, class_id, section_id, classes(name), sections(name), profiles(name, email, phone, uid, gender, avatar_url)')
      .eq('id', profile.id)
      .single()
    setStudentInfo(data)
  }

  const filteredMenu = MENU.filter(item => 
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const renderAvatar = (size = '36px', fontSize = '14px') => {
    if (profile?.avatar_url) {
      return <img src={profile.avatar_url} alt="Profile" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '2px solid #fff', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }} />
    }
    return (
      <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: '#4f46e5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: fontSize, border: '2px solid #fff', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        {profile?.name?.charAt(0).toUpperCase() || 'S'}
      </div>
    )
  }

  return (
    <div style={styles.wrapper}>
      <aside style={{ ...styles.sidebar, width: sidebarOpen ? '260px' : '0px' }}>
        <div style={styles.logoContainer}>
          {schoolLogo ? (
            <img src={schoolLogo} alt="Logo" style={styles.logoImg} onError={e => e.target.style.display = 'none'} />
          ) : (
            <div style={styles.logoPlaceholder}>🎓</div>
          )}
          <div style={styles.logoTextWrapper}>
            <span style={styles.logoText}>{schoolName}</span>
            <span style={styles.logoSubtext}>Student Portal</span>
          </div>
        </div>

        <nav style={styles.nav}>
          <div style={styles.navSectionTitle}>ACADEMICS</div>
          {MENU.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                ...styles.navItem,
                backgroundColor: isActive ? '#eef2ff' : 'transparent',
                color: isActive ? '#4f46e5' : '#475569',
                fontWeight: isActive ? '700' : '500',
                borderRight: isActive ? '3px solid #4f46e5' : '3px solid transparent',
              })}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              <span style={styles.navLabel}>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div style={styles.sidebarFooter}>
          <button onClick={logout} style={styles.logoutBtn}>
            <span>🚪</span> <span>Secure Logout</span>
          </button>
        </div>
      </aside>

      <div style={styles.main}>
        <header style={styles.topbar}>
          <div style={styles.topbarLeft}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={styles.menuBtn}>☰</button>
            
            <div style={styles.searchWrapper} ref={searchRef}>
              <span style={styles.searchIcon}>🔍</span>
              <input 
                style={styles.searchInput} 
                placeholder="Search features..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
              />
              {isSearchFocused && searchQuery && (
                <div style={styles.searchDropdown}>
                  {filteredMenu.map(item => (
                    <div key={item.path} style={styles.searchDropdownItem} onClick={() => { navigate(item.path); setSearchQuery(''); setIsSearchFocused(false); }}>
                      <span>{item.icon}</span> <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={styles.topbarRight}>
            <div style={styles.profileTrigger} onClick={() => setShowProfile(true)}>
              <div style={styles.profileTextInfo}>
                <span style={styles.profileName}>{profile?.name || 'Student'}</span>
                <span style={styles.profileRole}>Roll: {studentInfo?.roll_no || profile?.uid}</span>
              </div>
              {renderAvatar('40px', '16px')}
            </div>
          </div>
        </header>

        {showProfile && studentInfo && (
          <div style={styles.overlay} onClick={() => setShowProfile(false)}>
            <div style={styles.profileModal} onClick={e => e.stopPropagation()}>
              <div style={styles.profileModalHeader}>
                {renderAvatar('64px', '24px')}
                <div>
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>{profile?.name}</h2>
                  <p style={styles.modalBadge}>Class {studentInfo.classes?.name || 'N/A'}</p>
                </div>
                <button style={styles.modalCloseBtn} onClick={() => setShowProfile(false)}>✕</button>
              </div>
              
              <div style={styles.infoGrid}>
                {[
                  { label: 'Student ID', value: studentInfo.profiles?.uid },
                  { label: 'Roll Number', value: studentInfo.roll_no },
                  { label: 'Email', value: studentInfo.profiles?.email },
                  { label: 'Phone', value: studentInfo.profiles?.phone },
                  { label: 'Gender', value: studentInfo.profiles?.gender }
                ].map(item => (
                  <div key={item.label} style={styles.infoItem}>
                    <span style={styles.infoLabel}>{item.label}</span>
                    <span style={styles.infoValue}>{item.value || '—'}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                <button style={styles.settingsBtn} onClick={() => { setShowProfile(false); navigate('/student/settings'); }}>⚙️ Account Settings</button>
                <button style={styles.modalLogoutBtn} onClick={logout}>🚪 Logout</button>
              </div>
            </div>
          </div>
        )}

        <main style={styles.content}>
          <div style={styles.contentInner}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

const styles = {
  wrapper: { display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'Inter, sans-serif' },
  sidebar: { backgroundColor: '#fff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)', position: 'sticky', top: 0, height: '100vh', zIndex: 20, flexShrink: 0, overflowY: 'hidden' },
  logoContainer: { display: 'flex', alignItems: 'center', gap: '12px', padding: '24px 20px', borderBottom: '1px solid #f1f5f9', minHeight: '90px', boxSizing: 'border-box', overflow: 'hidden' },
  logoImg: { width: '42px', height: '42px', borderRadius: '8px', objectFit: 'cover', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  logoPlaceholder: { width: '42px', height: '42px', borderRadius: '8px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' },
  logoTextWrapper: { display: 'flex', flexDirection: 'column', minWidth: 0 },
  logoText: { fontSize: '16px', fontWeight: '800', color: '#0f172a', lineHeight: '1.2', whiteSpace: 'normal', wordBreak: 'break-word' },
  logoSubtext: { fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' },
  nav: { display: 'flex', flexDirection: 'column', padding: '20px 12px', gap: '4px', flex: 1, overflowY: 'auto' },
  navSectionTitle: { fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', padding: '0 12px', marginBottom: '8px' },
  navItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '8px 0 0 8px', textDecoration: 'none', transition: 'all 0.2s', whiteSpace: 'nowrap', overflow: 'hidden' },
  navIcon: { fontSize: '18px', width: '24px', display: 'flex', justifyContent: 'center' },
  navLabel: { fontSize: '14px', letterSpacing: '0.3px' },
  sidebarFooter: { padding: '16px', borderTop: '1px solid #f1f5f9', backgroundColor: '#fafaf9' },
  logoutBtn: { width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontWeight: '700', fontSize: '13px', cursor: 'pointer', borderRadius: '8px' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  topbar: { backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 24px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 },
  topbarLeft: { display: 'flex', alignItems: 'center', gap: '20px', flex: 1 },
  menuBtn: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#475569' },
  searchWrapper: { position: 'relative', width: '100%', maxWidth: '350px', display: 'flex', alignItems: 'center' },
  searchIcon: { position: 'absolute', left: '14px', fontSize: '14px', color: '#94a3b8' },
  searchInput: { width: '100%', padding: '10px 14px 10px 38px', borderRadius: '24px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', backgroundColor: '#f8fafc', color: '#1e293b' },
  searchDropdown: { position: 'absolute', top: '110%', left: 0, width: '100%', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 50, maxHeight: '300px', overflowY: 'auto' },
  searchDropdownItem: { padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: '#334155', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' },
  topbarRight: { display: 'flex', alignItems: 'center', gap: '16px' },
  profileTrigger: { display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '6px 8px', borderRadius: '32px', transition: 'background-color 0.2s', ':hover': { backgroundColor: '#f1f5f9' } },
  profileTextInfo: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textAlign: 'right' },
  profileName: { fontSize: '14px', fontWeight: '700', color: '#0f172a' },
  profileRole: { fontSize: '11px', color: '#64748b', fontWeight: '600' },
  content: { padding: '32px', flex: 1, overflowY: 'auto' },
  contentInner: { maxWidth: '1400px', margin: '0 auto', width: '100%' },
  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)', padding: '20px' },
  profileModal: { backgroundColor: '#fff', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '440px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' },
  profileModalHeader: { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #e2e8f0' },
  modalBadge: { margin: '4px 0 0', fontSize: '12px', color: '#2563eb', fontWeight: '700', backgroundColor: '#eff6ff', padding: '2px 10px', borderRadius: '12px', display: 'inline-block' },
  modalCloseBtn: { marginLeft: 'auto', alignSelf: 'flex-start', background: '#f1f5f9', border: 'none', fontSize: '16px', cursor: 'pointer', color: '#475569', width: '32px', height: '32px', borderRadius: '50%' },
  infoGrid: { display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#f8fafc', borderRadius: '12px', padding: '20px', border: '1px solid #f1f5f9' },
  infoItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px dashed #e2e8f0' },
  infoLabel: { fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' },
  infoValue: { fontSize: '14px', fontWeight: '600', color: '#0f172a' },
  settingsBtn: { flex: 1, padding: '12px', backgroundColor: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
  modalLogoutBtn: { flex: 1, padding: '12px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
}