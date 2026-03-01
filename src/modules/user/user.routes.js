import { Router } from "express";
import { getProfile, updateProfile, getUsers, deleteUser } from "./user.controller.js";
import { protect, restrictTo } from "../../middleware/auth.middleware.js";

const router = Router();
router.use(protect);
router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.get("/", restrictTo("ADMIN"), getUsers);
router.delete("/:id", restrictTo("ADMIN"), deleteUser);

export default router;
