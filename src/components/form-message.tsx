import { CircleAlertIcon, CircleCheckIcon } from "lucide-react";

import type { ActionState } from "@/lib/action-state";

/** Mensagem geral do formulário, anunciada a leitores de tela. */
export function FormMessage({ state }: { state: ActionState }) {
  if (state.status === "idle" || !state.message) return null;
  const isError = state.status === "error";

  return (
    <p
      role={isError ? "alert" : "status"}
      className={
        isError
          ? "text-destructive flex items-center gap-2 text-sm"
          : "flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400"
      }
    >
      {isError ? <CircleAlertIcon className="size-4" /> : <CircleCheckIcon className="size-4" />}
      {state.message}
    </p>
  );
}

/** Erro de um campo específico, ligado ao input via `aria-describedby`. */
export function FieldError({ id, errors }: { id: string; errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <p id={id} className="text-destructive text-sm">
      {errors[0]}
    </p>
  );
}
