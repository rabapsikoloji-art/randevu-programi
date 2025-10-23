
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { ClientAppointments } from "@/components/client/client-appointments";
import { ClientAssignments } from "@/components/client/client-assignments";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function ClientAppointmentsPage() {
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
            Danışan Panelim
          </h1>
          <p className="text-gray-600 mt-1">
            Randevularınız ve ödevlerinizi görüntüleyin
          </p>
        </div>

        <Tabs defaultValue="appointments" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="appointments">Randevularım</TabsTrigger>
            <TabsTrigger value="assignments">Ödevlerim</TabsTrigger>
          </TabsList>
          <TabsContent value="appointments" className="mt-6">
            <ClientAppointments />
          </TabsContent>
          <TabsContent value="assignments" className="mt-6">
            <ClientAssignments />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
