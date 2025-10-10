import nodemailer from "nodemailer";

let transporterPromise = null;

async function getTransporter() {
  if (transporterPromise) return transporterPromise;

  transporterPromise = (async () => {
    // If SMTP environment provided, use that
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }

    // Fallback: create an Ethereal test account for dev
    const testAccount = await nodemailer.createTestAccount();
    console.log("Using Ethereal account:", testAccount.user);
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
  })();

  return transporterPromise;
}

export const sendReminderEmail = async (to, name, product) => {
  const subject = `Reminder: ${product.name} will expire on ${new Date(product.expiryDate).toLocaleDateString()}`;
  const text = `Hello ${name},\n\nThis is a reminder that your product '${product.name}' will expire on ${new Date(product.expiryDate).toLocaleDateString()}.\n\nRegards,\nProduct Reminder Service`;

  const transporter = await getTransporter();
  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply@example.com",
    to,
    subject,
    text,
  });

  console.log(`Email sent to ${to}: ${info.messageId}`);
  // If using Ethereal, print preview URL
  try {
    const preview = nodemailer.getTestMessageUrl(info);
    if (preview) console.log("Preview URL:", preview);
  } catch (e) {
    // ignore
  }

  return info;
};
