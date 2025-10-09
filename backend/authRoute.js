// backend/authRoute.js
import express from 'express';
const router = express.Router();

// Dummy authentication endpoint
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (email === 'test@example.com' && password === '123456') {
    res.json({ success: true, message: 'Login successful!' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

export default router;
