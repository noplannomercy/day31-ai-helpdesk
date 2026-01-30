"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import type { UserRole } from "@/lib/types";

interface ProfileFormProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
}

const profileUpdateSchema = z.object({
  name: z.string().min(2, "이름은 최소 2자 이상이어야 합니다"),
});

const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "현재 비밀번호를 입력하세요"),
    newPassword: z
      .string()
      .min(8, "새 비밀번호는 최소 8자 이상이어야 합니다")
      .regex(/[A-Z]/, "비밀번호에 대문자가 포함되어야 합니다")
      .regex(/[a-z]/, "비밀번호에 소문자가 포함되어야 합니다")
      .regex(/[0-9]/, "비밀번호에 숫자가 포함되어야 합니다"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다",
    path: ["confirmPassword"],
  });

type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;

const roleLabels: Record<UserRole, string> = {
  customer: "고객",
  agent: "상담원",
  manager: "관리자",
  admin: "시스템 관리자",
};

export function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
  } = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      name: user.name,
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<PasswordChangeInput>({
    resolver: zodResolver(passwordChangeSchema),
  });

  const onProfileSubmit = async (data: ProfileUpdateInput) => {
    setIsUpdating(true);

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: data.name }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error("프로필 수정 실패", {
          description: result.error,
        });
        return;
      }

      toast.success("프로필이 수정되었습니다");
      router.refresh();
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("오류가 발생했습니다");
    } finally {
      setIsUpdating(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordChangeInput) => {
    setIsChangingPassword(true);

    try {
      const response = await fetch(`/api/users/${user.id}/password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error("비밀번호 변경 실패", {
          description: result.error,
        });
        return;
      }

      toast.success("비밀번호가 변경되었습니다");
      resetPassword();
    } catch (error) {
      console.error("Password change error:", error);
      toast.error("오류가 발생했습니다");
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <form onSubmit={handleSubmitProfile(onProfileSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">이메일</Label>
          <Input
            id="email"
            type="email"
            value={user.email}
            disabled
            className="bg-muted"
          />
          <p className="text-sm text-muted-foreground">
            이메일은 변경할 수 없습니다
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">역할</Label>
          <Input
            id="role"
            type="text"
            value={roleLabels[user.role]}
            disabled
            className="bg-muted"
          />
          <p className="text-sm text-muted-foreground">
            역할은 관리자만 변경할 수 있습니다
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">이름</Label>
          <Input
            id="name"
            type="text"
            disabled={isUpdating}
            {...registerProfile("name")}
          />
          {profileErrors.name && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{profileErrors.name.message}</span>
            </div>
          )}
        </div>

        <Button type="submit" disabled={isUpdating}>
          {isUpdating ? "수정 중..." : "프로필 수정"}
        </Button>
      </form>

      <Separator />

      {/* Password Change */}
      <form onSubmit={handleSubmitPassword(onPasswordSubmit)} className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">비밀번호 변경</h3>
          <p className="text-sm text-muted-foreground">
            비밀번호를 변경하려면 현재 비밀번호를 입력하세요
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="currentPassword">현재 비밀번호</Label>
          <Input
            id="currentPassword"
            type="password"
            disabled={isChangingPassword}
            {...registerPassword("currentPassword")}
          />
          {passwordErrors.currentPassword && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{passwordErrors.currentPassword.message}</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="newPassword">새 비밀번호</Label>
          <Input
            id="newPassword"
            type="password"
            disabled={isChangingPassword}
            {...registerPassword("newPassword")}
          />
          {passwordErrors.newPassword && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{passwordErrors.newPassword.message}</span>
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            최소 8자, 대문자, 소문자, 숫자 포함
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">새 비밀번호 확인</Label>
          <Input
            id="confirmPassword"
            type="password"
            disabled={isChangingPassword}
            {...registerPassword("confirmPassword")}
          />
          {passwordErrors.confirmPassword && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{passwordErrors.confirmPassword.message}</span>
            </div>
          )}
        </div>

        <Button type="submit" disabled={isChangingPassword}>
          {isChangingPassword ? "변경 중..." : "비밀번호 변경"}
        </Button>
      </form>
    </div>
  );
}
