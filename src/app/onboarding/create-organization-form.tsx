"use client";

import { Loader2Icon } from "lucide-react";
import { useActionState } from "react";

import { FieldError, FormMessage } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initialActionState } from "@/lib/action-state";

import { createOrganizationAction } from "./actions";

export function CreateOrganizationForm() {
  const [state, formAction, pending] = useActionState(createOrganizationAction, initialActionState);
  const nameErrors = state.fieldErrors?.name;

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <div className="grid gap-2">
        <Label htmlFor="name">Nome do negócio</Label>
        <Input
          id="name"
          name="name"
          placeholder="Ex.: Barbearia do Zé"
          autoFocus
          required
          maxLength={60}
          aria-invalid={Boolean(nameErrors)}
          aria-describedby={nameErrors ? "name-error" : undefined}
        />
        <FieldError id="name-error" errors={nameErrors} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending && <Loader2Icon className="animate-spin" />}
        Criar espaço
      </Button>
      <FormMessage state={state} />
    </form>
  );
}
