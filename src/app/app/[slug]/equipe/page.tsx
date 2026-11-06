import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { initials } from "@/lib/format";
import { getLimit } from "@/lib/plans";
import { assignableRoles, can, canManageMember, type Role } from "@/lib/rbac";
import { listMembersAndInvites } from "@/server/invitations";
import { getOrgContext } from "@/server/tenant";

import { InviteForm } from "./invite-form";
import { RemoveMemberButton, RevokeInvitationButton } from "./row-actions";

export const metadata: Metadata = { title: "Equipe" };

const ROLE_LABEL: Record<Role, string> = {
  OWNER: "Dono",
  ADMIN: "Administrador",
  MEMBER: "Profissional",
};

export default async function TeamPage({ params }: PageProps<"/app/[slug]/equipe">) {
  const { slug } = await params;
  const ctx = await getOrgContext(slug);
  const { members, invitations } = await listMembersAndInvites(ctx);

  const limit = getLimit(ctx.organization.plan, "members");
  const used = members.length + invitations.length;
  const canInvite = can(ctx.role, "members:invite");

  return (
    <>
      <PageHeader
        title="Equipe"
        description={
          Number.isFinite(limit)
            ? `${used} de ${limit} vagas do plano ${ctx.organization.plan === "PRO" ? "Pro" : "Free"} em uso.`
            : `${used} pessoas na equipe.`
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <Card>
          <CardHeader>
            <CardTitle>Membros</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {members.map((m) => (
                <li key={m.id} className="flex items-center gap-3 py-3">
                  <Avatar>
                    {m.user.image && <AvatarImage src={m.user.image} alt="" />}
                    <AvatarFallback>{initials(m.user.name ?? m.user.email)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {m.user.name ?? m.user.email}
                      {m.user.id === ctx.userId && (
                        <span className="text-muted-foreground"> (você)</span>
                      )}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">{m.user.email}</p>
                  </div>
                  <Badge variant={m.role === "OWNER" ? "default" : "secondary"}>
                    {ROLE_LABEL[m.role]}
                  </Badge>
                  {m.user.id !== ctx.userId &&
                    can(ctx.role, "members:remove") &&
                    canManageMember(ctx.role, m.role) && (
                      <RemoveMemberButton
                        slug={slug}
                        membershipId={m.id}
                        name={m.user.name ?? m.user.email}
                      />
                    )}
                </li>
              ))}
            </ul>

            {invitations.length > 0 && (
              <>
                <h3 className="text-muted-foreground mt-6 mb-2 text-sm font-medium">
                  Convites pendentes
                </h3>
                <ul className="divide-y">
                  {invitations.map((inv) => (
                    <li key={inv.id} className="flex items-center gap-3 py-3 text-sm">
                      <span className="flex-1 truncate">{inv.email}</span>
                      <Badge variant="outline">{ROLE_LABEL[inv.role]}</Badge>
                      {canInvite && <RevokeInvitationButton slug={slug} invitationId={inv.id} />}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </CardContent>
        </Card>

        {canInvite && (
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Convidar pessoa</CardTitle>
              <CardDescription>Enviamos um link por e-mail, válido por 7 dias.</CardDescription>
            </CardHeader>
            <CardContent>
              <InviteForm
                slug={slug}
                roles={assignableRoles(ctx.role).map((r) => ({ value: r, label: ROLE_LABEL[r] }))}
                limitReached={used >= limit}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
