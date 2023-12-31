const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    clientName: {
      type: String,
      required: true,
      max: 30
    },
    clientPhones: [
      {
        type: String,
        max: 20
      }
    ],
    clientAddress: {
      type: String,
      required: true,
      max: 50
    },
    status: {
      type: String,
      default: "Hold",
      max: 50
    },
    deliveryFeedback: {
      type: String,
      max: 70
    },
    comments: {
      type: String,
      max: 120
    },
    deliveryDate: {
      type: Date,
      required: true
    },
    postponed: {
      type: Boolean,
      default: false
    },
    updated: {
      type: Boolean,
      default: false
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
    oldProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "OrderDetail",
        required: true
      }
    ],
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "OrderDetail",
        required: true
      }
    ]
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
