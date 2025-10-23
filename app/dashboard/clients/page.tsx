
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { ClientsView } from "@/components/clients/clients-view";

export default async function ClientsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  if (!["ADMINISTRATOR", "COORDINATOR", "PSYCHOLOGIST"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  return <ClientsView />;
}
