import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RootLayout } from "./components/RootLayout";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Reports from "./pages/Reports";
import Issues from "./pages/Issues";
import Approvals from "./pages/Approvals";
import Team, { SettingsPage } from "./pages/Team";
import NotFound from "./pages/NotFound";
import ClientPortal from "./pages/ClientPortal";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<RootLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/issues" element={<Issues />} />
            <Route path="/approvals" element={<Approvals />} />
            <Route path="/team" element={<Team />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="/portal" element={<ClientPortal />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
