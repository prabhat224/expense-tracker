const express = require("express");
const router = express.Router();
const { getAllBudgets, getBudget, createBudget, updateBudget, deleteBudget } = require("../controllers/budgetController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

/**
 * @swagger
 * /api/budgets:
 *   get:
 *     summary: Get all budgets for the current user
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *   post:
 *     summary: Create a new budget
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, limit]
 *             properties:
 *               name: { type: string, example: "Monthly Groceries" }
 *               limit: { type: number, example: 500 }
 *               category: { type: string, example: "food" }
 *               description: { type: string }
 */
router.route("/").get(getAllBudgets).post(createBudget);
router.route("/:id").get(getBudget).put(updateBudget).delete(deleteBudget);

module.exports = router;
