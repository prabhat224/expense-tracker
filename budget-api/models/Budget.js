const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Budget name is required"],
      trim: true,
    },
    limit: {
      type: Number,
      required: [true, "Budget limit is required"],
      min: [0, "Limit cannot be negative"],
    },
    spent: {
      type: Number,
      default: 0,
      min: 0,
    },
    category: {
      type: String,
      enum: ["personal", "business", "travel", "food", "health", "other"],
      default: "other",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Virtual: remaining budget
budgetSchema.virtual("remaining").get(function () {
  return this.limit - this.spent;
});

budgetSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Budget", budgetSchema);
