import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { bearer } from "better-auth/plugins";
import { emailVerificationExpiresInSeconds, sendEmailVerificationLink } from "./authEmail";

function parseBooleanEnv(value: string | undefined, fallback: boolean) {
  if (value === undefined) return fallback;

  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

const isProduction = process.env.NODE_ENV === "production";
const hasTransactionalEmailTransport = Boolean(process.env.SMTP_HOST || process.env.MAIL_HOST);
const requireEmailVerification = parseBooleanEnv(
  process.env.AUTH_REQUIRE_EMAIL_VERIFICATION,
  isProduction
);
const sendVerificationOnSignUp = parseBooleanEnv(
  process.env.AUTH_SEND_VERIFICATION_ON_SIGN_UP,
  isProduction || hasTransactionalEmailTransport
);
const sendVerificationOnSignIn = parseBooleanEnv(
  process.env.AUTH_SEND_VERIFICATION_ON_SIGN_IN,
  isProduction || hasTransactionalEmailTransport
);

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
    disableOriginCheck: !isProduction,
    disableCSRFCheck: !isProduction,
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification,
    autoSignIn: false,
  },
  emailVerification: {
    sendOnSignUp: sendVerificationOnSignUp,
    sendOnSignIn: sendVerificationOnSignIn,
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
