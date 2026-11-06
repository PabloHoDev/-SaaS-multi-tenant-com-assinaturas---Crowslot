"use server";

import { redirect } from "next/navigation";

import type { ActionState } from "@/lib/action-state";
import { runAction } from "@/server/action";
import { acceptInvitation } from "@/server/invitations";
import { requireUser } from "@/server/tenant";

export async function acceptInvitationAction(token: string, _prev: ActionState) {
  return runAction(async () => {
    const user = await requireUser();
    const { slug } = await acceptInvitation(token, { id: user.id, email: user.email ?? "" });
    redirect(`/app/${slug}`);
  });
}
