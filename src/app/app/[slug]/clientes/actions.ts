"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import type { ActionState } from "@/lib/action-state";
import { clientSchema } from "@/lib/validations/client";
import { runAction } from "@/server/action";
import { createClient, deleteClient, updateClient } from "@/server/clients";
import { getOrgContext } from "@/server/tenant";

const FIELDS = ["name", "email", "phone", "notes"] as const;
const idSchema = z.string().min(1).max(64);

function readForm(formData: FormData) {
  return Object.fromEntries(FIELDS.map((key) => [key, String(formData.get(key) ?? "")])) as Record<
    (typeof FIELDS)[number],
    string
  >;
}

/** Em caso de erro, devolve o que foi digitado para o formulário não ficar vazio. */
function withValues(result: ActionState, values: Record<string, string>): ActionState {
  return result.status === "error" ? { ...result, values } : result;
}

export async function createClientAction(
  slug: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const values = readForm(formData);
  let clientId = "";

  const result = await runAction(async () => {
    const ctx = await getOrgContext(slug);
    ({ id: clientId } = await createClient(ctx, clientSchema.parse(values)));
  });
  if (result.status === "error") return withValues(result, values);

  revalidatePath(`/app/${slug}/clientes`);
  redirect(`/app/${slug}/clientes/${clientId}`);
}

export async function updateClientAction(
  slug: string,
  clientId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const values = readForm(formData);

  const result = await runAction(async () => {
    const ctx = await getOrgContext(slug);
    await updateClient(ctx, idSchema.parse(clientId), clientSchema.parse(values));
    revalidatePath(`/app/${slug}/clientes`, "layout");
    return { status: "success", message: "Dados salvos." };
  });
  return withValues(result, values);
}

export async function deleteClientAction(slug: string, clientId: string): Promise<ActionState> {
  const result = await runAction(async () => {
    const ctx = await getOrgContext(slug);
    await deleteClient(ctx, idSchema.parse(clientId));
  });
  if (result.status === "error") return result;

  revalidatePath(`/app/${slug}/clientes`);
  redirect(`/app/${slug}/clientes`);
}
