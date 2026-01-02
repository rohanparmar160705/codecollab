import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import multer from "multer";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// 📌 Public routes
router.post("/register", upload.single("avatar"), AuthController.register);
router.post("/login", AuthController.login);
router.post("/refresh-token", AuthController.refresh);

// 📌 Protected routes
router.get("/profile", authenticate, AuthController.getProfile);

export default router;
