import { useState } from "react";
import { NavLink, Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Spinner } from "@/components/ui/Spinner";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { cn } from "@/utils/cn";
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  Download,
  Home,
  LogOut,
  Calculator,
  BarChart3,
  Settings,
  Truck,
  ShieldCheck,
  HeartPulse,
  FileSignature,
} from "lucide-react";

const sidebarLinks = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Overview", end: true },
  { to: "/dashboard/chat", icon: MessageSquare, label: "AI Chat", end: false },
  { to: "/dashboard/documents", icon: FileText, label: "Documents", end: false },
  { to: "/dashboard/calculator", icon: Calculator, label: "Calculator", end: false },
  { to: "/dashboard/compare", icon: BarChart3, label: "Compare Lenders", end: false },
  { to: "/dashboard/moving-costs", icon: Truck, label: "Moving Costs", end: false },
  { to: "/dashboard/predictions", icon: ShieldCheck, label: "Predictions", end: false },
  { to: "/dashboard/health-check", icon: HeartPulse, label: "Health Check", end: false },
  { to: "/dashboard/reference", icon: FileSignature, label: "Reference Letter", end: false },
  { to: "/dashboard/strategy", icon: Download, label: "Strategy", end: false },
  { to: "/dashboard/settings", icon: Settings, label: "Settings", end: false },
];

export function DashboardLayout() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);

  const showOnboarding = user && !user.onboarding_completed && !onboardingDismissed;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-ds-bg-primary">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-ds-bg-primary">
      {showOnboarding && (
        <OnboardingWizard onComplete={() => setOnboardingDismissed(true)} />
      )}

      <aside className="hidden lg:flex flex-col w-64 border-r border-ds-border-default bg-ds-bg-secondary">
        <div className="flex items-center gap-2.5 px-6 py-5 border-b border-ds-border-default">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-ds-accent-primary to-ds-accent-secondary">
            <Home className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-ds-text-primary">AI Mortgage</span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {sidebarLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-ds-accent-primary/15 text-ds-text-accent border border-ds-accent-primary/20"
                    : "text-ds-text-secondary hover:text-ds-text-primary hover:bg-ds-bg-surface"
                )
              }
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-ds-border-default">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ds-bg-surface text-sm font-medium text-ds-text-accent">
              {user?.full_name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ds-text-primary truncate">{user?.full_name}</p>
              <p className="text-xs text-ds-text-muted truncate">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="rounded-lg p-1.5 text-ds-text-muted hover:text-ds-text-primary hover:bg-ds-bg-surface transition-colors"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
          <p className="text-[10px] text-ds-text-muted text-center mt-2">v{__APP_VERSION__}</p>
        </div>
      </aside>

      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
