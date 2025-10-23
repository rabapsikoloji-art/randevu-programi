
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { CashRegisterView } from "@/components/cash-register/cash-register-view";

export default async function CashRegisterPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/signin");
  }

  const userRole = session.user?.role as string;

  // Only administrators and coordinators can access financial data
  if (!["ADMINISTRATOR", "COORDINATOR"].includes(userRole)) {
    redirect("/dashboard");
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Kasa
          </h1>
          <p className="text-gray-600 mt-1">
            Gelir-gider takibi ve finansal yönetim
          </p>
        </div>
        <CashRegisterView userRole={userRole} />
      </div>
    </DashboardLayout>
  );
}
