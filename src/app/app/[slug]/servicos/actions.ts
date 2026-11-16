"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import type { ActionState } from "@/lib/action-state";
import { idSchema } from "@/lib/validations/common";
import { serviceSchema } from "@/lib/validations/service";
import { runAction } from "@/server/action";
import { createService, deleteService, setServiceActive, updateService } from "@/server/services";
import { getOrgContext } from "@/server/tenant";

const FIELDS = ["name", "durationMin", "price"] as const;

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

export async function createServiceAction(
  slug: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const values = readForm(formData);

  const result = await runAction(async () => {
    const ctx = await getOrgContext(slug);
    await createService(ctx, serviceSchema.parse(values));
  });
  if (result.status === "error") return withValues(result, values);

  revalidatePath(`/app/${slug}/servicos`);
  redirect(`/app/${slug}/servicos`);
}

export async function updateServiceAction(
  slug: string,
  serviceId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const values = readForm(formData);

  const result = await runAction(async () => {
    const ctx = await getOrgContext(slug);
    await updateService(ctx, idSchema.parse(serviceId), serviceSchema.parse(values));
    revalidatePath(`/app/${slug}/servicos`, "layout");
    return { status: "success", message: "Dados salvos." };
  });
  return withValues(result, values);
}

export async function setServiceActiveAction(
  slug: string,
  serviceId: string,
  active: boolean,
): Promise<ActionState> {
  return runAction(async () => {
    const ctx = await getOrgContext(slug);
    await setServiceActive(ctx, idSchema.parse(serviceId), z.boolean().parse(active));
    revalidatePath(`/app/${slug}/servicos`, "layout");
    return {
      status: "success",
      message: active ? "Serviço reativado." : "Serviço desativado.",
    };
  });
}

export async function deleteServiceAction(slug: string, serviceId: string): Promise<ActionState> {
  const result = await runAction(async () => {
    const ctx = await getOrgContext(slug);
    await deleteService(ctx, idSchema.parse(serviceId));
  });
  if (result.status === "error") return result;

  revalidatePath(`/app/${slug}/servicos`);
  redirect(`/app/${slug}/servicos`);
}
