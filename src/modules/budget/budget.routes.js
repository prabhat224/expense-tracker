import { Router } from "express";
import { getAllBudgets, getBudget, createBudget, updateBudget, deleteBudget } from "./budget.controller.js";
import { protect } from "../../middleware/auth.middleware.js";

const router = Router();
router.use(protect);
router.route("/").get(getAllBudgets).post(createBudget);
router.route("/:id").get(getBudget).put(updateBudget).delete(deleteBudget);

export default router;
