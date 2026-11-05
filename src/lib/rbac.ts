/**
 * RBAC — controle de acesso por papel.
 *
 * Toda checagem de permissão do sistema passa por aqui. Manter a matriz em um
 * único lugar evita regras espalhadas pelos componentes e facilita auditar
 * quem pode fazer o quê.
 */

export const ROLES = ["OWNER", "ADMIN", "MEMBER"] as const;
export type Role = (typeof ROLES)[number];

export const PERMISSIONS = {
  "organization:update": ["OWNER", "ADMIN"],
  "organization:delete": ["OWNER"],
  "billing:manage": ["OWNER"],
  "members:invite": ["OWNER", "ADMIN"],
  "members:remove": ["OWNER", "ADMIN"],
  "members:update-role": ["OWNER"],
  "services:write": ["OWNER", "ADMIN"],
  "clients:read": ["OWNER", "ADMIN", "MEMBER"],
  "clients:write": ["OWNER", "ADMIN", "MEMBER"],
  "clients:delete": ["OWNER", "ADMIN"],
  "appointments:write": ["OWNER", "ADMIN", "MEMBER"],
  "reports:read": ["OWNER", "ADMIN"],
  "audit:read": ["OWNER", "ADMIN"],
  "data:export": ["OWNER", "ADMIN"],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: Role, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly Role[]).includes(role);
}

const ROLE_RANK: Record<Role, number> = { OWNER: 3, ADMIN: 2, MEMBER: 1 };

/**
 * Um usuário só pode gerenciar (remover, rebaixar) membros com papel
 * estritamente inferior ao seu. Isso impede que um ADMIN remova o OWNER
 * ou outro ADMIN.
 */
export function canManageMember(actor: Role, target: Role): boolean {
  return ROLE_RANK[actor] > ROLE_RANK[target];
}

/** Papéis que um ator pode atribuir em um convite. Ninguém convida um novo OWNER. */
export function assignableRoles(actor: Role): Role[] {
  return ROLES.filter((r) => r !== "OWNER" && ROLE_RANK[r] < ROLE_RANK[actor]);
}

export class ForbiddenError extends Error {
  constructor(public readonly permission?: Permission) {
    super(permission ? `Permissão negada: ${permission}` : "Permissão negada");
    this.name = "ForbiddenError";
  }
}

export function assertCan(role: Role, permission: Permission): void {
  if (!can(role, permission)) throw new ForbiddenError(permission);
}
