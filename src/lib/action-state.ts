/** Estado retornado pelas Server Actions e consumido via `useActionState`. */
export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export const initialActionState: ActionState = { status: "idle" };

/** Erro de regra de negócio com mensagem segura para exibir ao usuário. */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}
