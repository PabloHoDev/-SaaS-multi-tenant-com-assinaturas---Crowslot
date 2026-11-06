"use client";

import { Loader2Icon, SendIcon } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";

import { FieldError, FormMessage } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initialActionState } from "@/lib/action-state";

import { inviteMemberAction } from "./actions";

type Props = {
  slug: string;
  roles: { value: string; label: string }[];
  limitReached: boolean;
};

export function InviteForm({ slug, roles, limitReached }: Props) {
  const [state, formAction, pending] = useActionState(
    inviteMemberAction.bind(null, slug),
    initialActionState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  if (limitReached) {
    return (
      <p className="text-muted-foreground text-sm">
        Você atingiu o limite de pessoas do seu plano. Faça upgrade para o Pro para convidar mais.
      </p>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="grid gap-4" noValidate>
      <div className="grid gap-2">
        <Label htmlFor="invite-email">E-mail</Label>
        <Input
          id="invite-email"
          name="email"
          type="email"
          placeholder="pessoa@email.com"
          required
          aria-invalid={Boolean(state.fieldErrors?.email)}
          aria-describedby={state.fieldErrors?.email ? "invite-email-error" : undefined}
        />
        <FieldError id="invite-email-error" errors={state.fieldErrors?.email} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="invite-role">Papel</Label>
        <select
          id="invite-role"
          name="role"
          defaultValue={roles.at(-1)?.value}
          className="border-input focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 h-8 rounded-lg border bg-transparent px-2.5 text-sm outline-none focus-visible:ring-3"
        >
          {roles.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <FieldError id="invite-role-error" errors={state.fieldErrors?.role} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2Icon className="animate-spin" /> : <SendIcon />}
        Enviar convite
      </Button>
      <FormMessage state={state} />
    </form>
  );
}
