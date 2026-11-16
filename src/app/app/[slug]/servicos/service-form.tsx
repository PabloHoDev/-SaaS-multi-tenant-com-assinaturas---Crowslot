"use client";

import { Loader2Icon } from "lucide-react";
import { useActionState } from "react";

import { FieldError, FormMessage } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initialActionState } from "@/lib/action-state";
import { centsToInput } from "@/lib/money";

import { createServiceAction, updateServiceAction } from "./actions";

type ServiceValues = {
  id: string;
  name: string;
  durationMin: number;
  priceCents: number;
};

export function ServiceForm({ slug, service }: { slug: string; service?: ServiceValues }) {
  const action = service
    ? updateServiceAction.bind(null, slug, service.id)
    : createServiceAction.bind(null, slug);
  const [state, formAction, pending] = useActionState(action, initialActionState);

  // Depois de um erro, mostra o que foi digitado; senão, o valor salvo.
  const saved: Record<string, string> = service
    ? {
        name: service.name,
        durationMin: String(service.durationMin),
        price: centsToInput(service.priceCents),
      }
    : { name: "", durationMin: "30", price: "" };
  const value = (key: string) => state.values?.[key] ?? saved[key];

  const field = (key: string) => ({
    id: `service-${key}`,
    name: key,
    "aria-invalid": Boolean(state.fieldErrors?.[key]),
    "aria-describedby": state.fieldErrors?.[key] ? `service-${key}-error` : undefined,
  });

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <div className="grid gap-2">
        <Label htmlFor="service-name">Nome</Label>
        <Input
          {...field("name")}
          defaultValue={value("name")}
          placeholder="Corte masculino"
          autoComplete="off"
          required
        />
        <FieldError id="service-name-error" errors={state.fieldErrors?.name} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="service-durationMin">Duração (minutos)</Label>
          <Input
            {...field("durationMin")}
            defaultValue={value("durationMin")}
            type="number"
            inputMode="numeric"
            min={5}
            max={480}
            step={5}
            required
          />
          <FieldError id="service-durationMin-error" errors={state.fieldErrors?.durationMin} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="service-price">Preço (R$)</Label>
          <Input
            {...field("price")}
            defaultValue={value("price")}
            inputMode="decimal"
            placeholder="45,00"
            autoComplete="off"
            required
          />
          <FieldError id="service-price-error" errors={state.fieldErrors?.price} />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2Icon className="animate-spin" />}
          {service ? "Salvar alterações" : "Cadastrar serviço"}
        </Button>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
