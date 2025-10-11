import dotenv from 'dotenv';
dotenv.config();

import nodemailer from 'nodemailer';
import { createTestAccount } from 'nodemailer';

async function run() {
  // if SMTP env present, use existing transporter config
  const hasSMTP = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

  if (hasSMTP) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: process.env.TEST_MAIL_TO || process.env.SMTP_USER,
      subject: 'Test Mail from Product Reminder',
      text: 'This is a test email sent from Product Reminder backend.'
    });

    console.log('Sent using provided SMTP. MessageId:', info.messageId);
    console.log(info);
    return;
  }

  // fallback to Ethereal for local testing
  const testAccount = await nodemailer.createTestAccount();
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: { user: testAccount.user, pass: testAccount.pass }
  });

  const info = await transporter.sendMail({
    from: 'no-reply@example.com',
    to: testAccount.user,
    subject: 'Ethereal Test Mail',
    text: 'This is a test email sent using Ethereal.'
  });

  console.log('Ethereal preview URL:', nodemailer.getTestMessageUrl(info));
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
