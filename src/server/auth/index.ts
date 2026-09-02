import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

import { prisma } from "@/server/db/client";
import { sendPasswordEmail } from "@/server/email/resend";

const THIRTY_DAYS = 60 * 60 * 24 * 30;

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  // No public signup — an Admin provisions every account (docs/prd.md R1).
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 8, // docs/prd.md R4
    maxPasswordLength: 128,
    requireEmailVerification: false,
    async sendResetPassword({ user, url }) {
      await sendPasswordEmail({
        to: user.email,
        subject: "Set your Light Advert password",
        url,
      });
    },
  },

  // 30-day rolling session for everyone. The Admin's additional 2-hour idle
  // timeout (docs/prd.md R6) is enforced in ./guards.ts, not here.
  session: {
    expiresIn: THIRTY_DAYS,
    updateAge: 60 * 60 * 24,
  },

  user: {
    additionalFields: {
      role: { type: "string", required: false, defaultValue: "STAFF", input: false },
      status: { type: "string", required: false, defaultValue: "ACTIVE", input: false },
    },
  },

  // TODO(auth): breached-password check against the HaveIBeenPwned range API
  // (docs/prd.md R4) — wire via emailAndPassword.password.hash guard or a
  // pre-hook once the invite/set-password flow lands.

  plugins: [nextCookies()], // must stay last
});

export type Session = typeof auth.$Infer.Session;
