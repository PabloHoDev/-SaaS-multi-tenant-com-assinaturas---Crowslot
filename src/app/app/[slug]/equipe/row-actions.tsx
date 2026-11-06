"use client";

import { Loader2Icon, Trash2Icon, XIcon } from "lucide-react";
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
import type { ActionState } from "@/lib/action-state";

import { removeMemberAction, revokeInvitationAction } from "./actions";

function notify(result: ActionState) {
  if (result.status === "error") toast.error(result.message);
  else if (result.message) toast.success(result.message);
}

export function RevokeInvitationButton({
  slug,
  invitationId,
}: {
  slug: string;
  invitationId: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Cancelar convite"
      disabled={pending}
      onClick={() =>
        startTransition(async () => notify(await revokeInvitationAction(slug, invitationId)))
      }
    >
      {pending ? <Loader2Icon className="animate-spin" /> : <XIcon />}
    </Button>
  );
}

export function RemoveMemberButton({
  slug,
  membershipId,
  name,
}: {
  slug: string;
  membershipId: string;
  name: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant="ghost" size="icon-sm" aria-label={`Remover ${name}`} />}
      >
        <Trash2Icon />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remover {name}?</DialogTitle>
          <DialogDescription>
            A pessoa perde o acesso a este espaço imediatamente. Esta ação fica registrada no log de
            auditoria.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await removeMemberAction(slug, membershipId);
                notify(result);
                if (result.status === "success") setOpen(false);
              })
            }
          >
            {pending && <Loader2Icon className="animate-spin" />}
            Remover
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
