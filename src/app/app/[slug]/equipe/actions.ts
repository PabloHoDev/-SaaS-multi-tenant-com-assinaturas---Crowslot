"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/action-state";
import { idSchema } from "@/lib/validations/common";
import { inviteMemberSchema } from "@/lib/validations/organization";
import { runAction } from "@/server/action";
import { createInvitation, removeMember, revokeInvitation } from "@/server/invitations";
import { getOrgContext } from "@/server/tenant";

// O slug chega via `.bind()` no componente; o contexto (e a permissão) é
// sempre revalidado no servidor a partir da sessão.

export async function inviteMemberAction(slug: string, _prev: ActionState, formData: FormData) {
  return runAction(async () => {
    const ctx = await getOrgContext(slug);
    const input = inviteMemberSchema.parse({
      email: formData.get("email"),
      role: formData.get("role"),
    });
    await createInvitation(ctx, input);
    revalidatePath(`/app/${slug}/equipe`);
    return { status: "success", message: `Convite enviado para ${input.email}.` };
  });
}

export async function revokeInvitationAction(slug: string, invitationId: string) {
  return runAction(async () => {
    const ctx = await getOrgContext(slug);
    await revokeInvitation(ctx, idSchema.parse(invitationId));
    revalidatePath(`/app/${slug}/equipe`);
    return { status: "success", message: "Convite cancelado." };
  });
}

export async function removeMemberAction(slug: string, membershipId: string) {
  return runAction(async () => {
    const ctx = await getOrgContext(slug);
    await removeMember(ctx, idSchema.parse(membershipId));
    revalidatePath(`/app/${slug}/equipe`);
    return { status: "success", message: "Membro removido." };
  });
}
