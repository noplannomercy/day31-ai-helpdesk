import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile/profile-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">내 프로필</h1>
        <p className="text-muted-foreground">
          개인 정보를 확인하고 수정할 수 있습니다
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>계정 정보</CardTitle>
          <CardDescription>
            이름과 비밀번호를 변경할 수 있습니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm user={session.user} />
        </CardContent>
      </Card>
    </div>
  );
}
