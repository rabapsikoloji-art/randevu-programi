
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { ServicesView } from "@/components/services/services-view";

export default async function ServicesPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/signin");
  }

  const userRole = session.user?.role as string;

  // Only administrators and coordinators can access services management
  if (!["ADMINISTRATOR", "COORDINATOR"].includes(userRole)) {
    redirect("/dashboard");
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Hizmetler
          </h1>
          <p className="text-gray-600 mt-1">
            Hizmet yönetimi ve terapi seansları
          </p>
        </div>
        <ServicesView userRole={userRole} />
      </div>
    </DashboardLayout>
  );
}
