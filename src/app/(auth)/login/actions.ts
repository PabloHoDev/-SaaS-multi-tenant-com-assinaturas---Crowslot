"use server";

import { z } from "zod";

import { signIn } from "@/auth";
import type { ActionState } from "@/lib/action-state";
import { safeRedirect } from "@/lib/safe-redirect";
import { runAction } from "@/server/action";

const emailSchema = z.object({ email: z.email("Informe um e-mail válido.").trim().toLowerCase() });

export async function signInWithEmail(_prev: ActionState, formData: FormData) {
  return runAction(async () => {
    const { email } = emailSchema.parse({ email: formData.get("email") });
    // signIn envia o link mágico e redireciona para /login/verificar.
    await signIn("resend", { email, redirectTo: safeRedirect(formData.get("callbackUrl")) });
  });
}

export async function signInWithGoogle(formData: FormData) {
  await signIn("google", { redirectTo: safeRedirect(formData.get("callbackUrl")) });
}
