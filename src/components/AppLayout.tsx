import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  AlertTriangle,
  CheckSquare,
  Users,
  Settings,
  Bell,
  LogOut,
} from "lucide-react";
import logo from "@/assets/logo.jpg";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Projects", icon: FolderKanban, path: "/projects" },
  { label: "Reports", icon: FileText, path: "/reports" },
  { label: "Issues", icon: AlertTriangle, path: "/issues" },
  { label: "Approvals", icon: CheckSquare, path: "/approvals" },
  { label: "Team", icon: Users, path: "/team" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

export function AppSidebar() {
  const location = useLocation();
  const { profile, role, signOut } = useAuth();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-card border-r h-screen sticky top-0">
      <div className="p-5 border-b">
        <img src={logo} alt="BuildTrust" className="h-10 object-contain" />
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const active = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
            {profile?.avatar_initials || "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{profile?.full_name || "User"}</p>
            <p className="text-xs text-muted-foreground truncate capitalize">{role?.replace("-", " ") || "User"}</p>
          </div>
          <button onClick={signOut} className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="Sign out">
            <LogOut className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </aside>
  );
}

export function MobileBottomNav() {
  const location = useLocation();
  const mobileItems = navItems.slice(0, 5);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-card border-t safe-area-bottom">
      <div className="flex items-center justify-around py-2">
        {mobileItems.map((item) => {
          const active = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1 text-xs font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function TopBar() {
  const { profile } = useAuth();
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-card px-4 py-3 lg:px-6">
      <div className="lg:hidden">
        <img src={logo} alt="BuildTrust" className="h-8 object-contain" />
      </div>
      <div className="hidden lg:block">
        <h2 className="text-lg font-display font-bold">{profile?.company || "BuildTrust"}</h2>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-accent" />
        </button>
        <div className="lg:hidden flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
          {profile?.avatar_initials || "U"}
        </div>
      </div>
    </header>
  );
}
