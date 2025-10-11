This backend implements a Product Reminder service.

Environment variables (create a .env file in backend/):

MONGO_URI=your_mongo_atlas_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000

# SMTP (for sending email reminders)
# Recommended: use a transactional email provider (SendGrid, Mailgun, Sendinblue, etc.)
# or an app-specific account for Gmail. See `.env.example` for templates.
# Example SendGrid SMTP relay settings:
# SMTP_HOST=smtp.sendgrid.net
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=apikey
# SMTP_PASS=your_sendgrid_api_key
# SMTP_FROM="Product Reminder <no-reply@yourdomain.com>"

How it works:
- Users can signup/login using /api/users/signup and /api/users/login
- Use the returned JWT as Authorization: Bearer <token>
- Create products with expiry dates via POST /api/products
- A daily cron job runs at 08:00 server time to check reminders and send emails

Manual reminder trigger (for testing): POST /api/products/trigger-reminders (no auth required for now)

Quick testing options
- Run the trigger script directly (avoids HTTP and cron):

```powershell
cd backend
node ./scripts/triggerReminders.js
```

- Use Ethereal (development-only email testing):
	1. Create an Ethereal account at https://ethereal.email/create or create one programmatically.
	2. Put the returned SMTP credentials into your `backend/.env` using the keys in `.env.example`.
	3. Run the trigger script; Ethereal will show a preview URL in the transporter response.

- If you use a real SMTP provider (SendGrid/Gmail), ensure credentials are correct and the SMTP port/security flags match.

Notes:
- Email reminder sending has been disabled in this branch. The mailer now logs candidates but will not send or update products.
- To re-enable notifications, replace `backend/services/mailer.js` with a real transporter (SendGrid, Mailgun, etc.) and restore sending logic in the controller.
- For testing without sending, use the `triggerRemindersEthereal.js` or `sendOnceWithEthereal.js` scripts (they may need adjustments because the mailer is currently disabled).

Notes:
- Ensure nodemailer SMTP settings are correct. For development consider using Ethereal (ethereal.email) or Mailtrap.
- The scheduler marks products with lastReminderSent so duplicates are avoided.
