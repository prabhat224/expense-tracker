const express = require("express");
const router = express.Router();
const { getAllTransactions, getTransaction, createTransaction, updateTransaction, deleteTransaction } = require("../controllers/transactionController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);
router.route("/").get(getAllTransactions).post(createTransaction);
router.route("/:id").get(getTransaction).put(updateTransaction).delete(deleteTransaction);

module.exports = router;
