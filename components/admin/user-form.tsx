"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { userCreateSchema, type UserCreateInput } from "@/lib/validations";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import type { User } from "@/lib/db/schema";

interface UserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: Omit<User, "passwordHash"> | null;
  onSuccess: () => void;
}

export function UserForm({ open, onOpenChange, user, onSuccess }: UserFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!user;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<UserCreateInput>({
    resolver: zodResolver(userCreateSchema),
    defaultValues: {
      role: "customer",
    },
  });

  const selectedRole = watch("role");

  useEffect(() => {
    if (user) {
      setValue("email", user.email);
      setValue("name", user.name);
      setValue("role", user.role);
      setValue("password", ""); // Don't populate password for editing
    } else {
      reset({
        email: "",
        name: "",
        password: "",
        role: "customer",
      });
    }
  }, [user, setValue, reset]);

  const onSubmit = async (data: UserCreateInput) => {
    setIsLoading(true);

    try {
      if (isEditing) {
        // Update user (only name and role, not password)
        const response = await fetch(`/api/users/${user.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: data.name,
            role: data.role,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          toast.error("사용자 수정 실패", {
            description: result.error,
          });
          return;
        }

        toast.success("사용자가 수정되었습니다");
      } else {
        // Create new user
        const response = await fetch("/api/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          toast.error("사용자 생성 실패", {
            description: result.error,
          });
          return;
        }

        toast.success("사용자가 생성되었습니다");
      }

      onSuccess();
      reset();
    } catch (error) {
      console.error("Form submit error:", error);
      toast.error("오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "사용자 수정" : "새 사용자 추가"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "사용자 정보를 수정합니다"
              : "새로운 사용자를 생성합니다"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">이름</Label>
            <Input
              id="name"
              type="text"
              placeholder="홍길동"
              disabled={isLoading}
              {...register("name")}
            />
            {errors.name && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.name.message}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              disabled={isLoading || isEditing}
              {...register("email")}
            />
            {errors.email && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.email.message}</span>
              </div>
            )}
            {isEditing && (
              <p className="text-sm text-muted-foreground">
                이메일은 수정할 수 없습니다
              </p>
            )}
          </div>

          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                disabled={isLoading}
                {...register("password")}
              />
              {errors.password && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.password.message}</span>
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                최소 8자, 대문자, 소문자, 숫자 포함
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="role">역할</Label>
            <Select
              value={selectedRole}
              onValueChange={(value) => setValue("role", value as any)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="역할 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="customer">고객</SelectItem>
                <SelectItem value="agent">상담원</SelectItem>
                <SelectItem value="manager">관리자</SelectItem>
                <SelectItem value="admin">시스템 관리자</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.role.message}</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              취소
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "처리 중..." : isEditing ? "수정" : "생성"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
