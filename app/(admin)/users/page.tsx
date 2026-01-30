import { UserManagement } from "@/components/admin/user-management";

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">사용자 관리</h2>
        <p className="text-muted-foreground">
          모든 사용자를 관리하고 새 사용자를 생성할 수 있습니다
        </p>
      </div>
      <UserManagement />
    </div>
  );
}
