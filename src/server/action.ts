import "server-only";

import { unstable_rethrow } from "next/navigation";
import { z } from "zod";

import { DomainError, type ActionState } from "@/lib/action-state";
import { PlanLimitError } from "@/lib/plans";
import { ForbiddenError } from "@/lib/rbac";

/**
 * Envolve a lógica de uma Server Action e converte erros conhecidos em
 * `ActionState`. Erros inesperados são logados e viram mensagem genérica —
 * detalhes internos nunca chegam ao navegador.
 */
export async function runAction(fn: () => Promise<ActionState | void>): Promise<ActionState> {
  try {
    return (await fn()) ?? { status: "success" };
  } catch (error) {
    // redirect() e notFound() funcionam lançando erros especiais: repassamos.
    unstable_rethrow(error);

    if (error instanceof z.ZodError) {
      return {
        status: "error",
        message: "Confira os campos destacados.",
        fieldErrors: z.flattenError(error).fieldErrors as ActionState["fieldErrors"],
      };
    }
    if (error instanceof ForbiddenError) {
      return { status: "error", message: "Você não tem permissão para esta ação." };
    }
    if (error instanceof PlanLimitError || error instanceof DomainError) {
      return { status: "error", message: error.message };
    }

    console.error("[action] erro inesperado:", error);
    return { status: "error", message: "Algo deu errado. Tente novamente." };
  }
}
