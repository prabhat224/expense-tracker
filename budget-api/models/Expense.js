const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    budgetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Budget",
      required: [true, "Budget ID is required"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    category: {
      type: String,
      default: "general",
    },
    date: {
      type: Date,
      default: Date.now,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Expense", expenseSchema);
