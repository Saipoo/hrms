import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import EmployeeDashboard from './pages/dashboards/EmployeeDashboard';
import EmployeeDashboardNew from './pages/dashboards/StudentDashboardNew';
import ManagerDashboard from './pages/dashboards/ManagerDashboard';
import ManagerDashboardNew from './pages/dashboards/TeacherDashboardNew';
import ParentDashboard from './pages/dashboards/ParentDashboard';
import ParentDashboardNew from './pages/dashboards/ParentDashboardNew';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import CertificatesPage from './pages/student/CertificatesPage';
import FaceRegister from './pages/student/FaceRegister';
import MarkAttendance from './pages/student/MarkAttendance';
import AttendanceHistory from './pages/student/AttendanceHistory';
import TimetableManagement from './pages/manager/TimetableManagement';
import AttendanceLogs from './pages/manager/AttendanceLogs';
import MentorConnect from './pages/MentorConnect';
import VideoMeeting from './pages/VideoMeeting';
import GradeMaster from './pages/student/GradeMaster';
import GradeEvaluator from './pages/manager/GradeEvaluator';
import GradeViewer from './pages/parent/GradeViewer';
import CourseMaster from './pages/student/CourseMaster';
import CourseCreator from './pages/manager/CourseCreator';
import CourseDashboard from './pages/manager/CourseDashboard';
import StudentCourseDashboard from './pages/student/StudentCourseDashboard';
import InterviewSimulator from './pages/student/InterviewSimulator';
import LiveInterviewSession from './pages/student/LiveInterviewSession';
import InterviewResults from './pages/student/InterviewResults';
import TeacherInterviewEvaluations from './pages/manager/TeacherInterviewEvaluations';
import InternshipReports from './pages/manager/InternshipReports';
import HackathonReports from './pages/manager/HackathonReports';
import InternshipSimulator from './pages/student/internship/InternshipSimulator';
import InternshipWorkspace from './pages/student/internship/InternshipWorkspace';
import TaskSubmission from './pages/student/internship/TaskSubmission';
import HackathonChallenges from './pages/student/hackathon/HackathonChallenges';
import HackathonDetails from './pages/student/hackathon/HackathonDetails';
import ProjectRoom from './pages/student/hackathon/ProjectRoom';
import Leaderboard from './pages/student/hackathon/Leaderboard';
import StudyPlanner from './pages/student/StudyPlanner';
import CareerAdvisor from './pages/student/CareerAdvisor';
import ResumeBuilder from './pages/student/ResumeBuilder';
import StudentLectures from './pages/student/StudentLectures';
import RealTimeUpdates from './pages/student/RealTimeUpdates';
import TeacherLectures from './pages/manager/TeacherLectures';
import FAQPage from './pages/FAQPage_Simple';
import AboutPage from './pages/AboutPage';
import TeacherConfessionPage from './pages/TeacherConfessionPage';
import ParentWellbeingPage from './pages/ParentWellbeingPage';
import AdminConfessionPage from './pages/AdminConfessionPage';
import MyConfessionsPage from './pages/MyConfessionsPage';
import ProfileSettings from './pages/ProfileSettings';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import NotFound from './pages/NotFound';
import FloatingChatbot from './components/chatbot/FloatingChatbot';

// Hook to get user role
import { useAuth } from './context/AuthContext';

function App() {
  const { user } = useAuth();
  const userRole = user?.role;

  return (
    <div className="min-h-screen">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Employee Routes */}
        <Route path="/dashboard/employee" element={
          <ProtectedRoute allowedRoles={['student']}>
            <EmployeeDashboard />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/employee/face-register" element={
          <ProtectedRoute allowedRoles={['student']}>
            <FaceRegister />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/employee/mark-attendance" element={
          <ProtectedRoute allowedRoles={['student']}>
            <MarkAttendance />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/employee/attendance-history" element={
          <ProtectedRoute allowedRoles={['student']}>
            <AttendanceHistory />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/employee/grade-master" element={
          <ProtectedRoute allowedRoles={['student']}>
            <GradeMaster />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/employee/course-master" element={
          <ProtectedRoute allowedRoles={['student']}>
            <CourseMaster />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/employee/course-dashboard" element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentCourseDashboard />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/employee/certificates" element={
          <ProtectedRoute allowedRoles={['student']}>
            <CertificatesPage />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/employee/interview" element={
          <ProtectedRoute allowedRoles={['student']}>
            <InterviewSimulator />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/employee/interview/session/:sessionId" element={
          <ProtectedRoute allowedRoles={['student']}>
            <LiveInterviewSession />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/employee/interview/results/:reportId" element={
          <ProtectedRoute allowedRoles={['student']}>
            <InterviewResults />
          </ProtectedRoute>
        } />

        {/* Onboarding / Internship Routes */}
        <Route path="/dashboard/employee/onboarding" element={
          <ProtectedRoute allowedRoles={['student']}>
            <InternshipSimulator />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/student/internship" element={
          <ProtectedRoute allowedRoles={['student']}>
            <InternshipSimulator />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/employee/onboarding/:enrollmentId/workspace" element={
          <ProtectedRoute allowedRoles={['student']}>
            <InternshipWorkspace />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/employee/onboarding/task/:taskId" element={
          <ProtectedRoute allowedRoles={['student']}>
            <TaskSubmission />
          </ProtectedRoute>
        } />

        {/* Challenges Routes */}
        <Route path="/dashboard/employee/challenges" element={
          <ProtectedRoute allowedRoles={['student']}>
            <HackathonChallenges />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/employee/challenges/:hackathonId" element={
          <ProtectedRoute allowedRoles={['student']}>
            <HackathonDetails />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/employee/challenges/:hackathonId/room" element={
          <ProtectedRoute allowedRoles={['student']}>
            <ProjectRoom />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/employee/challenges/:hackathonId/leaderboard" element={
          <ProtectedRoute allowedRoles={['student']}>
            <Leaderboard />
          </ProtectedRoute>
        } />

        {/* Growth & Career Routes */}
        <Route path="/dashboard/employee/planner" element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudyPlanner />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/employee/career-advisor" element={
          <ProtectedRoute allowedRoles={['student']}>
            <CareerAdvisor />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/employee/profile-builder" element={
          <ProtectedRoute allowedRoles={['student']}>
            <ResumeBuilder />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/employee/documents" element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentLectures />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/employee/updates" element={
          <ProtectedRoute allowedRoles={['student']}>
            <RealTimeUpdates />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/employee/faq" element={
          <ProtectedRoute allowedRoles={['student']}>
            <FAQPage userRole="employee" />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/employee/about" element={
          <ProtectedRoute allowedRoles={['student']}>
            <AboutPage userRole="employee" />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/employee/my-feedback" element={
          <ProtectedRoute allowedRoles={['student']}>
            <MyConfessionsPage />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/employee/profile" element={
          <ProtectedRoute allowedRoles={['student']}>
            <ProfileSettings />
          </ProtectedRoute>
        } />

        {/* Manager Routes */}
        <Route path="/dashboard/manager" element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <ManagerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/manager/timetable" element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <TimetableManagement />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/manager/attendance-logs" element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <AttendanceLogs />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/manager/grade-evaluator" element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <GradeEvaluator />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/manager/course-creator" element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <CourseCreator />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/manager/course-dashboard" element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <CourseDashboard />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/manager/interview-evaluations" element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <TeacherInterviewEvaluations />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/manager/interview-report/:reportId" element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <InterviewResults />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/manager/internship-reports" element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <InternshipReports />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/manager/hackathon-reports" element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <HackathonReports />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/manager/lectures" element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <TeacherLectures />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/manager/faq" element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <FAQPage userRole="teacher" />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/manager/about" element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <AboutPage userRole="teacher" />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/manager/confessions" element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <TeacherConfessionPage />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/manager/profile" element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <ProfileSettings />
          </ProtectedRoute>
        } />

        {/* HR (Parent) Routes */}
        <Route path="/dashboard/hr" element={
          <ProtectedRoute allowedRoles={['parent']}>
            <ParentDashboard />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/hr/grades" element={
          <ProtectedRoute allowedRoles={['parent']}>
            <GradeViewer />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/hr/certificates" element={
          <ProtectedRoute allowedRoles={['parent']}>
            <CertificatesPage />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/hr/faq" element={
          <ProtectedRoute allowedRoles={['parent']}>
            <FAQPage userRole="parent" />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/hr/about" element={
          <ProtectedRoute allowedRoles={['parent']}>
            <AboutPage userRole="parent" />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/hr/wellbeing" element={
          <ProtectedRoute allowedRoles={['parent']}>
            <ParentWellbeingPage />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/hr/profile" element={
          <ProtectedRoute allowedRoles={['parent']}>
            <ProfileSettings />
          </ProtectedRoute>
        } />

        {/* Admin Routes */}
        <Route path="/dashboard/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/admin/confessions" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminConfessionPage />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/admin/profile" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ProfileSettings />
          </ProtectedRoute>
        } />

        {/* Mentor Connect Routes - open to all roles */}
        <Route path="/mentor-connect" element={
          <ProtectedRoute allowedRoles={['student', 'teacher', 'parent', 'admin']}>
            <MentorConnect />
          </ProtectedRoute>
        } />
        <Route path="/meeting/:meetingId" element={
          <ProtectedRoute allowedRoles={['student', 'teacher', 'parent', 'admin']}>
            <VideoMeeting />
          </ProtectedRoute>
        } />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />

      {/* Floating Chatbot - Available on all pages for authenticated users */}
      {userRole && <FloatingChatbot userRole={userRole} />}
    </div>
  );
}

export default App;