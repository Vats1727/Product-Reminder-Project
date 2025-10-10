import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendReminderEmail = async (to, name, product) => {
  const subject = `Reminder: ${product.name} will expire on ${new Date(product.expiryDate).toLocaleDateString()}`;
  const text = `Hello ${name},\n\nThis is a reminder that your product '${product.name}' will expire on ${new Date(product.expiryDate).toLocaleDateString()}.\n\nRegards,\nProduct Reminder Service`;

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
  });

  console.log(`Email sent to ${to}: ${info.messageId}`);
  return info;
};
