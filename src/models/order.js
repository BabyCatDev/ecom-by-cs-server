const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    clientName: {
      type: String,
      required: true,
      max: 30
    },
    clientPhone: {
      type: String,
      required: true,
      max: 20
    },
    clientAddress: {
      type: String,
      required: true,
      max: 50
    },
    status: {
      type: String,
      default: "Waiting",
      max: 50
    },
    deliveryDate: {
      type: Date,
      required: true
    },
    delivery: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
      }
    ]
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;