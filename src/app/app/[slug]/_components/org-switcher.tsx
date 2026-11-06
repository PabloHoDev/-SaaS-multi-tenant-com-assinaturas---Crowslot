"use client";

import { CheckIcon, ChevronsUpDownIcon, PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Org = { id: string; name: string; slug: string };

export function OrgSwitcher({ current, organizations }: { current: Org; organizations: Org[] }) {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="bg-background hover:bg-muted focus-visible:ring-ring/50 flex w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-sm font-medium outline-none focus-visible:ring-3">
        <span className="truncate">{current.name}</span>
        <ChevronsUpDownIcon className="text-muted-foreground size-4 shrink-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60" align="start">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Seus espaços</DropdownMenuLabel>
          {organizations.map((org) => (
            <DropdownMenuItem key={org.id} onClick={() => router.push(`/app/${org.slug}`)}>
              <span className="flex-1 truncate">{org.name}</span>
              {org.id === current.id && <CheckIcon className="size-4" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/onboarding")}>
          <PlusIcon className="size-4" />
          Criar novo espaço
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
