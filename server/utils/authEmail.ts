import { render } from "@vue-email/render";
import VerifyEmail from "~~/server/emails/VerifyEmail.vue";
import { sendTransactionalEmail } from "./mail";

type VerificationUser = {
  email: string;
  name?: string | null;
};

type SendEmailVerificationLinkInput = {
  user: VerificationUser;
  url: string;
};

export const emailVerificationExpiresInSeconds = 60 * 60;

function getAppUrl() {
  const appUrl = process.env.NUXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000";

  return appUrl.replace(/\/$/, "");
}

function getDisplayName(user: VerificationUser) {
  return user.name?.trim() || "друг";
}

export async function sendEmailVerificationLink({ user, url }: SendEmailVerificationLinkInput) {
  const appName = process.env.APP_NAME || "ProTech";
  const supportEmail = process.env.SUPPORT_EMAIL || process.env.MAIL_SUPPORT_EMAIL;
  const props = {
    appName,
    appUrl: getAppUrl(),
    verificationUrl: url,
    expiresInMinutes: Math.round(emailVerificationExpiresInSeconds / 60),
    userName: getDisplayName(user),
    supportEmail,
  };

  const [html, text] = await Promise.all([
    render(VerifyEmail, props, { pretty: true }),
    render(VerifyEmail, props, { plainText: true }),
  ]);

  await sendTransactionalEmail({
    to: user.email,
    subject: `Подтвердите почту в ${appName}`,
    html,
    text,
  });
}
