import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 465),
  secure: process.env.SMTP_SECURE !== "false",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendMail(to: string, subject: string, html: string) {
  const fromEmail = process.env.SMTP_FROM ?? process.env.SMTP_USER;
  await transporter.sendMail({
    from: `口袋链 <${fromEmail}>`,
    to,
    subject,
    html,
  });
}
