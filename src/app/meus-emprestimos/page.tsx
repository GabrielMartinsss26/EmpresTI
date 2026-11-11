import { redirect } from "next/navigation";
import { MyLoans } from "@/components/my-loans";
export const dynamic = "force-dynamic";
export default async function MyLoansPage() {
  if (process.env.APP_MODE === "showcase") redirect("/login");
  const { createAuthClient } = await import("@/server/auth");
  const { getActiveMembership } = await import("@/server/services/access");
  const auth = await createAuthClient();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user || !(await getActiveMembership(user.id))) redirect("/login");
  return <MyLoans />;
}
