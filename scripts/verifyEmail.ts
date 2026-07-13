import "dotenv/config";
import { sendTransactionalEmail, verifyTransactionalEmailTransport } from "../server/utils/mail";

const to = process.env.EMAIL_TEST_TO || process.env.SMTP_TEST_TO || process.env.SMTP_USER || process.env.MAIL_USER;

if (!to) {
  throw new Error("Set EMAIL_TEST_TO, SMTP_TEST_TO, SMTP_USER or MAIL_USER before testing email delivery");
}

try {
  const result = await verifyTransactionalEmailTransport();

  if (!result.configured) {
    throw new Error("SMTP_HOST or MAIL_HOST is not configured");
  }

  await sendTransactionalEmail({
    to,
    subject: "ProTech: проверка отправки письма",
    html: [
      "<div style=\"font-family:Arial,Helvetica,sans-serif;line-height:1.5;color:#1d2939\">",
      "<h1 style=\"font-size:20px;margin:0 0 12px\">Проверка отправки ProTech</h1>",
      "<p style=\"margin:0\">SMTP-подключение работает, письмо успешно отправлено.</p>",
      "</div>",
    ].join(""),
    text: "Проверка отправки ProTech. SMTP-подключение работает, письмо успешно отправлено.",
  });

  console.info(`Email delivery test sent to ${to}`);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);

  console.error(`Email delivery test failed: ${message}`);
  process.exitCode = 1;
}
