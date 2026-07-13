import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

type TransactionalEmail = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

let transporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo> | null = null;

function parseBooleanEnv(value: string | undefined, fallback: boolean) {
  if (value === undefined) return fallback;

  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

function parsePort(value: string | undefined, fallback: number) {
  const port = Number(value);

  return Number.isInteger(port) && port > 0 && port <= 65535 ? port : fallback;
}

function getMailFrom() {
  const from = process.env.SMTP_FROM || process.env.MAIL_FROM;
  const user = process.env.SMTP_USER || process.env.MAIL_USER;

  if (from) return from;
  if (user) return user;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SMTP_FROM or MAIL_FROM is required to send transactional email");
  }

  return "ProTech <no-reply@protech.local>";
}

function getTransporter() {
  const host = process.env.SMTP_HOST || process.env.MAIL_HOST;

  if (!host) return null;
  if (transporter) return transporter;

  const port = parsePort(process.env.SMTP_PORT || process.env.MAIL_PORT, 587);
  const secure = parseBooleanEnv(process.env.SMTP_SECURE || process.env.MAIL_SECURE, port === 465);
  const user = process.env.SMTP_USER || process.env.MAIL_USER;
  const pass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS || process.env.MAIL_PASSWORD || process.env.MAIL_PASS;

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    connectionTimeout: parsePort(process.env.SMTP_CONNECTION_TIMEOUT_MS || process.env.MAIL_CONNECTION_TIMEOUT_MS, 10000),
    greetingTimeout: parsePort(process.env.SMTP_GREETING_TIMEOUT_MS || process.env.MAIL_GREETING_TIMEOUT_MS, 10000),
    socketTimeout: parsePort(process.env.SMTP_SOCKET_TIMEOUT_MS || process.env.MAIL_SOCKET_TIMEOUT_MS, 20000),
    auth: user || pass ? { user, pass } : undefined,
  });

  return transporter;
}

export async function sendTransactionalEmail({ to, subject, html, text }: TransactionalEmail) {
  const transport = getTransporter();

  if (!transport) {
    const message = "SMTP_HOST or MAIL_HOST is not configured; transactional email was not sent";

    if (process.env.NODE_ENV === "production") {
      throw new Error(message);
    }

    console.info(`[email:dev] ${message}`);
    console.info(`[email:dev] To: ${to}`);
    console.info(`[email:dev] Subject: ${subject}`);
    console.info(`[email:dev] Text:\n${text || html}`);
    return;
  }

  await transport.sendMail({
    from: getMailFrom(),
    to,
    subject,
    html,
    text,
  });
}

export async function verifyTransactionalEmailTransport() {
  const transport = getTransporter();

  if (!transport) {
    return { configured: false };
  }

  await transport.verify();

  return { configured: true };
}
