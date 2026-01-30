"use client";

import { useState, useEffect } from "react";
import { UserTable } from "./user-table";
import { UserForm } from "./user-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import type { User } from "@/lib/db/schema";

export function UserManagement() {
  const [users, setUsers] = useState<Omit<User, "passwordHash">[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Omit<User, "passwordHash"> | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: "10",
      });

      if (search) {
        params.set("search", search);
      }
      if (roleFilter !== "all") {
        params.set("role", roleFilter);
      }

      const response = await fetch(`/api/users?${params}`);
      const result = await response.json();

      if (response.ok) {
        setUsers(result.data);
        setTotalPages(result.pagination.totalPages);
      } else {
        toast.error("사용자 목록 조회 실패", {
          description: result.error,
        });
      }
    } catch (error) {
      console.error("Fetch users error:", error);
      toast.error("오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, search, roleFilter]);

  const handleCreate = () => {
    setEditingUser(null);
    setIsFormOpen(true);
  };

  const handleEdit = (user: Omit<User, "passwordHash">) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("정말 이 사용자를 삭제하시겠습니까?")) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("사용자가 삭제되었습니다");
        fetchUsers();
      } else {
        toast.error("삭제 실패", {
          description: result.error,
        });
      }
    } catch (error) {
      console.error("Delete user error:", error);
      toast.error("오류가 발생했습니다");
    }
  };

  const handleToggleStatus = async (userId: string, isOnline: boolean, isAway: boolean) => {
    try {
      const response = await fetch(`/api/users/${userId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isOnline, isAway }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("상태가 변경되었습니다");
        fetchUsers();
      } else {
        toast.error("상태 변경 실패", {
          description: result.error,
        });
      }
    } catch (error) {
      console.error("Toggle status error:", error);
      toast.error("오류가 발생했습니다");
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingUser(null);
    fetchUsers();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="이름 또는 이메일 검색..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
          <Select value={roleFilter} onValueChange={(value) => {
            setRoleFilter(value);
            setPage(1);
          }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="역할 필터" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 역할</SelectItem>
              <SelectItem value="customer">고객</SelectItem>
              <SelectItem value="agent">상담원</SelectItem>
              <SelectItem value="manager">관리자</SelectItem>
              <SelectItem value="admin">시스템 관리자</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          사용자 추가
        </Button>
      </div>

      <UserTable
        users={users}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            이전
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            다음
          </Button>
        </div>
      )}

      <UserForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        user={editingUser}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
