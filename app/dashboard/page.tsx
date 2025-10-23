
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { RecentAppointments } from "@/components/dashboard/recent-appointments";
import { QuickActions } from "@/components/dashboard/quick-actions";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/signin");
  }

  const userRole = session.user?.role as string;
  const isClient = userRole === "CLIENT";

  if (isClient) {
    redirect("/client/appointments");
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Genel Bakış
          </h1>
          <p className="text-gray-600 mt-1">
            Klinik faaliyetlerinizin özeti ve son durumlar
          </p>
        </div>

        {/* Stats Cards */}
        <DashboardStats userRole={userRole} />

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Appointments */}
          <div className="lg:col-span-2">
            <RecentAppointments userRole={userRole} />
          </div>

          {/* Quick Actions */}
          <div>
            <QuickActions userRole={userRole} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
