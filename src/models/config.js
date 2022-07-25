const mongoose = require("mongoose");

const configSchema = new mongoose.Schema(
  {
    id: {
        type: Number,
        required: true,
    },
    orderLimit: {
      type: Number,
      required: true,
    },
    weeklyOrdersGoal: {
      type: Number,
      required: true,
    },
    daylyOrdersGoal: {
      type: Number,
      required: true,
    },
    weeklyIncomeGoal: {
      type: Number,
      required: true,
    },
    daylyIncomeGoal: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

const Product = mongoose.model("Config", configSchema);

module.exports = Product;
