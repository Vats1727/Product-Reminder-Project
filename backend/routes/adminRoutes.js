import express from "express";
import { listUsers, listAllProducts, sendProductReminder, deleteProductAdmin } from "../controller/adminController.js";
import { authMiddleware } from "../middleware/auth.js";
import { adminMiddleware } from "../middleware/admin.js";

const router = express.Router();

// Protected admin routes
router.get('/users', authMiddleware, adminMiddleware, listUsers);
router.get('/products', authMiddleware, adminMiddleware, listAllProducts);
router.post('/products/:id/send', authMiddleware, adminMiddleware, sendProductReminder);
router.delete('/products/:id', authMiddleware, adminMiddleware, deleteProductAdmin);

export default router;
