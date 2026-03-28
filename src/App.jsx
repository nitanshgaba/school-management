// src/App.jsx 

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

import Login from './pages/Login'
import AccessDenied from './pages/AccessDenied'

import AdminLayout from './pages/admin/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import Teachers from './pages/admin/Teachers'
import Students from './pages/admin/Students'
import Subjects from './pages/admin/Subjects'
import Attendance from './pages/admin/Attendance'
import NoticeBoard from './pages/admin/NoticeBoard'
import TimeTable from './pages/admin/TimeTable'
import Syllabus from './pages/admin/Syllabus'
import Notes from './pages/admin/Notes'
import Exams from './pages/admin/Exams'
import Marks from './pages/admin/Marks'
import Settings from './pages/admin/Settings'
import AdminEvents from './pages/admin/Events'
import AdminAnalytics from './pages/admin/Analytics'
import AdminFees from './pages/admin/Fees'
import AdminQuestionPapers from './pages/admin/QuestionPapers'
import ActivityLog from './pages/admin/ActivityLog'

import TeacherLayout from './pages/teacher/TeacherLayout'
import TeacherDashboard from './pages/teacher/Dashboard'
import TeacherAttendance from './pages/teacher/Attendance'
import TeacherTimeTable from './pages/teacher/TimeTable'
import TeacherSyllabus from './pages/teacher/Syllabus'
import TeacherNotes from './pages/teacher/Notes'
import TeacherMarks from './pages/teacher/Marks'
import TeacherLeave from './pages/teacher/Leave'
import TeacherSettings from './pages/teacher/Settings'
import TeacherExams from './pages/teacher/Exams'
import TeacherFeedback from './pages/teacher/Feedback'
import TeacherEvents from './pages/teacher/Events'
import TeacherAnnouncements from './pages/teacher/Announcements'

import StudentLayout from './pages/student/StudentLayout'
import StudentDashboard from './pages/student/Dashboard'
import StudentAttendance from './pages/student/Attendance'
import StudentTimeTable from './pages/student/TimeTable'
import StudentSyllabus from './pages/student/Syllabus'
import StudentNotes from './pages/student/Notes'
import StudentMarks from './pages/student/Marks'
import StudentFeedback from './pages/student/Feedback'
import StudentSettings from './pages/student/Settings'
import StudentExams from './pages/student/Exams'
import StudentEvents from './pages/student/Events'
import StudentAnnouncements from './pages/student/Announcements'
import AssignmentAnalyzer from './pages/student/AssignmentAnalyzer'
import StudentFees from './pages/student/Fees'
import StudentQuestionPapers from './pages/student/QuestionPapers'
import FocusTracker from './pages/student/FocusTracker'
import TeacherQuestionPaper from './pages/teacher/QuestionPaper'
import FocusLogs from './pages/teacher/FocusLogs'

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, profile, loading } = useAuth()
  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(profile?.role)) {
    return <AccessDenied />
  }
  return children
}

const RoleRedirect = () => {
  const { profile, loading, user } = useAuth()
  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  if (profile?.role === 'admin') return <Navigate to="/admin/dashboard" replace />
  if (profile?.role === 'teacher') return <Navigate to="/teacher/dashboard" replace />
  if (profile?.role === 'student') return <Navigate to="/student/dashboard" replace />
  return <div style={{ padding: '40px', textAlign: 'center' }}>Loading profile...</div>
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RoleRedirect />} />
        <Route path="/login" element={<Login />} />

        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="teachers" element={<Teachers />} />
          <Route path="students" element={<Students />} />
          <Route path="subjects" element={<Subjects />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="noticeboard" element={<NoticeBoard />} />
          <Route path="timetable" element={<TimeTable />} />
          <Route path="syllabus" element={<Syllabus />} />
          <Route path="notes" element={<Notes />} />
          <Route path="exams" element={<Exams />} />
          <Route path="marks" element={<Marks />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="events" element={<AdminEvents />} />
          <Route path="settings" element={<Settings />} />
          <Route path="fees" element={<AdminFees />} />
          <Route path="question-papers" element={<AdminQuestionPapers />} />
          <Route path="activity-log" element={<ActivityLog />} />
        </Route>

        <Route path="/teacher" element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <TeacherLayout />
          </ProtectedRoute>
        }>
          <Route path="dashboard" element={<TeacherDashboard />} />
          <Route path="attendance" element={<TeacherAttendance />} />
          <Route path="timetable" element={<TeacherTimeTable />} />
          <Route path="syllabus" element={<TeacherSyllabus />} />
          <Route path="notes" element={<TeacherNotes />} />
          <Route path="marks" element={<TeacherMarks />} />
          <Route path="leave" element={<TeacherLeave />} />
          <Route path="settings" element={<TeacherSettings />} />
          <Route path="exams" element={<TeacherExams />} />
          <Route path="feedback" element={<TeacherFeedback />} />
          <Route path="events" element={<TeacherEvents />} />
          <Route path="announcements" element={<TeacherAnnouncements />} />
          <Route path="focus-logs" element={<FocusLogs />} />
          <Route path="question-paper" element={<TeacherQuestionPaper />} />
        </Route>

        <Route path="/student" element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentLayout />
          </ProtectedRoute>
        }>
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="attendance" element={<StudentAttendance />} />
          <Route path="timetable" element={<StudentTimeTable />} />
          <Route path="syllabus" element={<StudentSyllabus />} />
          <Route path="notes" element={<StudentNotes />} />
          <Route path="marks" element={<StudentMarks />} />
          <Route path="feedback" element={<StudentFeedback />} />
          <Route path="exams" element={<StudentExams />} />
          <Route path="events" element={<StudentEvents />} />
          <Route path="announcements" element={<StudentAnnouncements />} />
          <Route path="assignment-analyzer" element={<AssignmentAnalyzer />} />
          <Route path="focus-tracker" element={<FocusTracker />} />
          <Route path="settings" element={<StudentSettings />} />
          <Route path="fees" element={<StudentFees />} />
          <Route path="question-papers" element={<StudentQuestionPapers />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
