"use server";

import { z } from "zod";

import { signIn } from "@/auth";
import type { ActionState } from "@/lib/action-state";
import { safeRedirect } from "@/lib/safe-redirect";
import { runAction } from "@/server/action";
import { assertRateLimit, currentClientIp } from "@/server/rate-limit";

const emailSchema = z.object({ email: z.email("Informe um e-mail válido.").trim().toLowerCase() });

export async function signInWithEmail(_prev: ActionState, formData: FormData) {
  return runAction(async () => {
    const { email } = emailSchema.parse({ email: formData.get("email") });
    // Limite por IP (vários e-mails a partir da mesma origem). O limite por
    // e-mail de destino é aplicado no callback `signIn` (src/auth.ts).
    await assertRateLimit("loginIp", await currentClientIp());
    // signIn envia o link mágico e redireciona para /login/verificar.
    await signIn("resend", { email, redirectTo: safeRedirect(formData.get("callbackUrl")) });
  });
}

export async function signInWithGoogle(formData: FormData) {
  await signIn("google", { redirectTo: safeRedirect(formData.get("callbackUrl")) });
}
