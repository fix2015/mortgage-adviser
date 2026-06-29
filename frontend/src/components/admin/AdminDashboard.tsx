import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Users, CreditCard, PoundSterling, Activity } from "lucide-react";
import { getAdminStats } from "@/api/admin";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { formatCurrency } from "@/utils/format";

const statCards = [
  { key: "total_users" as const, label: "Total Users", icon: Users, format: (v: number) => v.toLocaleString() },
  { key: "total_payments" as const, label: "Total Payments", icon: CreditCard, format: (v: number) => v.toLocaleString() },
  { key: "total_revenue" as const, label: "Total Revenue", icon: PoundSterling, format: (v: number) => formatCurrency(v) },
  { key: "active_sessions" as const, label: "Active Sessions", icon: Activity, format: (v: number) => v.toLocaleString() },
];

export function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: getAdminStats,
  });

  if (isLoading) return <Spinner className="py-12" />;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((card, i) => (
        <motion.div
          key={card.key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <Card className="hover:border-ds-border-strong transition-colors">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ds-accent-primary/10 border border-ds-accent-primary/20">
                <card.icon className="h-5 w-5 text-ds-text-accent" />
              </div>
              <div>
                <p className="text-xs text-ds-text-muted">{card.label}</p>
                <p className="text-2xl font-bold text-ds-text-primary">
                  {stats ? card.format(stats[card.key]) : "—"}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
