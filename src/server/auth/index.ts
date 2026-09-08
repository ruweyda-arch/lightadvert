import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

import { prisma } from "@/server/db/client";
import { SESSION_MAX_AGE_S, MIN_PASSWORD_LENGTH } from "@/server/auth/policy";
import { sendPasswordEmail } from "@/server/email/resend";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  // No public signup — an Admin provisions every account (docs/prd.md R1).
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: MIN_PASSWORD_LENGTH,
    maxPasswordLength: 128,
    requireEmailVerification: false,
    resetPasswordTokenExpiresIn: 60 * 60, // 1 hour
    async sendResetPassword({ user, url }) {
      await sendPasswordEmail({
        to: user.email,
        subject: "Set your Light Advert password",
        url,
      });
    },
  },

  // 30-day rolling session for everyone. The Admin's additional 2-hour idle
  // timeout (docs/prd.md R6) is enforced in src/middleware.ts.
  session: {
    expiresIn: SESSION_MAX_AGE_S,
    updateAge: 60 * 60 * 24,
  },

  // docs/prd.md R7. Better Auth's in-memory limiter is a per-instance backstop;
  // the cross-instance guard is the explicit Upstash check the credential server
  // actions run (src/server/actions/auth.ts + src/server/ratelimit/upstash.ts).
  rateLimit: {
    enabled: true,
    customRules: {
      "/sign-in/email": { window: 300, max: 5 },
      "/request-password-reset": { window: 900, max: 5 },
      "/reset-password": { window: 900, max: 10 },
    },
  },

  user: {
    additionalFields: {
      role: { type: "string", required: false, defaultValue: "STAFF", input: false },
      status: { type: "string", required: false, defaultValue: "ACTIVE", input: false },
    },
  },

  // The breached-password check (docs/prd.md R4) runs in the reset-password
  // server action (src/server/actions/auth.ts) before Better Auth is called.

  plugins: [nextCookies()], // must stay last
});

export type Session = typeof auth.$Infer.Session;
