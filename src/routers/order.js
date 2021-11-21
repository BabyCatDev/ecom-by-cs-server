const express = require("express");
const User = require("../models/user");
const Order = require("../models/order");
const auth = require("../middleware/auth");

const router = new express.Router();

//Create order
router.post("/order", auth, async (req, res) => {
  if (req.user.type === "Commercial") {
    const order = new Order({ ...req.body, seller: req.user._id });
    const delivery = req.body.delivery;
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
      const orders = await Order.find({
        seller: {
          $eq: req.user._id
        }
      })
        .populate({
          path: "products"
        })
        .populate({
          path: "delivery"
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
      const orders = await Order.find({
        delivery: {
          $eq: req.user._id
        }
      })
        .populate({
          path: "products"
        })
        .populate({
          path: "seller"
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

module.exports = router;
