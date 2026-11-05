import { describe, expect, it } from "vitest";

import { assertCan, assignableRoles, can, canManageMember, ForbiddenError } from "./rbac";

describe("can", () => {
  it("permite que só o OWNER gerencie a cobrança", () => {
    expect(can("OWNER", "billing:manage")).toBe(true);
    expect(can("ADMIN", "billing:manage")).toBe(false);
    expect(can("MEMBER", "billing:manage")).toBe(false);
  });

  it("permite que qualquer membro crie agendamentos", () => {
    expect(can("MEMBER", "appointments:write")).toBe(true);
  });

  it("impede MEMBER de convidar pessoas", () => {
    expect(can("MEMBER", "members:invite")).toBe(false);
    expect(can("ADMIN", "members:invite")).toBe(true);
  });
});

describe("canManageMember", () => {
  it("impede ADMIN de remover OWNER ou outro ADMIN", () => {
    expect(canManageMember("ADMIN", "OWNER")).toBe(false);
    expect(canManageMember("ADMIN", "ADMIN")).toBe(false);
    expect(canManageMember("ADMIN", "MEMBER")).toBe(true);
  });

  it("permite OWNER gerenciar ADMIN e MEMBER", () => {
    expect(canManageMember("OWNER", "ADMIN")).toBe(true);
    expect(canManageMember("OWNER", "MEMBER")).toBe(true);
  });
});

describe("assignableRoles", () => {
  it("nunca permite convidar um OWNER", () => {
    expect(assignableRoles("OWNER")).toEqual(["ADMIN", "MEMBER"]);
    expect(assignableRoles("ADMIN")).toEqual(["MEMBER"]);
    expect(assignableRoles("MEMBER")).toEqual([]);
  });
});

describe("assertCan", () => {
  it("lança ForbiddenError quando falta permissão", () => {
    expect(() => assertCan("MEMBER", "organization:delete")).toThrow(ForbiddenError);
    expect(() => assertCan("OWNER", "organization:delete")).not.toThrow();
  });
});
