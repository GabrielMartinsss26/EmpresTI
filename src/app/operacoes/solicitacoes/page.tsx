import { redirect } from "next/navigation";
import { OperationsRequests } from "@/components/operations-requests";
export const dynamic = "force-dynamic";
export default async function OperationsRequestsPage() {
  if (process.env.APP_MODE === "showcase") redirect("/login");
  const { createAuthClient } = await import("@/server/auth");
  const { getActiveMembership } = await import("@/server/services/access");
  const auth = await createAuthClient();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user) redirect("/login");
  const membership = await getActiveMembership(user.id);
  if (!membership) redirect("/login");
  if (membership.role !== "OPERATIONS" && membership.role !== "ADMIN")
    redirect("/catalogo");
  return <OperationsRequests />;
}
