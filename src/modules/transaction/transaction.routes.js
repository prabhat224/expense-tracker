import { Router } from "express";
import { getAllTransactions, getTransaction, createTransaction, updateTransaction, deleteTransaction } from "./transaction.controller.js";
import { protect } from "../../middleware/auth.middleware.js";

const router = Router();
router.use(protect);
router.route("/").get(getAllTransactions).post(createTransaction);
router.route("/:id").get(getTransaction).put(updateTransaction).delete(deleteTransaction);

export default router;
