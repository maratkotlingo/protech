import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { bearer } from "better-auth/plugins";
import { emailVerificationExpiresInSeconds, sendEmailVerificationLink } from "./authEmail";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "USER",
        input: false,
      },
    },
  },
  advanced: {
    disableOriginCheck: process.env.NODE_ENV !== "production",
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    autoSignIn: false,
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    expiresIn: emailVerificationExpiresInSeconds,
    sendVerificationEmail: async ({ user, url }) => {
      void sendEmailVerificationLink({ user, url }).catch((error: unknown) => {
        console.error("Failed to send email verification message", error);
      });
    },
  },
  plugins: [bearer()],
});
