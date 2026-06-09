import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { RootLayout } from "./components/RootLayout";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Reports from "./pages/Reports";
import Issues from "./pages/Issues";
import Approvals from "./pages/Approvals";
import Team from "./pages/Team";
import Settings from "./pages/Settings";
import Manual from "./pages/Manual";
import NotFound from "./pages/NotFound";
import ClientPortal from "./pages/ClientPortal";
import TechnicianPortal from "./pages/TechnicianPortal";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import { Loader2 } from "lucide-react";


const queryClient = new QueryClient();

function AppRoutes() {
  const { session, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not logged in
  if (!session) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Client role → portal only
  if (role === "client") {
    return (
      <Routes>
        <Route path="/portal" element={<ClientPortal />} />
        <Route path="/settings" element={<ClientPortal />} />
        <Route path="/manual" element={<ClientPortal />} />
        <Route path="*" element={<Navigate to="/portal" replace />} />
      </Routes>
    );
  }

  // Technician role → field portal + settings
  if (role === "technician") {
    return (
      <Routes>
        <Route path="/technician" element={<TechnicianPortal />} />
        <Route path="/settings" element={<TechnicianPortal />} />
        <Route path="/manual" element={<TechnicianPortal />} />
        <Route path="*" element={<Navigate to="/technician" replace />} />
      </Routes>
    );
  }


  // Admin / Engineer / Super-admin → full dashboard
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/issues" element={<Issues />} />
        <Route path="/approvals" element={<Approvals />} />
        <Route path="/team" element={<Team />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/manual" element={<Manual />} />
      </Route>
      <Route path="/portal" element={<ClientPortal />} />
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
