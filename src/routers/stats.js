const express = require("express");
const Order = require("../models/order");
const auth = require("../middleware/auth");
const dayjs = require("dayjs");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
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
          $eq: req.user._id,
        },
        deliveryDate: {
          $gte: today,
          $lt: tomorrow,
        },
        status: { $ne: "Reported" },
      }).count();

      const failedOrders = await Order.find({
        delivery: {
          $eq: req.user._id,
        },
        deliveryDate: {
          $gte: today,
          $lt: tomorrow,
        },
        status: {
          $eq: "Failed",
        },
      }).count();

      const succeedOrders = await Order.find({
        delivery: {
          $eq: req.user._id,
        },
        deliveryDate: {
          $gte: today,
          $lt: tomorrow,
        },
        status: {
          $eq: "Succeed",
        },
      }).count();
      const holdOrders = await Order.find({
        delivery: {
          $eq: req.user._id,
        },
        deliveryDate: {
          $gte: today,
          $lt: tomorrow,
        },
        status: {
          $eq: "Hold",
        },
        postponed: {
          $eq: false,
        },
      }).count();
      /////////
      //Realized income
      const realizedIncomeData = await Order.find({
        delivery: {
          $eq: req.user._id,
        },
        deliveryDate: {
          $gte: today,
          $lt: tomorrow,
        },
        status: {
          $eq: "Succeed",
        },
      }).populate({
        path: "products",
        populate: { path: "product", model: "Product" },
      });
      const turnoverRealized = realizedIncomeData.reduce(
        (acc, order) =>
          acc +
          order.products.reduce(
            (acc2, pDetail) => acc2 + pDetail.quantity * pDetail.sellingPrice,
            0
          ),
        0
      );
      //Failed turnover
      const failedTurnoverData = await Order.find({
        delivery: {
          $eq: req.user._id,
        },
        deliveryDate: {
          $gte: today,
          $lt: tomorrow,
        },
        status: {
          $eq: "Failed",
        },
      }).populate({
        path: "products",
        populate: { path: "product", model: "Product" },
      });
      const failedTurnover = failedTurnoverData.reduce(
        (acc, order) =>
          acc +
          order.products.reduce(
            (acc2, pDetail) => acc2 + pDetail.quantity * pDetail.sellingPrice,
            0
          ),
        0
      );
      //////
      const stats = {
        totalOrders,
        failedOrders,
        succeedOrders,
        holdOrders,
        turnoverRealized,
        failedTurnover,
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

router.get("/deliverystats/weekly", auth, async (req, res) => {
  if (req.user.type === "Livreur") {
    try {
      let { start, end } = req.query;

      if (!start && !end) {
        res.status(400).send();
      }

      start = new Date(start);
      start = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      end = new Date(end);
      end = new Date(end.getFullYear(), end.getMonth(), end.getDate());

      const succeedOrders = await Order.find({
        delivery: {
          $eq: req.user._id,
        },
        deliveryDate: {
          $gte: start,
          $lte: end,
        },
        status: {
          $eq: "Succeed",
        },
      }).count();

      //Realized income
      const realizedIncomeData = await Order.find({
        delivery: {
          $eq: req.user._id,
        },
        deliveryDate: {
          $gte: start,
          $lt: end,
        },
        status: {
          $eq: "Succeed",
        },
      }).populate({
        path: "products",
        populate: { path: "product", model: "Product" },
      });

      const realizedIncome = realizedIncomeData.reduce(
        (acc, order) =>
          acc +
          order.products.reduce(
            (acc2, pDetail) => acc2 + pDetail.quantity * pDetail.sellingPrice,
            0
          ),
        0
      );


      res.status(200).json({
        succeedOrders,
        realizedIncome,
      });
    } catch (error) {
      console.log({ error });
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
          $eq: req.user._id,
        },
        deliveryDate: {
          $gte: req.query.fromDate || today,
          $lt: req.query.toDate || tomorrow,
        },
      }).count();

      const failedOrders = await Order.find({
        seller: {
          $eq: req.user._id,
        },
        deliveryDate: {
          $gte: req.query.fromDate || today,
          $lt: req.query.toDate || tomorrow,
        },
        status: {
          $eq: "Failed",
        },
      }).count();

      const succeedOrders = await Order.find({
        seller: {
          $eq: req.user._id,
        },
        deliveryDate: {
          $gte: req.query.fromDate || today,
          $lt: req.query.toDate || tomorrow,
        },
        status: {
          $eq: "Succeed",
        },
      }).count();
      const holdOrders = await Order.find({
        seller: {
          $eq: req.user._id,
        },
        deliveryDate: {
          $gte: req.query.fromDate || today,
          $lt: req.query.toDate || tomorrow,
        },
        status: {
          $eq: "Hold",
        },
      }).count();
      //Realized income
      const realizedIncomeData = await Order.find({
        seller: {
          $eq: req.user._id,
        },
        deliveryDate: {
          $gte: req.query.fromDate || today,
          $lt: req.query.toDate || tomorrow,
        },
        status: {
          $eq: "Succeed",
        },
      }).populate({
        path: "products",
        populate: { path: "product", model: "Product" },
      });
      const realizedIncome = realizedIncomeData.reduce(
        (acc, order) =>
          acc +
          order.products.reduce(
            (acc2, pDetail) => acc2 + pDetail.quantity * pDetail.sellingPrice,
            0
          ),
        0
      );
      const averageIncome = realizedIncome / totalOrders;
      //Potential income
      const potentialIncomeData = await Order.find({
        seller: {
          $eq: req.user._id,
        },
        deliveryDate: {
          $gte: req.query.fromDate || today,
          $lt: req.query.toDate || tomorrow,
        },
      }).populate({
        path: "products",
        populate: { path: "product", model: "Product" },
      });
      const potentialIncome = potentialIncomeData.reduce(
        (acc, order) =>
          acc +
          order.products.reduce(
            (acc2, pDetail) => acc2 + pDetail.quantity * pDetail.sellingPrice,
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
        potentialAverage,
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
      // sum the counts of period
      const fromDate = new Date(req.query.fromDate);
      const toDate = new Date(req.query.toDate);
      const sumDays = await Order.aggregate([
        {
          $match: {
            createdAt: {
              $gte: req.query.fromDate ? fromDate : today,
              $lt: req.query.toDate ? toDate : tomorrow,
            },
            postponed: {
              $eq: false,
            },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $group: { _id: null, sum: { $sum: "$count" } } },
      ]);
      const extractedSumDays = sumDays.length > 0 ? sumDays[0].sum : 0;
      const parsedFromDate = dayjs(fromDate);
      const parsedToDate = dayjs(toDate);

      const dayBefore = new Date(
        toDate.getFullYear(),
        toDate.getMonth(),
        toDate.getDate() - 1
      );

      const datesDifference =
        parsedToDate.diff(parsedFromDate, "days") -
        getTotalSundays(fromDate, dayBefore);

      const averageDaily = extractedSumDays / (datesDifference || 1);

      const percentageAllDailyDeliveries = await Order.aggregate([
        {
          $match: {
            deliveryDate: {
              $gte: req.query.fromDate ? new Date(req.query.fromDate) : today,
              $lt: req.query.toDate ? new Date(req.query.toDate) : tomorrow,
            },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$deliveryDate" },
            },
            count: { $sum: 1 },
          },
        },
      ]);
      const percentageSuccDailyDeliveries = await Order.aggregate([
        {
          $match: {
            deliveryDate: {
              $gte: req.query.fromDate ? new Date(req.query.fromDate) : today,
              $lt: req.query.toDate ? new Date(req.query.toDate) : tomorrow,
            },
            status: {
              $eq: "Succeed",
            },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$deliveryDate" },
            },
            count: { $sum: 1 },
          },
        },
      ]);
      const percentageDailyDeliveriesItems =
        percentageAllDailyDeliveries.reduce((acc, pa) => {
          let succ = percentageSuccDailyDeliveries.find(
            (ps) => ps._id.toString() === pa._id.toString()
          );
          const succVal = succ || { count: 0 };
          return (succVal.count / pa.count) * 100 + acc;
        }, 0);

      const percentageDailyDeliveries =
        percentageDailyDeliveriesItems / (datesDifference || 1);
      /////////
      const totalEnteredOrders = await Order.find({
        deliveryDate: {
          $gte: req.query.fromDate || today,
          $lt: req.query.toDate || tomorrow,
        },
        postponed: {
          $eq: false,
        },
      }).count();
      const totalOrders = await Order.find({
        deliveryDate: {
          $gte: req.query.fromDate || today,
          $lt: req.query.toDate || tomorrow,
        },
      }).count();

      const failedOrders = await Order.find({
        deliveryDate: {
          $gte: req.query.fromDate || today,
          $lt: req.query.toDate || tomorrow,
        },
        status: {
          $eq: "Failed",
        },
      }).count();

      const succeedOrders = await Order.find({
        deliveryDate: {
          $gte: req.query.fromDate || today,
          $lt: req.query.toDate || tomorrow,
        },
        status: {
          $eq: "Succeed",
        },
      }).count();

      const holdOrders = await Order.find({
        deliveryDate: {
          $gte: req.query.fromDate || today,
          $lt: req.query.toDate || tomorrow,
        },
        status: {
          $eq: "Hold",
        },
      }).count();

      const turnoverRealizedData = await Order.find({
        deliveryDate: {
          $gte: req.query.fromDate || today,
          $lt: req.query.toDate || tomorrow,
        },
        status: {
          $eq: "Succeed",
        },
      }).populate({
        path: "products",
        populate: { path: "product", model: "Product" },
      });
      const turnoverRealized = turnoverRealizedData.reduce(
        (acc, order) =>
          acc +
          order.products.reduce(
            (acc2, pDetail) => acc2 + pDetail.quantity * pDetail.sellingPrice,
            0
          ),
        0
      );
      const failedTurnoverData = await Order.find({
        deliveryDate: {
          $gte: req.query.fromDate || today,
          $lt: req.query.toDate || tomorrow,
        },
        status: {
          $eq: "Failed",
        },
      }).populate({
        path: "products",
        populate: { path: "product", model: "Product" },
      });
      const failedTurnover = failedTurnoverData.reduce(
        (acc, order) =>
          acc +
          order.products.reduce(
            (acc2, pDetail) => acc2 + pDetail.quantity * pDetail.sellingPrice,
            0
          ),
        0
      );

      const stats = {
        totalOrders,
        failedOrders,
        succeedOrders,
        holdOrders,
        turnoverRealized,
        failedTurnover,
        averageDaily: averageDaily,
        percentageDailyDeliveries,
        totalEnteredOrders,
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
          $eq: userId,
        },
        deliveryDate: {
          $gte: req.query.fromDate || today,
          $lt: req.query.toDate || tomorrow,
        },
        status: { $ne: "Reported" },
      }).count();

      const failedOrders = await Order.find({
        delivery: {
          $eq: userId,
        },
        deliveryDate: {
          $gte: req.query.fromDate || today,
          $lt: req.query.toDate || tomorrow,
        },
        status: {
          $eq: "Failed",
        },
      }).count();

      const succeedOrders = await Order.find({
        delivery: {
          $eq: userId,
        },
        deliveryDate: {
          $gte: req.query.fromDate || today,
          $lt: req.query.toDate || tomorrow,
        },
        status: {
          $eq: "Succeed",
        },
      }).count();

      const holdOrders = await Order.find({
        delivery: {
          $eq: userId,
        },
        deliveryDate: {
          $gte: req.query.fromDate || today,
          $lt: req.query.toDate || tomorrow,
        },
        status: {
          $eq: "Hold",
        },
      }).count();

      //Realized income
      const realizedIncomeData = await Order.find({
        delivery: {
          $eq: userId,
        },
        deliveryDate: {
          $gte: req.query.fromDate || today,
          $lt: req.query.toDate || tomorrow,
        },
        status: {
          $eq: "Succeed",
        },
      }).populate({
        path: "products",
        populate: { path: "product", model: "Product" },
      });
      const turnoverRealized = realizedIncomeData.reduce(
        (acc, order) =>
          acc +
          order.products.reduce(
            (acc2, pDetail) => acc2 + pDetail.quantity * pDetail.sellingPrice,
            0
          ),
        0
      );
      //Failed turnover
      const failedTurnoverData = await Order.find({
        delivery: {
          $eq: userId,
        },
        deliveryDate: {
          $gte: req.query.fromDate || today,
          $lt: req.query.toDate || tomorrow,
        },
        status: {
          $eq: "Failed",
        },
      }).populate({
        path: "products",
        populate: { path: "product", model: "Product" },
      });
      const failedTurnover = failedTurnoverData.reduce(
        (acc, order) =>
          acc +
          order.products.reduce(
            (acc2, pDetail) => acc2 + pDetail.quantity * pDetail.sellingPrice,
            0
          ),
        0
      );
      /////////////
      const fromDate = new Date(req.query.fromDate);
      const toDate = new Date(req.query.toDate);
      const sumDays = await Order.aggregate([
        {
          $match: {
            delivery: {
              $eq: new mongoose.Types.ObjectId(userId),
            },
            createdAt: {
              $gte: req.query.fromDate ? fromDate : today,
              $lt: req.query.toDate ? toDate : tomorrow,
            },
            postponed: {
              $eq: false,
            },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $group: { _id: null, sum: { $sum: "$count" } } },
      ]);

      const extractedSumDays = sumDays.length > 0 ? sumDays[0].sum : 0;
      const parsedFromDate = dayjs(fromDate);
      const parsedToDate = dayjs(toDate);

      const dayBefore = new Date(
        toDate.getFullYear(),
        toDate.getMonth(),
        toDate.getDate() - 1
      );

      const datesDifference =
        parsedToDate.diff(parsedFromDate, "days") -
        getTotalSundays(fromDate, dayBefore);

      const averageDaily = extractedSumDays / (datesDifference || 1);

      ///////
      const percentageAllDailyDeliveries = await Order.aggregate([
        {
          $match: {
            delivery: {
              $eq: new mongoose.Types.ObjectId(userId),
            },
            deliveryDate: {
              $gte: req.query.fromDate ? new Date(req.query.fromDate) : today,
              $lt: req.query.toDate ? new Date(req.query.toDate) : tomorrow,
            },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$deliveryDate" },
            },
            count: { $sum: 1 },
          },
        },
      ]);
      const percentageSuccDailyDeliveries = await Order.aggregate([
        {
          $match: {
            delivery: {
              $eq: new mongoose.Types.ObjectId(userId),
            },
            deliveryDate: {
              $gte: req.query.fromDate ? new Date(req.query.fromDate) : today,
              $lt: req.query.toDate ? new Date(req.query.toDate) : tomorrow,
            },
            status: {
              $eq: "Succeed",
            },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$deliveryDate" },
            },
            count: { $sum: 1 },
          },
        },
      ]);
      const percentageDailyDeliveriesItems =
        percentageAllDailyDeliveries.reduce((acc, pa) => {
          let succ = percentageSuccDailyDeliveries.find(
            (ps) => ps._id.toString() === pa._id.toString()
          );
          const succVal = succ || { count: 0 };
          return (succVal.count / pa.count) * 100 + acc;
        }, 0);
      const percentageDailyDeliveries =
        percentageDailyDeliveriesItems / percentageAllDailyDeliveries.length;
      const stats = {
        totalOrders,
        failedOrders,
        succeedOrders,
        holdOrders,
        turnoverRealized,
        failedTurnover,
        averageDaily,
        percentageDailyDeliveries,
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
      const totalEnteredOrders = await Order.find({
        seller: {
          $eq: userId,
        },
        deliveryDate: {
          $gte: req.query.fromDate || today,
          $lt: req.query.toDate || tomorrow,
        },
        postponed: {
          $eq: false,
        },
      }).count();
      const totalOrders = await Order.find({
        seller: {
          $eq: userId,
        },
        deliveryDate: {
          $gte: req.query.fromDate || today,
          $lt: req.query.toDate || tomorrow,
        },
      }).count();

      const failedOrders = await Order.find({
        seller: {
          $eq: userId,
        },
        deliveryDate: {
          $gte: req.query.fromDate || today,
          $lt: req.query.toDate || tomorrow,
        },
        status: {
          $eq: "Failed",
        },
      }).count();

      const succeedOrders = await Order.find({
        seller: {
          $eq: userId,
        },
        deliveryDate: {
          $gte: req.query.fromDate || today,
          $lt: req.query.toDate || tomorrow,
        },
        status: {
          $eq: "Succeed",
        },
      }).count();

      const holdOrders = await Order.find({
        seller: {
          $eq: userId,
        },
        deliveryDate: {
          $gte: req.query.fromDate || today,
          $lt: req.query.toDate || tomorrow,
        },
        status: {
          $eq: "Hold",
        },
      }).count();

      //Realized income
      const realizedIncomeData = await Order.find({
        seller: {
          $eq: userId,
        },
        deliveryDate: {
          $gte: req.query.fromDate || today,
          $lt: req.query.toDate || tomorrow,
        },
        status: {
          $eq: "Succeed",
        },
      }).populate({
        path: "products",
        populate: { path: "product", model: "Product" },
      });
      const turnoverRealized = realizedIncomeData.reduce(
        (acc, order) =>
          acc +
          order.products.reduce(
            (acc2, pDetail) => acc2 + pDetail.quantity * pDetail.sellingPrice,
            0
          ),
        0
      );

      //all orders
      const allOrders = await Order.find({
        seller: {
          $eq: userId,
        },
        deliveryDate: {
          $gte: req.query.fromDate || today,
          $lt: req.query.toDate || tomorrow,
        },
      }).populate({
        path: "products",
        populate: { path: "company", model: "Company" },
      });
      const percentageCompanies = allOrders
        .flatMap((o) => o.products.map((p) => p.company.name))
        .reduce((total, value) => {
          total[value] = (total[value] || 0) + 1;
          return total;
        }, {});
      //Failed turnover
      const failedTurnoverData = await Order.find({
        seller: {
          $eq: userId,
        },
        deliveryDate: {
          $gte: req.query.fromDate || today,
          $lt: req.query.toDate || tomorrow,
        },
        status: {
          $eq: "Failed",
        },
      }).populate({
        path: "products",
        populate: { path: "product", model: "Product" },
      });
      const failedTurnover = failedTurnoverData.reduce(
        (acc, order) =>
          acc +
          order.products.reduce(
            (acc2, pDetail) => acc2 + pDetail.quantity * pDetail.sellingPrice,
            0
          ),
        0
      );
      const fromDate = new Date(req.query.fromDate);
      const toDate = new Date(req.query.toDate);
      const sumDays = await Order.aggregate([
        {
          $match: {
            seller: {
              $eq: new mongoose.Types.ObjectId(userId),
            },
            createdAt: {
              $gte: req.query.fromDate ? fromDate : today,
              $lt: req.query.toDate ? toDate : tomorrow,
            },
            postponed: {
              $eq: false,
            },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $group: { _id: null, sum: { $sum: "$count" } } },
      ]);

      const extractedSumDays = sumDays.length > 0 ? sumDays[0].sum : 0;
      const parsedFromDate = dayjs(fromDate);
      const parsedToDate = dayjs(toDate);

      const dayBefore = new Date(
        toDate.getFullYear(),
        toDate.getMonth(),
        toDate.getDate() - 1
      );

      const datesDifference =
        parsedToDate.diff(parsedFromDate, "days") -
        getTotalSundays(fromDate, dayBefore);

      const averageDaily = extractedSumDays / (datesDifference || 1);

      //////////

      const percentageAllDailyDeliveries = await Order.aggregate([
        {
          $match: {
            seller: {
              $eq: new mongoose.Types.ObjectId(userId),
            },
            deliveryDate: {
              $gte: req.query.fromDate ? new Date(req.query.fromDate) : today,
              $lt: req.query.toDate ? new Date(req.query.toDate) : tomorrow,
            },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$deliveryDate" },
            },
            count: { $sum: 1 },
          },
        },
      ]);
      const percentageSuccDailyDeliveries = await Order.aggregate([
        {
          $match: {
            seller: {
              $eq: new mongoose.Types.ObjectId(userId),
            },
            deliveryDate: {
              $gte: req.query.fromDate ? new Date(req.query.fromDate) : today,
              $lt: req.query.toDate ? new Date(req.query.toDate) : tomorrow,
            },
            status: {
              $eq: "Succeed",
            },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$deliveryDate" },
            },
            count: { $sum: 1 },
          },
        },
      ]);
      const percentageDailyDeliveriesItems =
        percentageAllDailyDeliveries.reduce((acc, pa) => {
          let succ = percentageSuccDailyDeliveries.find(
            (ps) => ps._id.toString() === pa._id.toString()
          );
          const succVal = succ || { count: 0 };
          return (succVal.count / pa.count) * 100 + acc;
        }, 0);

      const percentageDailyDeliveries =
        percentageDailyDeliveriesItems / percentageAllDailyDeliveries.length;
      const stats = {
        totalOrders,
        failedOrders,
        succeedOrders,
        holdOrders,
        turnoverRealized,
        failedTurnover,
        percentageCompanies,
        totalEnteredOrders,
        averageDaily,
        percentageDailyDeliveries,
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
//
router.get("/adminproductstats/:id", auth, async (req, res) => {
  if (req.user.type === "Administrateur") {
    try {
      const productId = req.params.id;

      let totalOrders = 0;
      let failedOrders = 0;
      let succeedOrders = 0;
      let holdOrders = 0;
      let turnoverRealized = 0;
      let failedTurnover = 0;
      let totalEnteredOrders = 0;

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1
      );

      ///////////////////////////////////////////////////////////////////////

      const totalEnteredOrdersData = await Order.find({
        deliveryDate: {
          $gte: req.query.fromDate || today,
          $lt: req.query.toDate || tomorrow,
        },
        postponed: {
          $eq: false,
        },
      }).populate({
        path: "products",
        populate: { path: "product", model: "Product" },
      });

      totalEnteredOrdersData.forEach((item, i) => {
        item.products.forEach((pr) => {
          if (pr.product._id.toString() === productId) totalEnteredOrders++;
        });
      });
      ///////////////////////////////////////////////////////////////////////

      const totalOrdersData = await Order.find({
        deliveryDate: {
          $gte: req.query.fromDate || today,
          $lt: req.query.toDate || tomorrow,
        },
        status: { $ne: "Reported" },
      }).populate({
        path: "products",
        populate: { path: "product", model: "Product" },
      });

      totalOrdersData.forEach((item, i) => {
        item.products.forEach((pr) => {
          if (pr.product._id.toString() === productId) totalOrders++;
        });
      });
      ///////////////////////////////////////////////////////////////////////

      const succeedData = await Order.find({
        deliveryDate: {
          $gte: req.query.fromDate || today,
          $lt: req.query.toDate || tomorrow,
        },
        status: {
          $eq: "Succeed",
        },
      }).populate({
        path: "products",
        populate: { path: "product", model: "Product" },
      });

      succeedData.forEach((item, i) => {
        item.products.forEach((pr) => {
          if (pr.product._id.toString() === productId) {
            succeedOrders++;
            turnoverRealized += pr.quantity * pr.sellingPrice;
          }
        });
      });
      ///////////////////////////////////////////////////////////////////////

      const holdData = await Order.find({
        deliveryDate: {
          $gte: req.query.fromDate || today,
          $lt: req.query.toDate || tomorrow,
        },
        status: {
          $eq: "Hold",
        },
      }).populate({
        path: "products",
        populate: { path: "product", model: "Product" },
      });

      holdData.forEach((item, i) => {
        item.products.forEach((pr) => {
          if (pr.product._id.toString() === productId) {
            holdOrders++;
          }
        });
      });

      //////////////////////////////////////////////////////////////////////
      const failedOrdersData = await Order.find({
        deliveryDate: {
          $gte: req.query.fromDate || today,
          $lt: req.query.toDate || tomorrow,
        },
        status: {
          $eq: "Failed",
        },
      }).populate({
        path: "products",
        populate: { path: "product", model: "Product" },
      });

      failedOrdersData.forEach((item, i) => {
        item.products.forEach((pr) => {
          if (pr.product._id.toString() === productId) {
            failedOrders++;
            failedTurnover += pr.quantity * pr.sellingPrice;
          }
        });
      });

      //////////////////////////////////////////////////////////////////////
      //all orders
      const allOrders = await Order.find({
        deliveryDate: {
          $gte: req.query.fromDate || today,
          $lt: req.query.toDate || tomorrow,
        },
      })
        .populate({
          path: "seller",
        })
        .populate({
          path: "products",
        });
      const filteredOrders = allOrders.filter((o) =>
        o.products.some((p) => p.product.toString() === productId)
      );
      const percentageSellers = filteredOrders
        .flatMap((o) => o.seller.fullName)
        .reduce((total, value) => {
          total[value] = (total[value] || 0) + 1;
          return total;
        }, {});

      const stats = {
        totalOrders,
        failedOrders,
        succeedOrders,
        holdOrders,
        turnoverRealized,
        failedTurnover,
        percentageSellers,
        totalEnteredOrders,
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

router.get("/admincompanystats/:id", auth, async (req, res) => {
  if (req.user.type === "Administrateur") {
    try {
      const companyId = req.params.id;

      let totalOrders = 0;
      let failedOrders = 0;
      let succeedOrders = 0;
      let holdOrders = 0;
      let turnoverRealized = 0;
      let failedTurnover = 0;
      let totalEnteredOrders = 0;

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1
      );

      const totalEnteredOrdersData = await Order.find({
        deliveryDate: {
          $gte: req.query.fromDate || today,
          $lt: req.query.toDate || tomorrow,
        },
        postponed: {
          $eq: false,
        },
      }).populate({
        path: "products",
        populate: { path: "product", model: "Product" },
      });

      totalEnteredOrdersData.forEach((item, i) => {
        item.products.forEach((pr) => {
          if (pr.company.toString() === companyId) totalEnteredOrders++;
        });
      });
      ///////////////////////////////////////////////////////////////////////
      const totalOrdersData = await Order.find({
        deliveryDate: {
          $gte: req.query.fromDate || today,
          $lt: req.query.toDate || tomorrow,
        },
        status: { $ne: "Reported" },
      }).populate({
        path: "products",
        populate: { path: "product", model: "Product" },
      });

      totalOrdersData.forEach((item, i) => {
        item.products.forEach((pr) => {
          if (pr.company.toString() === companyId) totalOrders++;
        });
      });
      ///////////////////////////////////////////////////////////////////////

      const succeedData = await Order.find({
        deliveryDate: {
          $gte: req.query.fromDate || today,
          $lt: req.query.toDate || tomorrow,
        },
        status: {
          $eq: "Succeed",
        },
      }).populate({
        path: "products",
        populate: { path: "product", model: "Product" },
      });

      succeedData.forEach((item, i) => {
        item.products.forEach((pr) => {
          if (pr.company.toString() === companyId) {
            succeedOrders++;
            turnoverRealized += pr.quantity * pr.sellingPrice;
          }
        });
      });
      ///////////////////////////////////////////////////////////////////////

      const holdData = await Order.find({
        deliveryDate: {
          $gte: req.query.fromDate || today,
          $lt: req.query.toDate || tomorrow,
        },
        status: {
          $eq: "Hold",
        },
      }).populate({
        path: "products",
        populate: { path: "product", model: "Product" },
      });

      holdData.forEach((item, i) => {
        item.products.forEach((pr) => {
          if (pr.company.toString() === companyId) {
            holdOrders++;
          }
        });
      });

      //////////////////////////////////////////////////////////////////////
      const failedOrdersData = await Order.find({
        deliveryDate: {
          $gte: req.query.fromDate || today,
          $lt: req.query.toDate || tomorrow,
        },
        status: {
          $eq: "Failed",
        },
      }).populate({
        path: "products",
        populate: { path: "product", model: "Product" },
      });

      failedOrdersData.forEach((item, i) => {
        item.products.forEach((pr) => {
          if (pr.company.toString() === companyId) {
            failedOrders++;
            failedTurnover += pr.quantity * pr.sellingPrice;
          }
        });
      });

      //////////////////////////////////////////////////////////////////////
      //all orders
      const allOrders = await Order.find({
        deliveryDate: {
          $gte: req.query.fromDate || today,
          $lt: req.query.toDate || tomorrow,
        },
      })
        .populate({
          path: "seller",
        })
        .populate({
          path: "products",
          populate: { path: "product", model: "Product" },
        });
      const filteredOrders = allOrders.filter((o) =>
        o.products.some((p) => p.company.toString() === companyId)
      );
      const percentageSellers = filteredOrders
        .flatMap((o) => o.seller.fullName)
        .reduce((total, value) => {
          total[value] = (total[value] || 0) + 1;
          return total;
        }, {});
      const percentageProducts = filteredOrders
        .flatMap((o) => o.products.map((p) => p.product.name))
        .reduce((total, value) => {
          total[value] = (total[value] || 0) + 1;
          return total;
        }, {});

      const stats = {
        totalOrders,
        failedOrders,
        succeedOrders,
        holdOrders,
        turnoverRealized,
        failedTurnover,
        percentageSellers,
        percentageProducts,
        totalEnteredOrders,
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

const getTotalSundays = (fromDate, dayBefore) => {
  var totalSundays = 0;

  for (var i = fromDate; i <= dayBefore; ) {
    if (i.getDay() == 0) {
      totalSundays++;
    }
    i.setTime(i.getTime() + 1000 * 60 * 60 * 24);
  }
  return totalSundays;
};

module.exports = router;
