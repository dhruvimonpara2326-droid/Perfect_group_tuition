import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import Sidebar from './components/Sidebar';

// Auth
import AdminLogin from './pages/Login';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageStudents from './pages/admin/ManageStudents';
import ManageFaculty from './pages/admin/ManageFaculty';
import ManageBatches from './pages/admin/ManageBatches';
import ManageAttendance from './pages/admin/ManageAttendance';
import ManageMarks from './pages/admin/ManageMarks';
import ManageFees from './pages/admin/ManageFees';
import ManageTimetable from './pages/admin/ManageTimetable';
import ManageTestTimetable from './pages/admin/ManageTestTimetable';
import ManageClasswork from './pages/admin/ManageClasswork';
import ManageNotifications from './pages/admin/ManageNotifications';

import './index.css';

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content-area">
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} pageTitle="Admin Panel" />
        <div className="page-content">{children}</div>
      </div>
    </div>
  );
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public: Login */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/admin" replace /> : <AdminLogin />}
      />

      {/* Admin routes */}
      <Route path="/admin" element={<ProtectedRoute><DashboardLayout><AdminDashboard /></DashboardLayout></ProtectedRoute>} />
      <Route path="/admin/students" element={<ProtectedRoute><DashboardLayout><ManageStudents /></DashboardLayout></ProtectedRoute>} />
      <Route path="/admin/faculty" element={<ProtectedRoute><DashboardLayout><ManageFaculty /></DashboardLayout></ProtectedRoute>} />
      <Route path="/admin/batches" element={<ProtectedRoute><DashboardLayout><ManageBatches /></DashboardLayout></ProtectedRoute>} />
      <Route path="/admin/attendance" element={<ProtectedRoute><DashboardLayout><ManageAttendance /></DashboardLayout></ProtectedRoute>} />
      <Route path="/admin/marks" element={<ProtectedRoute><DashboardLayout><ManageMarks /></DashboardLayout></ProtectedRoute>} />
      <Route path="/admin/fees" element={<ProtectedRoute><DashboardLayout><ManageFees /></DashboardLayout></ProtectedRoute>} />
      <Route path="/admin/timetable" element={<ProtectedRoute><DashboardLayout><ManageTimetable key="lecture-tt" /></DashboardLayout></ProtectedRoute>} />
      <Route path="/admin/test-timetable" element={<ProtectedRoute><DashboardLayout><ManageTestTimetable key="test-tt" /></DashboardLayout></ProtectedRoute>} />
      <Route path="/admin/classwork" element={<ProtectedRoute><DashboardLayout><ManageClasswork /></DashboardLayout></ProtectedRoute>} />
      <Route path="/admin/notifications" element={<ProtectedRoute><DashboardLayout><ManageNotifications /></DashboardLayout></ProtectedRoute>} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to={isAuthenticated ? '/admin' : '/login'} replace />} />
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
