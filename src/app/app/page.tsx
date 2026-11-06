import { redirect } from "next/navigation";

import { listUserOrganizations } from "@/server/organizations";
import { requireUser } from "@/server/tenant";

// Rota que só redireciona: não há o que pré-renderizar, então bloquear no servidor é o correto.
export const instant = false;

/** Ponto de entrada pós-login: vai para a primeira organização ou para o onboarding. */
export default async function AppIndexPage() {
  const user = await requireUser();
  const [first] = await listUserOrganizations(user.id);
  redirect(first ? `/app/${first.slug}` : "/onboarding");
}
