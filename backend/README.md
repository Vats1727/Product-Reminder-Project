This backend implements a Product Reminder service.

Environment variables (create a .env file in backend/):

MONGO_URI=your_mongo_atlas_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000

# SMTP (for sending email reminders)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=you@example.com
SMTP_PASS=yourpassword
SMTP_FROM=Product Reminder <no-reply@example.com>

How it works:
- Users can signup/login using /api/users/signup and /api/users/login
- Use the returned JWT as Authorization: Bearer <token>
- Create products with expiry dates via POST /api/products
- A daily cron job runs at 08:00 server time to check reminders and send emails

Manual reminder trigger (for testing): POST /api/products/trigger-reminders (no auth required for now)

Notes:
- Ensure nodemailer SMTP settings are correct. For development consider using Ethereal (ethereal.email) or Mailtrap.
- The scheduler marks products with lastReminderSent so duplicates are avoided.
