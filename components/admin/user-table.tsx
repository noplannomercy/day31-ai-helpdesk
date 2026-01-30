"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Circle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import type { User } from "@/lib/db/schema";
import type { UserRole } from "@/lib/types";

interface UserTableProps {
  users: Omit<User, "passwordHash">[];
  isLoading: boolean;
  onEdit: (user: Omit<User, "passwordHash">) => void;
  onDelete: (userId: string) => void;
  onToggleStatus: (userId: string, isOnline: boolean, isAway: boolean) => void;
}

const roleLabels: Record<UserRole, string> = {
  customer: "고객",
  agent: "상담원",
  manager: "관리자",
  admin: "시스템 관리자",
};

const roleColors: Record<UserRole, string> = {
  customer: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  agent: "bg-green-500/10 text-green-700 dark:text-green-400",
  manager: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  admin: "bg-red-500/10 text-red-700 dark:text-red-400",
};

export function UserTable({ users, isLoading, onEdit, onDelete, onToggleStatus }: UserTableProps) {
  if (isLoading) {
    return (
      <div className="border rounded-lg">
        <div className="divide-y">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 flex items-center gap-4">
              <div className="h-10 w-48 bg-muted animate-pulse rounded" />
              <div className="h-10 w-64 bg-muted animate-pulse rounded" />
              <div className="h-6 w-20 bg-muted animate-pulse rounded" />
              <div className="h-6 w-16 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="border border-dashed rounded-lg p-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
          <Circle className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">사용자가 없습니다</h3>
        <p className="text-sm text-muted-foreground">
          검색 조건을 변경하거나 새 사용자를 추가하세요.
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>이름</TableHead>
            <TableHead>이메일</TableHead>
            <TableHead>역할</TableHead>
            <TableHead>상태</TableHead>
            <TableHead>가입일</TableHead>
            <TableHead className="text-right">작업</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Badge variant="outline" className={roleColors[user.role]}>
                  {roleLabels[user.role]}
                </Badge>
              </TableCell>
              <TableCell>
                {user.role === "agent" || user.role === "manager" ? (
                  <button
                    onClick={() => onToggleStatus(user.id, !user.isOnline, user.isAway)}
                    className="flex items-center gap-2 text-sm hover:opacity-80 transition-opacity"
                  >
                    <Circle
                      className={`h-3 w-3 ${
                        user.isOnline
                          ? user.isAway
                            ? "fill-yellow-500 text-yellow-500"
                            : "fill-green-500 text-green-500"
                          : "fill-gray-400 text-gray-400"
                      }`}
                    />
                    <span>
                      {user.isOnline
                        ? user.isAway
                          ? "부재중"
                          : "온라인"
                        : "오프라인"}
                    </span>
                  </button>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(user.createdAt), {
                  addSuffix: true,
                  locale: ko,
                })}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(user)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(user.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
