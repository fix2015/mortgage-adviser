import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Menu, X, Home, LogOut, LayoutDashboard, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { cn } from "@/utils/cn";

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-ds-border-default/50 bg-ds-bg-primary/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-ds-accent-primary to-ds-accent-secondary shadow-lg shadow-ds-accent-primary/20 group-hover:shadow-ds-accent-primary/40 transition-shadow">
            <Home className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-ds-text-primary hidden sm:block">
            AI Mortgage Adviser
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {!isAuthenticated ? (
            <>
              <a href="#features" className="text-sm text-ds-text-secondary hover:text-ds-text-primary transition-colors">Features</a>
              <a href="#pricing" className="text-sm text-ds-text-secondary hover:text-ds-text-primary transition-colors">Pricing</a>
              <a href="#how-it-works" className="text-sm text-ds-text-secondary hover:text-ds-text-primary transition-colors">How It Works</a>
              <Link to="/login"><Button variant="ghost" size="sm">Sign In</Button></Link>
              <Link to="/register"><Button variant="glow" size="sm">Get Started</Button></Link>
            </>
          ) : (
            <>
              <Link to="/dashboard" className="text-sm text-ds-text-secondary hover:text-ds-text-primary transition-colors flex items-center gap-1.5">
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </Link>
              {user?.role === "admin" && (
                <Link to="/admin" className="text-sm text-ds-text-secondary hover:text-ds-text-primary transition-colors flex items-center gap-1.5">
                  <Shield className="h-4 w-4" /> Admin
                </Link>
              )}
              <div className="flex items-center gap-3 pl-3 border-l border-ds-border-default">
                <span className="text-sm text-ds-text-secondary">{user?.full_name}</span>
                <button onClick={handleLogout} className="rounded-lg p-2 text-ds-text-muted hover:text-ds-text-primary hover:bg-ds-bg-surface transition-colors" title="Sign out">
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </nav>

        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden rounded-lg p-2 text-ds-text-muted hover:text-ds-text-primary">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <motion.div
        initial={false}
        animate={{ height: mobileOpen ? "auto" : 0 }}
        className={cn("md:hidden overflow-hidden border-t border-ds-border-default bg-ds-bg-secondary")}
      >
        <div className="flex flex-col gap-2 p-4">
          {!isAuthenticated ? (
            <>
              <a href="#features" onClick={() => setMobileOpen(false)} className="px-3 py-2 text-sm text-ds-text-secondary hover:text-ds-text-primary">Features</a>
              <a href="#pricing" onClick={() => setMobileOpen(false)} className="px-3 py-2 text-sm text-ds-text-secondary hover:text-ds-text-primary">Pricing</a>
              <Link to="/login" onClick={() => setMobileOpen(false)}><Button variant="ghost" size="sm" className="w-full">Sign In</Button></Link>
              <Link to="/register" onClick={() => setMobileOpen(false)}><Button variant="glow" size="sm" className="w-full">Get Started</Button></Link>
            </>
          ) : (
            <>
              <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="px-3 py-2 text-sm text-ds-text-secondary hover:text-ds-text-primary flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </Link>
              {user?.role === "admin" && (
                <Link to="/admin" onClick={() => setMobileOpen(false)} className="px-3 py-2 text-sm text-ds-text-secondary hover:text-ds-text-primary flex items-center gap-2">
                  <Shield className="h-4 w-4" /> Admin
                </Link>
              )}
              <button onClick={handleLogout} className="px-3 py-2 text-sm text-ds-text-secondary hover:text-ds-text-primary flex items-center gap-2">
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </>
          )}
        </div>
      </motion.div>
    </header>
  );
}
