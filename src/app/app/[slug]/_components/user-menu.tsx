"use client";

import { LogOutIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initials } from "@/lib/format";

import { signOutAction } from "../../actions";

type Props = { name: string | null; email: string; image: string | null };

export function UserMenu({ name, email, image }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Menu da conta"
        className="focus-visible:ring-ring/50 rounded-full outline-none focus-visible:ring-3"
      >
        <Avatar>
          {image && <AvatarImage src={image} alt="" />}
          <AvatarFallback>{initials(name ?? email)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="grid">
            <span className="text-foreground truncate font-medium">{name ?? "Sem nome"}</span>
            <span className="truncate text-xs font-normal">{email}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOutAction()}>
          <LogOutIcon className="size-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
