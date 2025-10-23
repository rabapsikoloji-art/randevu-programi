
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { CalendarView } from "@/components/calendar/calendar-view";
import { CalendarHeader } from "@/components/calendar/calendar-header";

export default async function CalendarPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/signin");
  }

  const userRole = session.user?.role as string;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <CalendarHeader userRole={userRole} />
        <CalendarView userRole={userRole} />
      </div>
    </DashboardLayout>
  );
}
