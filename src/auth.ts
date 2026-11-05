import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";

import { env } from "@/env";
import { db } from "@/lib/db";
import { emailLayout, sendEmail } from "@/lib/email";

const providers: NextAuthConfig["providers"] = [
  Resend({
    from: env.EMAIL_FROM,
    apiKey: env.RESEND_API_KEY ?? "dev",
    async sendVerificationRequest({ identifier, url }) {
      await sendEmail({
        to: identifier,
        subject: "Seu link de acesso ao Crowslot",
        text: `Acesse o Crowslot pelo link: ${url}\n\nO link expira em 24 horas.`,
        html: emailLayout(
          "Entrar no Crowslot",
          "Clique no botão abaixo para entrar. O link expira em 24 horas.",
          { label: "Entrar", url },
        ),
      });
    },
  }),
];

// Google é opcional em ambiente local: só habilita se as credenciais existirem.
if (env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET) {
  providers.push(Google({ allowDangerousEmailAccountLinking: true }));
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "database" },
  providers,
  pages: {
    signIn: "/login",
    verifyRequest: "/login/verificar",
  },
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
});

export const isGoogleEnabled = Boolean(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET);
