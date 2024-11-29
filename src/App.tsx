// src/App.tsx

import React, { Suspense, lazy, useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useLocation,
} from "react-router-dom";
import NavigationBar from "./components/NavigationBar";
import Footer from "./components/Footer";
import Sidebar from "./components/Sidebar";
import { RoleProvider } from "./context/RoleContext";
import { ThemeProvider } from "./components/theme-provider"; // Import ThemeProvider
import "./styles/App.css";
import "./index.css";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
// Lazy-loaded pages
const MainPage = lazy(() => import("./pages/common/MainPage"));
const LoginPage = lazy(() => import("./pages/common/LoginPage"));
const ProfilePage = lazy(() => import("./pages/common/ProfilePage"));
const FacilitiesBooking = lazy(
  () => import("./pages/common/FacilitiesBooking")
);
const Appointment = lazy(() => import("./pages/common/Appointment"));
const Chatbot = lazy(() => import("./pages/common/Chatbot"));
const HelpPage = lazy(() => import("./pages/common/HelpPage"));
const NotificationsPage = lazy(
  () => import("./pages/common/NotificationsPage")
);
const ChatPage = lazy(() => import("./pages/chat/ChatPage")); // Added ChatPage import

// Admin Pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminForms = lazy(() => import("./pages/admin/AdminForms"));
const SystemSettings = lazy(() => import("./pages/admin/SystemSettings"));
const UserManagement = lazy(() => import("./pages/admin/UserManagement"));
const AdminFacilitiesAndAppointments = lazy(
  () => import("./pages/admin/AdminFacilitiesAndAppointments")
);

// Faculty Pages
const FacultyDashboard = lazy(() => import("./pages/faculty/FacultyDashboard"));
const FacultyForms = lazy(() => import("./pages/faculty/FacultyForms"));
const DocumentManagement = lazy(
  () => import("./pages/faculty/DocumentManagement")
);
const AppointmentManagement = lazy(
  () => import("./pages/faculty/AppointmentManagement")
);

// Student Pages
const StudentDashboard = lazy(() =>
  import("./pages/student/StudentDashboard").then((module) => ({
    default: module.default,
  }))
);
const StudentForms = lazy(() => import("./pages/student/StudentForms"));
const DocumentsAccess = lazy(() => import("./pages/student/DocumentsAccess"));

const NotFound = () => (
  <div className="not-found">
    <h2>404 - Page Not Found</h2>
    <p>The page you are looking for does not exist.</p>
  </div>
);

const AppContent: React.FC = () => {
  const [, setUserRole] = useState<string | null>(
    localStorage.getItem("userRole")
  );

  const { user, loading } = useAuth();
  const location = useLocation();
  const userRole = user?.role || null;

  useEffect(() => {
    if (userRole) {
      localStorage.setItem("userRole", userRole);
    } else {
      localStorage.removeItem("userRole");
    }
  }, [userRole]);

  const hideSidebarRoutes = ["/", "/main", "/login"];
  const shouldHideSidebar = hideSidebarRoutes.includes(location.pathname);

  return (
    <div className="app">
      <NavigationBar isAuthenticated={!!user && !shouldHideSidebar} />
      {userRole && !shouldHideSidebar && <Sidebar userRole={userRole} />}
      <main
        className={`app-content ${
          userRole && !shouldHideSidebar ? "with-sidebar" : ""
        }`}
      >
        <Suspense fallback={<div className="loading">Loading...</div>}>
          <Routes>
            <Route path="/main" element={<MainPage />} />
            <Route path="/" element={<MainPage />} />
            <Route
              path="/login"
              element={<LoginPage setUserRole={setUserRole} />}
            />
            <Route
              path="/profile"
              element={userRole ? <ProfilePage /> : <Navigate to="/login" />}
            />

            {/* Common Pages */}
            <Route
              path="/facilities-booking"
              element={
                userRole ? <FacilitiesBooking /> : <Navigate to="/login" />
              }
            />
            <Route
              path="/appointment"
              element={userRole ? <Appointment /> : <Navigate to="/login" />}
            />
            <Route
              path="/chat"
              element={userRole ? <ChatPage /> : <Navigate to="/login" />} // Added ChatPage route
            />
            <Route
              path="/chatbot"
              element={userRole ? <Chatbot /> : <Navigate to="/login" />}
            />
            <Route
              path="/help"
              element={userRole ? <HelpPage /> : <Navigate to="/login" />}
            />
            <Route
              path="/notifications"
              element={
                userRole ? <NotificationsPage /> : <Navigate to="/login" />
              }
            />

            {/* Student-Only Pages */}
            {userRole === "student" && (
              <>
                <Route
                  path="/student-dashboard"
                  element={<StudentDashboard />}
                />
                <Route path="/documents-access" element={<DocumentsAccess />} />
                <Route path="/student-forms" element={<StudentForms />} />
              </>
            )}

            {/* Faculty-Only Pages */}
            {userRole === "faculty" && (
              <>
                <Route
                  path="/faculty-dashboard"
                  element={<FacultyDashboard />}
                />
                <Route
                  path="/document-management"
                  element={<DocumentManagement />}
                />
                <Route path="/faculty-forms" element={<FacultyForms />} />
                <Route
                  path="/appointment-management"
                  element={<AppointmentManagement />}
                />
              </>
            )}

            {/* Admin-Only Pages */}
            {userRole === "admin" && (
              <>
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                <Route path="/admin-forms" element={<AdminForms />} />
                <Route path="/system-settings" element={<SystemSettings />} />
                <Route path="/user-management" element={<UserManagement />} />
                <Route
                  path="/admin-facilities-appointments"
                  element={<AdminFacilitiesAndAppointments />}
                />
              </>
            )}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        <ToastContainer />
      </main>
      <Footer />
    </div>
  );
};

const App: React.FC = () => (
  <RoleProvider>
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  </RoleProvider>
);

export default function AppWrapper() {
  return (
    <Router>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <App />
      </ThemeProvider>
    </Router>
  );
}
