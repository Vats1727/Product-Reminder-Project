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

Quick test reminders:
- To test notifications quickly, set `TEST_REMINDER_MINUTES=1` in your `.env` file. When you create a product, the server will set an internal `testReminderAt` to now + 1 minute. The scheduler (or manual trigger) will then send the reminder and emit a realtime event when due.
- Workflow to test:
	1. Set `TEST_REMINDER_MINUTES=1` in `backend/.env`.
	2. Start backend and frontend.
	3. Login from the frontend Dashboard and add a product (expiryDate can be any future date).
	4. Wait ~1 minute, or run the manual trigger endpoint repeatedly until the test reminder is sent:

```powershell
curl -Method POST http://localhost:5000/api/products/trigger-reminders
```

	5. Watch the Dashboard Notifications area — you should see the reminder appear in real time when it's sent.

