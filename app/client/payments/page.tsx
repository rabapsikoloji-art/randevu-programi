
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { ClientPayments } from "@/components/client/client-payments";

export default async function ClientPaymentsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/signin");
  }

  if (session.user?.role !== "CLIENT") {
    redirect("/dashboard");
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Ödemelerim
          </h1>
          <p className="text-gray-600 mt-1">
            Ödeme geçmişinizi ve bekleyen ödemelerinizi görüntüleyin
          </p>
        </div>
        <ClientPayments />
      </div>
    </DashboardLayout>
  );
}
