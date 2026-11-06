"use client";

import { Loader2Icon } from "lucide-react";
import { useActionState } from "react";

import { FormMessage } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import { initialActionState } from "@/lib/action-state";

import { acceptInvitationAction } from "./actions";

export function AcceptButton({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(
    acceptInvitationAction.bind(null, token),
    initialActionState,
  );

  return (
    <form action={formAction} className="grid gap-3">
      <Button type="submit" disabled={pending}>
        {pending && <Loader2Icon className="animate-spin" />}
        Aceitar convite
      </Button>
      <FormMessage state={state} />
    </form>
  );
}
