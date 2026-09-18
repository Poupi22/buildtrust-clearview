import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  AlertTriangle,
  CheckSquare,
  CalendarRange,
  Gauge,
  Users,
  Settings,
  LogOut,
} from "lucide-react";
import logo from "@/assets/logo.jpg";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationBell } from "@/components/NotificationBell";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const navItems = [
  { key: "dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { key: "projects", icon: FolderKanban, path: "/projects" },
  { key: "planning", icon: CalendarRange, path: "/planning" },
  { key: "reports", icon: FileText, path: "/reports" },
  { key: "compliance", icon: Gauge, path: "/compliance" },
  { key: "issues", icon: AlertTriangle, path: "/issues" },
  { key: "approvals", icon: CheckSquare, path: "/approvals" },
  { key: "team", icon: Users, path: "/team" },
  { key: "settings", icon: Settings, path: "/settings" },
];

export function AppSidebar() {
  const location = useLocation();
  const { profile, role, signOut } = useAuth();
  const { t } = useTranslation();

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
              {t(`nav.${item.key}`)}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
            {profile?.avatar_initials || "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{profile?.full_name || "User"}</p>
            <p className="text-xs text-muted-foreground truncate capitalize">{role?.replace("-", " ") || "User"}</p>
          </div>
          <button onClick={signOut} className="p-1.5 rounded-lg hover:bg-muted transition-colors" title={t("common.signOut")}>
            <LogOut className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <LanguageSwitcher compact />
      </div>
    </aside>
  );
}

export function MobileBottomNav() {
  const location = useLocation();
  const { t } = useTranslation();
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
              <span>{t(`nav.${item.key}`)}</span>
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
        <LanguageSwitcher compact />
        <NotificationBell />
        <div className="lg:hidden flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
          {profile?.avatar_initials || "U"}
        </div>
      </div>
    </header>
  );
}
