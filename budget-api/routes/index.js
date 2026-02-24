const express = require("express");
const router = express.Router();

router.use("/auth",         require("./authRoutes"));
router.use("/users",        require("./userRoutes"));
router.use("/budgets",      require("./budgetRoutes"));
router.use("/expenses",     require("./expenseRoutes"));
router.use("/customers",    require("./customerRoutes"));
router.use("/orders",       require("./orderRoutes"));
router.use("/tasks",        require("./taskRoutes"));
router.use("/transactions", require("./transactionRoutes"));

module.exports = router;
