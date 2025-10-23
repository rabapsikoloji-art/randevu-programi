
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { BookAppointment } from "@/components/client/book-appointment";

export default async function BookAppointmentPage() {
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
            Randevu Al
          </h1>
          <p className="text-gray-600 mt-1">
            Psikolog seçip randevu oluşturabilirsiniz
          </p>
        </div>
        <BookAppointment />
      </div>
    </DashboardLayout>
  );
}
