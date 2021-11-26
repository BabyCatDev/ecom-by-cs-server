const express = require("express");
const User = require("../models/user");
const Order = require("../models/order");
const OrderDetail = require("../models/orderDetail");
const auth = require("../middleware/auth");
const dayjs = require("dayjs");

const router = new express.Router();

//Create order
router.post("/order", auth, async (req, res) => {
  if (req.user.type === "Commercial") {
    const {
      clientName,
      clientPhones,
      clientAddress,
      deliveryDate,
      delivery,
      productsDetails,
      comments
    } = req.body;
    const products = [];

    const parsedDeliveryDay = dayjs(deliveryDate);
    const datesDifference = parsedDeliveryDay.diff(new Date(), "days");
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
      clientPhones,
      clientAddress,
      deliveryDate,
      delivery,
      comments,
      status: datesDifference === 0 ? "Hold" : "Reported",
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

//Postpone order

router.patch("/order/:id", auth, async (req, res) => {
  if (req.user.type === "Commercial") {
    try {
      const { status, deliveryDate, deliveryFeedback } = req.body;
      const orderId = req.params.id;
      const order = await Order.updateOne(
        {
          _id: orderId
        },
        {
          $set: {
            status: status,
            deliveryDate: deliveryDate,
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
        },
        status: { $ne: "Reported" }
      })
        .populate({
          path: "products",
          populate: { path: "product", model: "Product" }
        })
        .populate({
          path: "delivery",
          select: "fullName phones email place"
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

router.get("/sellerreports", auth, async (req, res) => {
  if (req.user.type === "Commercial") {
    try {
      const orders = await Order.find({
        seller: {
          $eq: req.user._id
        },
        status: { $eq: "Reported" }
      })
        .populate({
          path: "products",
          populate: { path: "product", model: "Product" }
        })
        .populate({
          path: "delivery",
          select: "fullName phones email place"
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
        },
        status: { $ne: "Reported" }
      })
        .populate({
          path: "products",
          populate: { path: "product", model: "Product" }
        })
        .populate({
          path: "seller",
          select: "fullName phones email place"
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
        },
        status: { $ne: "Reported" }
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

router.get("/sellerstats", auth, async (req, res) => {
  if (req.user.type === "Commercial") {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1
      );
      const totalOrders = await Order.find({
        seller: {
          $eq: req.user._id
        },
        deliveryDate: {
          $gte: req.query.fromDate || today,
          $lt: req.query.toDate || tomorrow
        },
        status: { $ne: "Reported" }
      }).count();

      const failedOrders = await Order.find({
        seller: {
          $eq: req.user._id
        },
        deliveryDate: {
          $gte: req.query.fromDate || today,
          $lt: req.query.toDate || tomorrow
        },
        status: {
          $eq: "Failed"
        }
      }).count();

      const succeedOrders = await Order.find({
        seller: {
          $eq: req.user._id
        },
        deliveryDate: {
          $gte: req.query.fromDate || today,
          $lt: req.query.toDate || tomorrow
        },
        status: {
          $eq: "Succeed"
        }
      }).count();
      const holdOrders = await Order.find({
        seller: {
          $eq: req.user._id
        },
        deliveryDate: {
          $gte: req.query.fromDate || today,
          $lt: req.query.toDate || tomorrow
        },
        status: {
          $eq: "Hold"
        }
      }).count();
      //Realized income
      const realizedIncomeData = await Order.find({
        seller: {
          $eq: req.user._id
        },
        deliveryDate: {
          $gte: req.query.fromDate || today,
          $lt: req.query.toDate || tomorrow
        },
        status: {
          $eq: "Succeed"
        }
      }).populate({
        path: "products",
        populate: { path: "product", model: "Product" }
      });
      const realizedIncome = realizedIncomeData.reduce(
        (acc, order) =>
          acc +
          order.products.reduce(
            (acc2, pDetail) => acc2 + pDetail.quantity * pDetail.product.price,
            0
          ),
        0
      );
      const averageIncome = realizedIncome / totalOrders;
      //Potential income
      const potentialIncomeData = await Order.find({
        seller: {
          $eq: req.user._id
        },
        deliveryDate: {
          $gte: req.query.fromDate || today,
          $lt: req.query.toDate || tomorrow
        },
        status: { $ne: "Reported" }
      }).populate({
        path: "products",
        populate: { path: "product", model: "Product" }
      });
      const potentialIncome = potentialIncomeData.reduce(
        (acc, order) =>
          acc +
          order.products.reduce(
            (acc2, pDetail) => acc2 + pDetail.quantity * pDetail.product.price,
            0
          ),
        0
      );

      const potentialAverage = potentialIncome / totalOrders;
      const stats = {
        totalOrders,
        failedOrders,
        succeedOrders,
        holdOrders,
        realizedIncome,
        averageIncome,
        potentialIncome,
        potentialAverage
      };
      res.status(200).send(stats);
    } catch (e) {
      console.log(e);
      res.status(500).send();
    }
  } else {
    res.status(403).send();
  }
});
router.get("/adminstats", auth, async (req, res) => {
  if (req.user.type === "Administrateur") {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1
      );
      const totalOrders = await Order.find({
        deliveryDate: {
          $gte: today,
          $lt: tomorrow
        },
        status: { $ne: "Reported" }
      }).count();

      const failedOrders = await Order.find({
        deliveryDate: {
          $gte: today,
          $lt: tomorrow
        },
        status: {
          $eq: "Failed"
        }
      }).count();

      const succeedOrders = await Order.find({
        deliveryDate: {
          $gte: today,
          $lt: tomorrow
        },
        status: {
          $eq: "Succeed"
        }
      }).count();

      const turnoverRealizedData = await Order.find({
        deliveryDate: {
          $gte: today,
          $lt: tomorrow
        },
        status: {
          $eq: "Succeed"
        }
      }).populate({
        path: "products",
        populate: { path: "product", model: "Product" }
      });
      const turnoverRealized = turnoverRealizedData.reduce(
        (acc, order) =>
          acc +
          order.products.reduce(
            (acc2, pDetail) => acc2 + pDetail.quantity * pDetail.product.price,
            0
          ),
        0
      );
      const failedTurnoverData = await Order.find({
        deliveryDate: {
          $gte: today,
          $lt: tomorrow
        },
        status: {
          $eq: "Succeed"
        }
      }).populate({
        path: "products",
        populate: { path: "product", model: "Product" }
      });
      const failedTurnover = failedTurnoverData.reduce(
        (acc, order) =>
          acc +
          order.products.reduce(
            (acc2, pDetail) => acc2 + pDetail.quantity * pDetail.product.price,
            0
          ),
        0
      );

      const stats = {
        totalOrders,
        failedOrders,
        succeedOrders,
        turnoverRealized,
        failedTurnover
      };
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
