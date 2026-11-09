/** Estado retornado pelas Server Actions e consumido via `useActionState`. */
export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  /**
   * Valores enviados, devolvidos em caso de erro. O React limpa o formulário
   * depois de cada submit; com isso o usuário não perde o que digitou.
   */
  values?: Record<string, string>;
};

export const initialActionState: ActionState = { status: "idle" };

/** Erro de regra de negócio com mensagem segura para exibir ao usuário. */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}
