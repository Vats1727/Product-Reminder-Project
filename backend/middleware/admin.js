import User from "../model/User.js";

export const adminMiddleware = async (req, res, next) => {
  try {
    // If the token payload indicates admin, allow
    if (req.user && req.user.isAdmin) return next();

    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const user = await User.findById(userId);
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    // Allow if user.role === 'admin'
    if (user.role === 'admin') return next();

    // Fallback: allow if the request used the special env admin creds (for legacy admin login)
    const envAdminEmail = process.env.ADMIN_EMAIL;
    const envAdminPass = process.env.ADMIN_PASSWORD;
    if (envAdminEmail && envAdminPass && user.email === envAdminEmail) return next();

    return res.status(403).json({ message: 'Admin access required' });
  } catch (err) {
    console.error('adminMiddleware error', err);
    res.status(500).json({ message: err.message });
  }
};
