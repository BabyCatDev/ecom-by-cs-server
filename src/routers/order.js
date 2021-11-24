const express = require("express");
const User = require("../models/user");
const Order = require("../models/order");
const OrderDetail = require("../models/orderDetail");
const auth = require("../middleware/auth");

const router = new express.Router();

//Create order
router.post("/order", auth, async (req, res) => {
  if (req.user.type === "Commercial") {
    const {
      clientName,
      clientPhone,
      clientAddress,
      deliveryDate,
      delivery,
      productsDetails
    } = req.body;
    const products = [];

    //Creating orderDetails
    const promises = productsDetails.map(async (item, i) => {
      const orderTemp = new OrderDetail({
        product: item.productId,
        quantity: item.quantity
      });

      try {
        const result = await orderTemp.save();
        products.push(result._id);
      } catch (e) {
        console.log(e);
      }
    });
    await Promise.all(promises);

    //Creating order with orderDetail items
    const order = new Order({
      products,
      clientName,
      clientPhone,
      clientAddress,
      deliveryDate,
      delivery,
      seller: req.user._id
    });
    try {
      const result = await order.save();
      await User.updateOne(
        {
          _id: delivery
        },
        {
          $addToSet: {
            orders: result._id
          }
        }
      );
      await User.updateOne(
        {
          _id: req.user._id
        },
        {
          $addToSet: {
            orders: result._id
          }
        }
      );
      res.status(201).send({ result });
    } catch (e) {
      res.status(400).send(e);
    }
  } else {
    res.status(403).send();
  }
});

router.get("/sellerorders", auth, async (req, res) => {
  if (req.user.type === "Commercial") {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1
      );
      const orders = await Order.find({
        seller: {
          $eq: req.user._id
        },
        deliveryDate: {
          $gte: req.query.fromDate || today,
          $lt: req.query.toDate || tomorrow
        }
      })
        .populate({
          path: "products",
          populate: { path: "product", model: "Product" }
        })
        .populate({
          path: "delivery",
          select: "fullName phone email place"
        })
        .sort({ createdAt: -1 });
      if (!orders) {
        return res.status(404).send();
      }
      res.send(orders);
    } catch (e) {
      console.log(e);
      res.status(500).send();
    }
  } else {
    res.status(403).send();
  }
});
router.get("/deliveryorders", auth, async (req, res) => {
  if (req.user.type === "Livreur") {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1
      );
      const orders = await Order.find({
        delivery: {
          $eq: req.user._id
        },
        deliveryDate: {
          $gte: today,
          $lt: tomorrow
        }
      })
        .populate({
          path: "products",
          populate: { path: "product", model: "Product" }
        })
        .populate({
          path: "seller",
          select: "fullName phone email place"
        })
        .sort({ createdAt: -1 });
      if (!orders) {
        return res.status(404).send();
      }
      res.send(orders);
    } catch (e) {
      console.log(e);
      res.status(500).send();
    }
  } else {
    res.status(403).send();
  }
});

//delivery guy feedback for an order, if it's delivery or failed

router.patch("/delivery/:id", auth, async (req, res) => {
  if (req.user.type === "Livreur") {
    try {
      const { status, deliveryFeedback } = req.body;
      const orderId = req.params.id;
      const order = await Order.updateOne(
        {
          _id: orderId
        },
        {
          $set: {
            status: status,
            deliveryFeedback: deliveryFeedback
          }
        }
      );
      res.send(order);
    } catch (e) {
      res.status(400).send(e);
    }
  } else {
    res.status(403).send();
  }
});

//delivery guy stats
// total, success, failed, hold orders

router.get("/deliverystats", auth, async (req, res) => {
  if (req.user.type === "Livreur") {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1
      );
      const totalOrders = await Order.find({
        delivery: {
          $eq: req.user._id
        },
        deliveryDate: {
          $gte: today,
          $lt: tomorrow
        }
      }).count();

      const failedOrders = await Order.find({
        delivery: {
          $eq: req.user._id
        },
        deliveryDate: {
          $gte: today,
          $lt: tomorrow
        },
        status: {
          $eq: "Failed"
        }
      }).count();

      const succeedOrders = await Order.find({
        delivery: {
          $eq: req.user._id
        },
        deliveryDate: {
          $gte: today,
          $lt: tomorrow
        },
        status: {
          $eq: "Succeed"
        }
      }).count();
      const holdOrders = await Order.find({
        delivery: {
          $eq: req.user._id
        },
        deliveryDate: {
          $gte: today,
          $lt: tomorrow
        },
        status: {
          $eq: "Hold"
        }
      }).count();
      const stats = { totalOrders, failedOrders, succeedOrders, holdOrders };
      res.status(200).send(stats);
    } catch (e) {
      console.log(e);
      res.status(500).send();
    }
  } else {
    res.status(403).send();
  }
});

module.exports = router;
