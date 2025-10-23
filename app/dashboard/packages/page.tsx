
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { PackagesView } from "@/components/packages/packages-view";

export default async function PackagesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  if (!["ADMINISTRATOR", "COORDINATOR"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  return <PackagesView />;
}
