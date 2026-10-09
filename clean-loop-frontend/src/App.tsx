import type { ReactNode } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import Layout from "./components/Layout";
import { Loading } from "./components/ui";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import WasteGuide from "./pages/WasteGuide";
import Facilities from "./pages/Facilities";
import NewComplaint from "./pages/NewComplaint";
import ComplaintList from "./pages/ComplaintList";
import ComplaintDetail from "./pages/ComplaintDetail";
import Analytics from "./pages/Analytics";

function Protected({ children, staff = false }: { children: ReactNode; staff?: boolean }) {
  const { user, loading, isStaff } = useAuth();
  const loc = useLocation();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  if (staff && !isStaff) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  const { user, loading } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={loading ? <Loading /> : user ? <Navigate to="/" replace /> : <Login />} />
      <Route
        element={
          <Protected>
            <Layout />
          </Protected>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="waste-guide" element={<WasteGuide />} />
        <Route path="facilities" element={<Facilities />} />
        <Route path="complaints/new" element={<NewComplaint />} />
        <Route path="complaints/mine" element={<ComplaintList mode="mine" />} />
        <Route path="complaints/:id" element={<ComplaintDetail />} />
        <Route
          path="manage/complaints"
          element={
            <Protected staff>
              <ComplaintList mode="all" />
            </Protected>
          }
        />
        <Route
          path="manage/analytics"
          element={
            <Protected staff>
              <Analytics />
            </Protected>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
