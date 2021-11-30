const express = require("express");
const Order = require("../models/order");
const auth = require("../middleware/auth");

const router = new express.Router();

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
      const yesterday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 1
      );
      const yesterdayOrders = await Order.find({
        deliveryDate: {
          $gte: req.query.fromDate || yesterday,
          $lt: req.query.toDate || today
        },
        status: { $ne: "Reported" }
      }).count();
      const totalOrders = await Order.find({
        deliveryDate: {
          $gte: req.query.fromDate || today,
          $lt: req.query.toDate || tomorrow
        },
        status: { $ne: "Reported" }
      }).count();

      const failedOrders = await Order.find({
        deliveryDate: {
          $gte: req.query.fromDate || today,
          $lt: req.query.toDate || tomorrow
        },
        status: {
          $eq: "Failed"
        }
      }).count();

      const succeedOrders = await Order.find({
        deliveryDate: {
          $gte: req.query.fromDate || today,
          $lt: req.query.toDate || tomorrow
        },
        status: {
          $eq: "Succeed"
        }
      }).count();

      const turnoverRealizedData = await Order.find({
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
          $gte: req.query.fromDate || today,
          $lt: req.query.toDate || tomorrow
        },
        status: {
          $eq: "Failed"
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
        failedTurnover,
        yesterdayOrders
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

router.get("/admindeliverystats/:id", auth, async (req, res) => {
  if (req.user.type === "Administrateur") {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1
      );
      const userId = req.params.id;
      const totalOrders = await Order.find({
        delivery: {
          $eq: userId
        },
        deliveryDate: {
          $gte: req.query.fromDate || today,
          $lt: req.query.toDate || tomorrow
        },
        status: { $ne: "Reported" }
      }).count();

      const failedOrders = await Order.find({
        delivery: {
          $eq: userId
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
        delivery: {
          $eq: userId
        },
        deliveryDate: {
          $gte: req.query.fromDate || today,
          $lt: req.query.toDate || tomorrow
        },
        status: {
          $eq: "Succeed"
        }
      }).count();

      //Realized income
      const realizedIncomeData = await Order.find({
        delivery: {
          $eq: userId
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
      const turnoverRealized = realizedIncomeData.reduce(
        (acc, order) =>
          acc +
          order.products.reduce(
            (acc2, pDetail) => acc2 + pDetail.quantity * pDetail.product.price,
            0
          ),
        0
      );
      //Failed turnover
      const failedTurnoverData = await Order.find({
        delivery: {
          $eq: userId
        },
        deliveryDate: {
          $gte: req.query.fromDate || today,
          $lt: req.query.toDate || tomorrow
        },
        status: {
          $eq: "Failed"
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
      // const averageBasket = realizedIncome / totalOrders;

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

router.get("/adminsellerstats/:id", auth, async (req, res) => {
  if (req.user.type === "Administrateur") {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1
      );
      const userId = req.params.id;
      const totalOrders = await Order.find({
        seller: {
          $eq: userId
        },
        deliveryDate: {
          $gte: req.query.fromDate || today,
          $lt: req.query.toDate || tomorrow
        },
        status: { $ne: "Reported" }
      }).count();

      const failedOrders = await Order.find({
        seller: {
          $eq: userId
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
          $eq: userId
        },
        deliveryDate: {
          $gte: req.query.fromDate || today,
          $lt: req.query.toDate || tomorrow
        },
        status: {
          $eq: "Succeed"
        }
      }).count();

      //Realized income
      const realizedIncomeData = await Order.find({
        seller: {
          $eq: userId
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
      const turnoverRealized = realizedIncomeData.reduce(
        (acc, order) =>
          acc +
          order.products.reduce(
            (acc2, pDetail) => acc2 + pDetail.quantity * pDetail.product.price,
            0
          ),
        0
      );
      //Failed turnover
      const failedTurnoverData = await Order.find({
        seller: {
          $eq: userId
        },
        deliveryDate: {
          $gte: req.query.fromDate || today,
          $lt: req.query.toDate || tomorrow
        },
        status: {
          $eq: "Failed"
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

router.get("/adminproductstats/:id", auth, async (req, res) => {
  if (req.user.type === "Administrateur") {
    try {
      const productId = req.params.id;

      let totalOrders = 0;
      let failedOrders = 0;
      let succeedOrders = 0;
      let turnoverRealized = 0;
      let failedTurnover = 0;

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1
      );

      ///////////////////////////////////////////////////////////////////////

      const totalOrdersData = await Order.find({
        deliveryDate: {
          $gte: req.query.fromDate || today,
          $lt: req.query.toDate || tomorrow
        },
        status: { $ne: "Reported" }
      }).populate({
        path: "products",
        populate: { path: "product", model: "Product" }
      });

      totalOrdersData.forEach((item, i) => {
        item.products.forEach(pr => {
          if (pr.product._id.toString() === productId) totalOrders++;
        });
      });
      ///////////////////////////////////////////////////////////////////////

      const succeedData = await Order.find({
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

      succeedData.forEach((item, i) => {
        item.products.forEach(pr => {
          if (pr.product._id.toString() === productId) {
            succeedOrders++;
            turnoverRealized += pr.quantity * pr.product.price;
          }
        });
      });

      //////////////////////////////////////////////////////////////////////
      const failedOrdersData = await Order.find({
        deliveryDate: {
          $gte: req.query.fromDate || today,
          $lt: req.query.toDate || tomorrow
        },
        status: {
          $eq: "Failed"
        }
      }).populate({
        path: "products",
        populate: { path: "product", model: "Product" }
      });

      failedOrdersData.forEach((item, i) => {
        item.products.forEach(pr => {
          if (pr.product._id.toString() === productId) {
            failedOrders++;
            failedTurnover += pr.quantity * pr.product.price;
          }
        });
      });

      //////////////////////////////////////////////////////////////////////

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