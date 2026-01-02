// src/modules/user/user.routes.ts
import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { verifyToken } from "../middlewares/auth.middleware";
import { checkPermission } from "../middlewares/permission.middleware";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

const router = Router();

// 🔒 All user routes require authentication
router.use(verifyToken);

// 👤 Current user
router.get("/profile", UserController.getProfile);
router.put("/profile", UserController.updateProfile);
router.post("/avatar", upload.single("avatar"), UserController.uploadAvatar);

// 🧩 Fetch rooms of a specific user
router.get(
  "/:id/rooms",
  checkPermission("read", "rooms"),
  UserController.getUserRooms
);

// 🧑‍💼 Admin endpoints
router.get("/", checkPermission("read", "users"), UserController.getAll);

export default router;
