import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import { ToastProvider } from "./components/Toast";
import AdminDashboard from "./pages/AdminDashboard";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import OwnerDashboard from "./pages/OwnerDashboard";
import UserDashboard from "./pages/UserDashboard";
import "./styles/theme.css";

function App() {
  useEffect(() => {
    document.title = "ParkNest";
  }, []);
  return (
    <ToastProvider>
      <div className="app-shell">
        <Navbar />
        <main className="app-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/dashboard/user" element={<UserDashboard />} />
            <Route path="/dashboard/owner" element={<OwnerDashboard />} />
            <Route path="/dashboard/admin" element={<AdminDashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </ToastProvider>
  );
}

export default App;