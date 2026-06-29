import { useQuery } from "@tanstack/react-query";
import { getAdminPayments } from "@/api/admin";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { formatCurrency, formatDateTime } from "@/utils/format";

export function PaymentsList() {
  const { data: payments, isLoading } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: getAdminPayments,
  });

  if (isLoading) return <Spinner className="py-12" />;

  return (
    <div className="overflow-x-auto rounded-xl border border-ds-border-default">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-ds-border-default bg-ds-bg-surface/50">
            <th className="px-4 py-3 text-left text-xs font-medium text-ds-text-muted">User</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-ds-text-muted">Amount</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-ds-text-muted">Type</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-ds-text-muted">Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-ds-text-muted">Date</th>
          </tr>
        </thead>
        <tbody>
          {payments?.map((payment) => (
            <tr key={payment.id} className="border-b border-ds-border-default/50 hover:bg-ds-bg-surface/30 transition-colors">
              <td className="px-4 py-3 text-ds-text-primary">{payment.user_email}</td>
              <td className="px-4 py-3 text-ds-text-primary font-medium">{formatCurrency(payment.amount)}</td>
              <td className="px-4 py-3">
                <Badge variant={payment.type === "consultation" ? "accent" : "default"}>
                  {payment.type === "consultation" ? "Consultation" : "Extra Questions"}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <Badge variant={payment.status === "succeeded" ? "success" : payment.status === "failed" ? "error" : "warning"}>
                  {payment.status}
                </Badge>
              </td>
              <td className="px-4 py-3 text-ds-text-muted">{formatDateTime(payment.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
