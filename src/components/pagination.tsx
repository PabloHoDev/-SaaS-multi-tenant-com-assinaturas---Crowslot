import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Paginação por links: funciona sem JavaScript e a página fica na URL (compartilhável). */
export function Pagination({
  page,
  pageCount,
  href,
}: {
  page: number;
  pageCount: number;
  href: (page: number) => string;
}) {
  if (pageCount <= 1) return null;

  const link = (target: number, label: string, icon: React.ReactNode, disabled: boolean) =>
    disabled ? (
      <span
        aria-disabled="true"
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "pointer-events-none opacity-50",
        )}
      >
        {icon}
        {label}
      </span>
    ) : (
      <Link href={href(target)} className={buttonVariants({ variant: "outline", size: "sm" })}>
        {icon}
        {label}
      </Link>
    );

  return (
    <nav aria-label="Paginação" className="flex items-center justify-between gap-4 pt-4">
      {link(page - 1, "Anterior", <ChevronLeftIcon />, page <= 1)}
      <span className="text-muted-foreground text-sm tabular-nums">
        Página {page} de {pageCount}
      </span>
      {link(page + 1, "Próxima", <ChevronRightIcon />, page >= pageCount)}
    </nav>
  );
}
