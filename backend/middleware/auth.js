import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return res.status(401).json({ message: "Unauthorized" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // attach full decoded payload for admin tokens
    req.user = decoded;
    req.userId = decoded.id || null;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
