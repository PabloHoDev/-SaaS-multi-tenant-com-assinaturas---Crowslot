import { Suspense } from "react";

import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { listUserOrganizations } from "@/server/organizations";
import { getOrgContext, requireUser } from "@/server/tenant";

import { NavLinks } from "./_components/nav-links";
import { OrgSwitcher } from "./_components/org-switcher";
import { UserMenu } from "./_components/user-menu";

/**
 * Com Cache Components, a moldura (barra lateral e cabeçalho) é pré-renderizada
 * e carrega na hora; o que depende da sessão chega via <Suspense>.
 *
 * Segurança: o layout NÃO é a barreira de acesso. Cada página e cada action
 * chama `getOrgContext`, que valida sessão + membership. Layouts não
 * re-executam em toda navegação, então confiar neles para autorizar seria frágil.
 */
export default function OrgLayout({ children, params }: LayoutProps<"/app/[slug]">) {
  return (
    <div className="flex min-h-svh flex-1 flex-col md:flex-row">
      <aside className="bg-sidebar flex flex-col gap-4 border-b p-4 md:w-64 md:border-r md:border-b-0">
        <Suspense fallback={<SidebarSkeleton />}>
          <Sidebar params={params} />
        </Suspense>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-end gap-2 border-b px-4 md:px-8">
          <ThemeToggle />
          <Suspense fallback={<Skeleton className="size-8 rounded-full" />}>
            <HeaderUser />
          </Suspense>
        </header>
        <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}

async function Sidebar({ params }: { params: LayoutProps<"/app/[slug]">["params"] }) {
  const { slug } = await params;
  const ctx = await getOrgContext(slug);
  const organizations = await listUserOrganizations(ctx.userId);

  return (
    <>
      <div className="flex items-center justify-between">
        <Logo href={`/app/${slug}`} />
        <Badge variant={ctx.organization.plan === "PRO" ? "default" : "secondary"}>
          {ctx.organization.plan === "PRO" ? "Pro" : "Free"}
        </Badge>
      </div>
      <OrgSwitcher current={ctx.organization} organizations={organizations} />
      <NavLinks slug={slug} role={ctx.role} />
    </>
  );
}

async function HeaderUser() {
  const user = await requireUser();
  return <UserMenu name={user.name ?? null} email={user.email ?? ""} image={user.image ?? null} />;
}

function SidebarSkeleton() {
  return (
    <>
      <Logo />
      <Skeleton className="h-9 w-full" />
      <div className="flex gap-1 md:flex-col">
        <Skeleton className="h-9 w-28 md:w-full" />
        <Skeleton className="h-9 w-28 md:w-full" />
      </div>
    </>
  );
}
