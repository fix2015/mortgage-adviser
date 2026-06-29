import { useState } from "react";
import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BarChart3, Users, CreditCard, FileCode, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { UsersList } from "@/components/admin/UsersList";
import { PaymentsList } from "@/components/admin/PaymentsList";
import { PromptsView } from "@/components/admin/PromptsView";
import { cn } from "@/utils/cn";
import { Header } from "@/components/layout/Header";

const tabs = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "users", label: "Users", icon: Users },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "prompts", label: "Prompts", icon: FileCode },
];

export function AdminPage() {
  const { user } = useAuth(); const [activeTab, setActiveTab] = useState("overview");
  if (user?.role !== "admin") return <Navigate to="/dashboard" replace />;
  return (
    <div className="min-h-screen bg-ds-bg-primary"><Header /><div className="pt-16"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-ds-accent-primary to-ds-accent-secondary"><Shield className="h-5 w-5 text-white" /></div><div><h1 className="text-2xl font-bold text-ds-text-primary">Admin Panel</h1><p className="text-sm text-ds-text-secondary">Manage users, payments, and AI prompts</p></div></div>
      <div className="flex gap-1 p-1 rounded-xl bg-ds-bg-secondary border border-ds-border-default mb-8 max-w-max">{tabs.map((tab) => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn("flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200", activeTab === tab.id ? "bg-ds-accent-primary/15 text-ds-text-accent border border-ds-accent-primary/20" : "text-ds-text-secondary hover:text-ds-text-primary hover:bg-ds-bg-surface")}><tab.icon className="h-4 w-4" />{tab.label}</button>))}</div>
      <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        {activeTab === "overview" && <AdminDashboard />}
        {activeTab === "users" && <UsersList />}
        {activeTab === "payments" && <PaymentsList />}
        {activeTab === "prompts" && <PromptsView />}
      </motion.div>
    </div></div></div>
  );
}
