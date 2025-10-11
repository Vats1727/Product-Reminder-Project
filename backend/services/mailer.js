// Email sending disabled — placeholder no-op implementation
// All email/reminder functionality has been removed. Replace this module
// with your preferred integration if you want to re-enable notifications.

export const isSmtpConfigured = () => false;

export const sendReminderEmail = async (to, name, product) => {
  console.log(`Emailing disabled — would have sent to ${to} for product ${product?.name || '<unknown>'}`);
  return null;
};
