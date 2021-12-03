const mongoose = require("mongoose");

const orderDetailSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      default: 1
    },
    sellingPrice: {
      type: String,
      required: true,
      max: 30
    }
  },
  { timestamps: true }
);

const OrderDetail = mongoose.model("OrderDetail", orderDetailSchema);

module.exports = OrderDetail;
