import User from "../model/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs"; 

export const registerUser = async (req, res) => {
  try {
    const { fullName, email, phone, password, confirmPassword } = req.body;

    // Check all fields
    if (!fullName || !email || !phone || !password || !confirmPassword)
      return res.status(400).json({ message: "All fields are required" });

    // Full Name validation
    if (!/^[a-zA-Z ]{3,}$/.test(fullName))
      return res.status(400).json({ message: "Full Name must be at least 3 letters and contain only letters" });

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return res.status(400).json({ message: "Invalid email format" });

    // Phone validation (10 digits)
    if (!/^\d{10}$/.test(phone))
      return res.status(400).json({ message: "Phone number must be 10 digits" });

    // Password validation (min 6 chars, at least 1 number)
    if (!/^(?=.*\d).{6,}$/.test(password))
      return res.status(400).json({ message: "Password must be at least 6 characters and contain a number" });

    // Confirm password
    if (password !== confirmPassword)
      return res.status(400).json({ message: "Passwords do not match" });

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "User already exists" });

    const user = await User.create({ fullName, email, phone, password });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: { fullName, email, phone }
    });

  } catch (err) {
    console.error("Signup error",err);
    res.status(500).json({ message: err.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required" });

    // First check for env-based admin credentials (allow admin login without DB user)
    const envAdminEmail = process.env.ADMIN_EMAIL;
    const envAdminPass = process.env.ADMIN_PASSWORD;
    if (envAdminEmail && envAdminPass && email === envAdminEmail && password === envAdminPass) {
      // issue an admin token (no DB lookup required)
      const tokenPayload = { isAdmin: true, email: envAdminEmail };
      const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: "7d" });
      return res.status(200).json({
        message: "Login successful",
        token,
        user: { fullName: 'Admin', email: envAdminEmail, phone: '', role: 'admin' }
      });
    }

    // check if user exists in DB
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    // check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // generate JWT token and include isAdmin if user.role === 'admin'
    const tokenPayload = { id: user._id };
    if (user.role === 'admin') tokenPayload.isAdmin = true;

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(200).json({
      message: "Login successful",
      token,
      user: { fullName: user.fullName, email: user.email, phone: user.phone, role: user.role }
    });

  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    // If token included isAdmin (env-based admin login without DB id)
    if (req.user && req.user.isAdmin && !req.user.id) {
      // return admin summary from token (email may be present)
      return res.json({ fullName: 'Admin', email: req.user.email || process.env.ADMIN_EMAIL, phone: '', createdAt: null, role: 'admin', isAdmin: true });
    }

    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ fullName: user.fullName, email: user.email, phone: user.phone, createdAt: user.createdAt, role: user.role || 'user', isAdmin: user.role === 'admin' });
  } catch (err) {
    console.error("Get current user error:", err);
    res.status(500).json({ message: err.message });
  }
};
