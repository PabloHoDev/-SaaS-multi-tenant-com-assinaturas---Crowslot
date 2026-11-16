"use client";

import { ArchiveIcon, ArchiveRestoreIcon, Loader2Icon, Trash2Icon } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { deleteServiceAction, setServiceActiveAction } from "./actions";

type Props = {
  slug: string;
  serviceId: string;
  name: string;
  active: boolean;
  /** Serviço com agendamentos não pode ser excluído, só desativado. */
  hasAppointments: boolean;
};

export function ServiceActions({ slug, serviceId, name, active, hasAppointments }: Props) {
  const [pending, startTransition] = useTransition();

  const toggle = () =>
    startTransition(async () => {
      const result = await setServiceActiveAction(slug, serviceId, !active);
      if (result.status === "error") toast.error(result.message);
      else if (result.message) toast.success(result.message);
    });

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" disabled={pending} onClick={toggle}>
        {pending ? (
          <Loader2Icon className="animate-spin" />
        ) : active ? (
          <ArchiveIcon />
        ) : (
          <ArchiveRestoreIcon />
        )}
        {active ? "Desativar" : "Reativar"}
      </Button>
      {!hasAppointments && <DeleteServiceButton slug={slug} serviceId={serviceId} name={name} />}
    </div>
  );
}

function DeleteServiceButton({
  slug,
  serviceId,
  name,
}: {
  slug: string;
  serviceId: string;
  name: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <Trash2Icon />
        Excluir
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir {name}?</DialogTitle>
          <DialogDescription>
            O serviço é apagado definitivamente. Só é possível porque ele ainda não tem
            agendamentos.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                // Em caso de sucesso a action redireciona para a lista.
                const result = await deleteServiceAction(slug, serviceId);
                if (result.status === "error") toast.error(result.message);
              })
            }
          >
            {pending && <Loader2Icon className="animate-spin" />}
            Excluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
