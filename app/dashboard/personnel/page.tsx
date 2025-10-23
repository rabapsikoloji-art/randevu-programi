
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { PersonnelView } from "@/components/personnel/personnel-view";

export default async function PersonnelPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/signin");
  }

  const userRole = session.user?.role as string;

  // Only administrators can access personnel management
  if (userRole !== "ADMINISTRATOR") {
    redirect("/dashboard");
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Personel
          </h1>
          <p className="text-gray-600 mt-1">
            Personel yönetimi ve çalışan kayıtları
          </p>
        </div>
        <PersonnelView userRole={userRole} />
      </div>
    </DashboardLayout>
  );
}
