import { useQuery } from "@tanstack/react-query";
import { getAdminUsers } from "@/api/admin";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { formatDate } from "@/utils/format";

export function UsersList() {
  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: getAdminUsers,
  });

  if (isLoading) return <Spinner className="py-12" />;

  return (
    <div className="overflow-x-auto rounded-xl border border-ds-border-default">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-ds-border-default bg-ds-bg-surface/50">
            <th className="px-4 py-3 text-left text-xs font-medium text-ds-text-muted">Name</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-ds-text-muted">Email</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-ds-text-muted">Role</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-ds-text-muted">Paid</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-ds-text-muted">Questions</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-ds-text-muted">Docs</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-ds-text-muted">Joined</th>
          </tr>
        </thead>
        <tbody>
          {users?.map((user) => (
            <tr key={user.id} className="border-b border-ds-border-default/50 hover:bg-ds-bg-surface/30 transition-colors">
              <td className="px-4 py-3 text-ds-text-primary font-medium">{user.full_name || "N/A"}</td>
              <td className="px-4 py-3 text-ds-text-secondary">{user.email}</td>
              <td className="px-4 py-3">
                <Badge variant={user.role === "admin" ? "accent" : "default"}>{user.role}</Badge>
              </td>
              <td className="px-4 py-3">
                <Badge variant={user.has_paid ? "success" : "default"}>
                  {user.has_paid ? "Yes" : "No"}
                </Badge>
              </td>
              <td className="px-4 py-3 text-ds-text-secondary">{user.questions_remaining}</td>
              <td className="px-4 py-3 text-ds-text-secondary">{user.total_documents}</td>
              <td className="px-4 py-3 text-ds-text-muted">{formatDate(user.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
