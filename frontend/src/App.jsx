import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import Sidebar from './components/Sidebar';

// Auth pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Faculty pages
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import ViewAssignedLectures from './pages/faculty/ViewAssignedLectures';
import StudentPerformance from './pages/faculty/StudentPerformance';
import FacultyClasswork from './pages/faculty/FacultyClasswork';
import FacultyAttendance from './pages/faculty/FacultyAttendance';
import FacultyMarks from './pages/faculty/FacultyMarks';
import FacultyTestTimetable from './pages/faculty/FacultyTestTimetable';
import FacultyNotifications from './pages/faculty/FacultyNotifications';

// Student pages
import StudentDashboard from './pages/student/StudentDashboard';
import StudentMarks from './pages/student/StudentMarks';
import StudentAttendance from './pages/student/StudentAttendance';
import StudentFees from './pages/student/StudentFees';
import StudentTimetable from './pages/student/StudentTimetable';
import StudentClasswork from './pages/student/StudentClasswork';
import StudentNotifications from './pages/student/StudentNotifications';

import './index.css';

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  const getPageTitle = () => {
    const roleLabels = { faculty: 'Faculty Panel', student: 'Student Portal' };
    return roleLabels[user?.role] || 'Dashboard';
  };

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content-area">
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} pageTitle={getPageTitle()} />
        <div className="page-content">{children}</div>
      </div>
    </div>
  );
};

const AppRoutes = () => {
  const { isAuthenticated, user } = useAuth();

  const getDefaultRedirect = () => {
    if (!isAuthenticated) return '/login';
    const map = { faculty: '/faculty', student: '/student' };
    return map[user?.role] || '/login';
  };

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={isAuthenticated ? <Navigate to={getDefaultRedirect()} /> : <Login />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to={getDefaultRedirect()} /> : <Register />} />
      <Route path="/forgot-password" element={isAuthenticated ? <Navigate to={getDefaultRedirect()} /> : <ForgotPassword />} />
      <Route path="/reset-password/:token" element={isAuthenticated ? <Navigate to={getDefaultRedirect()} /> : <ResetPassword />} />

      {/* Faculty routes */}
      <Route path="/faculty" element={<ProtectedRoute allowedRoles={['faculty']}><DashboardLayout><FacultyDashboard /></DashboardLayout></ProtectedRoute>} />
      <Route path="/faculty/schedule" element={<ProtectedRoute allowedRoles={['faculty']}><DashboardLayout><ViewAssignedLectures /></DashboardLayout></ProtectedRoute>} />
      <Route path="/faculty/marks" element={<ProtectedRoute allowedRoles={['faculty']}><DashboardLayout><FacultyMarks /></DashboardLayout></ProtectedRoute>} />
      <Route path="/faculty/attendance" element={<ProtectedRoute allowedRoles={['faculty']}><DashboardLayout><FacultyAttendance mode="students" /></DashboardLayout></ProtectedRoute>} />
      <Route path="/faculty/my-attendance" element={<ProtectedRoute allowedRoles={['faculty']}><DashboardLayout><FacultyAttendance mode="self" /></DashboardLayout></ProtectedRoute>} />
      <Route path="/faculty/test-timetable" element={<ProtectedRoute allowedRoles={['faculty']}><DashboardLayout><FacultyTestTimetable /></DashboardLayout></ProtectedRoute>} />
      <Route path="/faculty/classwork" element={<ProtectedRoute allowedRoles={['faculty']}><DashboardLayout><FacultyClasswork /></DashboardLayout></ProtectedRoute>} />
      <Route path="/faculty/performance" element={<ProtectedRoute allowedRoles={['faculty']}><DashboardLayout><StudentPerformance /></DashboardLayout></ProtectedRoute>} />
      <Route path="/faculty/notifications" element={<ProtectedRoute allowedRoles={['faculty']}><DashboardLayout><FacultyNotifications /></DashboardLayout></ProtectedRoute>} />

      {/* Student routes */}
      <Route path="/student" element={<ProtectedRoute allowedRoles={['student']}><DashboardLayout><StudentDashboard /></DashboardLayout></ProtectedRoute>} />
      <Route path="/student/marks" element={<ProtectedRoute allowedRoles={['student']}><DashboardLayout><StudentMarks /></DashboardLayout></ProtectedRoute>} />
      <Route path="/student/attendance" element={<ProtectedRoute allowedRoles={['student']}><DashboardLayout><StudentAttendance /></DashboardLayout></ProtectedRoute>} />
      <Route path="/student/fees" element={<ProtectedRoute allowedRoles={['student']}><DashboardLayout><StudentFees /></DashboardLayout></ProtectedRoute>} />
      <Route path="/student/timetable" element={<ProtectedRoute allowedRoles={['student']}><DashboardLayout><StudentTimetable type="lecture" /></DashboardLayout></ProtectedRoute>} />
      <Route path="/student/test-timetable" element={<ProtectedRoute allowedRoles={['student']}><DashboardLayout><StudentTimetable type="test" /></DashboardLayout></ProtectedRoute>} />
      <Route path="/student/classwork" element={<ProtectedRoute allowedRoles={['student']}><DashboardLayout><StudentClasswork /></DashboardLayout></ProtectedRoute>} />
      <Route path="/student/notifications" element={<ProtectedRoute allowedRoles={['student']}><DashboardLayout><StudentNotifications /></DashboardLayout></ProtectedRoute>} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to={getDefaultRedirect()} replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <AppRoutes />
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
