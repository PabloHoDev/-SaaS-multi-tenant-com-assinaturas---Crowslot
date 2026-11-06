"use server";

import { redirect } from "next/navigation";

import type { ActionState } from "@/lib/action-state";
import { createOrganizationSchema } from "@/lib/validations/organization";
import { runAction } from "@/server/action";
import { createOrganization } from "@/server/organizations";
import { requireUser } from "@/server/tenant";

export async function createOrganizationAction(_prev: ActionState, formData: FormData) {
  return runAction(async () => {
    const user = await requireUser();
    const { name } = createOrganizationSchema.parse({ name: formData.get("name") });
    const organization = await createOrganization(user.id, name);
    redirect(`/app/${organization.slug}`);
  });
}
