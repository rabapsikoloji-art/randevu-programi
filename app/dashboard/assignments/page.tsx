
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { AssignmentsView } from "@/components/assignments/assignments-view";

export default async function AssignmentsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/signin");
  }

  if (session.user?.role === "CLIENT") {
    redirect("/client/appointments");
  }

  // Only psychologists and admins can access
  if (!["ADMINISTRATOR", "PSYCHOLOGIST"].includes(session.user?.role || "")) {
    redirect("/dashboard");
  }

  return (
    <DashboardLayout>
      <AssignmentsView />
    </DashboardLayout>
  );
}
