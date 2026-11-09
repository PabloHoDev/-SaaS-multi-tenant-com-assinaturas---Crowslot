"use client";

import { Loader2Icon } from "lucide-react";
import { useActionState } from "react";

import { FieldError, FormMessage } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { initialActionState } from "@/lib/action-state";
import { formatPhone } from "@/lib/phone";

import { createClientAction, updateClientAction } from "./actions";

type ClientValues = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
};

export function ClientForm({ slug, client }: { slug: string; client?: ClientValues }) {
  const action = client
    ? updateClientAction.bind(null, slug, client.id)
    : createClientAction.bind(null, slug);
  const [state, formAction, pending] = useActionState(action, initialActionState);

  // Depois de um erro, mostra o que foi digitado; senão, o valor salvo.
  const value = (key: keyof Omit<ClientValues, "id">) =>
    state.values?.[key] ?? (key === "phone" ? formatPhone(client?.phone) : (client?.[key] ?? ""));

  const field = (key: string) => ({
    id: `client-${key}`,
    name: key,
    "aria-invalid": Boolean(state.fieldErrors?.[key]),
    "aria-describedby": state.fieldErrors?.[key] ? `client-${key}-error` : undefined,
  });

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <div className="grid gap-2">
        <Label htmlFor="client-name">Nome</Label>
        <Input {...field("name")} defaultValue={value("name")} autoComplete="off" required />
        <FieldError id="client-name-error" errors={state.fieldErrors?.name} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="client-phone">Telefone</Label>
          <Input
            {...field("phone")}
            defaultValue={value("phone")}
            type="tel"
            inputMode="tel"
            placeholder="(85) 99999-9999"
            autoComplete="off"
          />
          <FieldError id="client-phone-error" errors={state.fieldErrors?.phone} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="client-email">E-mail</Label>
          <Input
            {...field("email")}
            defaultValue={value("email")}
            type="email"
            placeholder="cliente@email.com"
            autoComplete="off"
          />
          <FieldError id="client-email-error" errors={state.fieldErrors?.email} />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="client-notes">Observações</Label>
        <Textarea
          {...field("notes")}
          defaultValue={value("notes")}
          rows={3}
          placeholder="Preferências, alergias, corte de costume…"
        />
        <FieldError id="client-notes-error" errors={state.fieldErrors?.notes} />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2Icon className="animate-spin" />}
          {client ? "Salvar alterações" : "Cadastrar cliente"}
        </Button>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
