import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Navbar from "./components/Navbar";
import ParticleBackground from "./components/ParticleBackground";
import { ToastProvider } from "./components/Toast";
import Auth from "./pages/Auth";
import Feed from "./pages/Feed";
import ProjectDetail from "./pages/ProjectDetail";
import Profile from "./pages/Profile";
import CreateProject from "./pages/CreateProject";
import Requests from "./pages/Requests";
import Connections from "./pages/Connections";
import { useAuth } from "./context/AuthContext";

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) {
    return <Navigate to="/feed" replace />;
  }
  return children;
}

function AppRoutes() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const hideNav = location.pathname === "/auth";

  return (
    <>
      {!hideNav && <Navbar />}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Navigate to="/feed" replace />} />
          <Route path="/auth" element={isAuthenticated ? <Navigate to="/feed" replace /> : <Auth />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/project/:id" element={<ProjectDetail />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create"
            element={
              <ProtectedRoute>
                <CreateProject />
              </ProtectedRoute>
            }
          />
          <Route
            path="/requests"
            element={
              <ProtectedRoute>
                <Requests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/connections"
            element={
              <ProtectedRoute>
                <Connections />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/feed" replace />} />
        </Routes>
      </AnimatePresence>
    </>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <ParticleBackground />
      <AppRoutes />
    </ToastProvider>
  );
}
