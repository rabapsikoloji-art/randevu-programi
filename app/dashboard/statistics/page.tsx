
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { StatisticsView } from "@/components/statistics/statistics-view";

export default async function StatisticsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  if (!["ADMINISTRATOR", "COORDINATOR"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  return <StatisticsView />;
}
