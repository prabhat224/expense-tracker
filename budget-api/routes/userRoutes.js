const express = require("express");
const router = express.Router();
const { getProfile, updateProfile, getAllUsers, deleteUser } = require("../controllers/userController");
const { protect, restrictTo } = require("../middleware/authMiddleware");

router.use(protect); // All user routes require auth

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get current user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: User profile }
 */
router.get("/profile", getProfile);
router.put("/profile", updateProfile);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.get("/", restrictTo("admin"), getAllUsers);
router.delete("/:id", restrictTo("admin"), deleteUser);

module.exports = router;
