import express from "express";
import { registerUser, loginUser, getCurrentUser } from "../controller/userController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.post("/signup", registerUser);
router.post("/login", loginUser);
router.get("/me", authMiddleware, getCurrentUser);

export default router;
