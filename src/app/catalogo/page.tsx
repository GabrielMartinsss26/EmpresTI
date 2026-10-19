import { redirect } from "next/navigation";
import { Catalogue } from "@/components/catalogue";
export const dynamic = "force-dynamic";
export default async function CataloguePage() {
  if (process.env.APP_MODE === "showcase") redirect("/login");
  const { createAuthClient } = await import("@/server/auth");
  const { getActiveMembership } = await import("@/server/services/access");
  const auth = await createAuthClient();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user || !(await getActiveMembership(user.id))) redirect("/login");
  return <Catalogue />;
}
