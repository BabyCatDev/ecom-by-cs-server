const express = require("express");
const User = require("../models/user");
const Order = require("../models/order");
const Product = require("../models/product");
const OrderDetail = require("../models/orderDetail");
const auth = require("../middleware/auth");
const dayjs = require("dayjs");
const { Expo } = require("expo-server-sdk");
let expo = new Expo();

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

    //update stock
    const stockPromises = productsDetails.map(async (item, i) => {
      await Product.updateOne(
        {
          _id: item.productId
        },
        { $inc: { stock: -item.quantity } }
      );
    });
    await Promise.all(stockPromises);
    //Creating orderDetails
    const promises = productsDetails.map(async (item, i) => {
      const orderTemp = new OrderDetail({
        product: item.productId,
        quantity: item.quantity,
        company: item.companyId,
        sellingPrice: item.price
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
//update order
router.patch("/order/:id", auth, async (req, res) => {
  if (req.user.type === "Commercial") {
    try {
      const orderId = req.params.id;
      const {
        clientName,
        clientPhones,
        clientAddress,
        deliveryDate,
        delivery,
        comments,
        productsDetails,
        oldProducts,
        oldDelivery,
        toBeDeletedProducts
      } = req.body;
      const products = [];

      ///deleting the very old ones
      await OrderDetail.deleteMany({ _id: toBeDeletedProducts });

      //update stock
      const stockPromises = productsDetails.map(async (item, i) => {
        await Product.updateOne(
          {
            _id: item.productId
          },
          { $inc: { stock: -parseInt(item.quantity) } }
        );
      });
      await Promise.all(stockPromises);
      //update stock
      const stockPromises2 = oldProducts.map(async (item, i) => {
        await Product.updateOne(
          {
            _id: item.productId
          },
          { $inc: { stock: parseInt(item.quantity) } }
        );
      });
      await Promise.all(stockPromises2);
      ///creting new ones
      const promises = productsDetails.map(async (item, i) => {
        const orderTemp = new OrderDetail({
          product: item.productId,
          quantity: item.quantity,
          company: item.companyId,
          sellingPrice: item.price
        });

        try {
          const result = await orderTemp.save();
          products.push(result._id);
        } catch (e) {
          console.log(e);
        }
      });
      await Promise.all(promises);
      ///////////////////////

      //Updating order with orderDetail items

      const parsedDeliveryDay = dayjs(deliveryDate);
      const datesDifference = parsedDeliveryDay.diff(new Date(), "days");
      const order = await Order.updateOne(
        {
          _id: orderId
        },
        {
          $set: {
            status: datesDifference === 0 ? "Hold" : "Reported",
            products,
            oldProducts: oldProducts.map(o => o._id),
            updated: true,
            clientName,
            clientPhones,
            clientAddress,
            deliveryDate,
            delivery,
            comments
          }
        }
      );
      if (oldDelivery !== delivery) {
        await User.updateOne(
          {
            _id: oldDelivery
          },
          {
            $pull: {
              orders: orderId
            }
          }
        );
        await User.updateOne(
          {
            _id: delivery
          },
          {
            $addToSet: {
              orders: orderId
            }
          }
        );
      }

      res.send(order);
    } catch (e) {
      res.status(400).send(e);
    }
  } else {
    res.status(403).send();
  }
});

//Postpone order

router.patch("/postpone/:id", auth, async (req, res) => {
  if (req.user.type === "Commercial") {
    try {
      const { status, deliveryDate, deliveryFeedback } = req.body;
      const orderId = req.params.id;
      if (status === "Failed" || status === "Hold") {
        ////////////////////////////////
        ////GET ORDER WITH POPULATE SUBORDERS
        const oldOrder = await Order.findById(orderId)
          .populate({
            path: "products"
          })
          .exec();
        ////UPDATE THAT ORDER
        const updateOrder = await Order.updateOne(
          {
            _id: orderId
          },
          {
            $set: {
              postponed: true
            }
          }
        );

        ////CREATE NEW ORDER FROM OLD ORDER DATA
        const {
          clientName,
          clientPhones,
          clientAddress,
          delivery,
          products,
          comments
        } = oldOrder;
        const productsItems = [];

        const parsedDeliveryDay = dayjs(deliveryDate);
        const datesDifference = parsedDeliveryDay.diff(new Date(), "days");
        //Creating orderDetails
        const promises = products.map(async (item, i) => {
          const orderTemp = new OrderDetail({
            product: item.product,
            quantity: item.quantity,
            company: item.company,
            sellingPrice: item.sellingPrice
          });

          try {
            const result = await orderTemp.save();
            productsItems.push(result._id);
          } catch (e) {
            console.log(e);
          }
        });
        await Promise.all(promises);
        //Creating order with orderDetail items
        const order = new Order({
          products: productsItems,
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
        ///////////////////////////////
      } else {
        const parsedDeliveryDay = dayjs(deliveryDate);
        const datesDifference = parsedDeliveryDay.diff(new Date(), "days");
        const order = await Order.updateOne(
          {
            _id: orderId
          },
          {
            $set: {
              status: datesDifference === 0 ? "Hold" : "Reported",
              deliveryDate: deliveryDate,
              deliveryFeedback: deliveryFeedback
            }
          }
        );
        res.send(order);
      }
    } catch (e) {
      res.status(400).send(e);
    }
  } else {
    res.status(403).send();
  }
});

router.patch("/confirm/:id", auth, async (req, res) => {
  if (req.user.type === "Commercial") {
    try {
      const { deliveryDate } = req.body;
      const orderId = req.params.id;
      const order = await Order.updateOne(
        {
          _id: orderId
        },
        {
          $set: {
            status: "Hold",
            deliveryDate: deliveryDate
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
router.patch("/reassign/:id", auth, async (req, res) => {
  if (req.user.type === "Commercial") {
    try {
      const { newSeller } = req.body;
      const orderId = req.params.id;
      const order = await Order.updateOne(
        {
          _id: orderId
        },
        {
          $set: {
            seller: newSeller
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
        status: {
          $ne: "Reported"
        }
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

router.get("/sellerfailedorders", auth, async (req, res) => {
  if (req.user.type === "Commercial") {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const orders = await Order.find({
        seller: {
          $eq: req.user._id
        },
        deliveryDate: {
          $lt: today
        },
        $or: [{ status: "Failed" }, { status: "Hold" }],
        postponed: {
          $eq: false
        }
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

router.get("/admindeliveryorders/:id", auth, async (req, res) => {
  if (req.user.type === "Administrateur") {
    try {
      const deliveryId = req.params.id;
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1
      );
      const orders = await Order.find({
        delivery: {
          $eq: deliveryId
        },
        deliveryDate: {
          $gte: req.query.fromDate || today,
          $lt: req.query.toDate || tomorrow
        },
        status: {
          $ne: "Reported"
        }
      })
        .populate({
          path: "products",
          populate: { path: "product", model: "Product" }
        })
        .populate({
          path: "oldProducts",
          populate: { path: "product", model: "Product" }
        })
        .populate({
          path: "seller",
          select: "fullName phones email place"
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

      //find the seller
      const seller = await User.findOne({ _id: req.body.seller });
      //send notifs to his phones
      let messages = [];
      const body =
        req.user.fullName +
        (status === "Failed"
          ? ` n'a pas livré`
          : status === "Succeed"
          ? ` a livré avec succès`
          : ` no info`);

      for (let pushToken of seller.notifPushTokens) {
        if (!Expo.isExpoPushToken(pushToken)) {
          console.error(
            `Push token ${pushToken} is not a valid Expo push token`
          );
          continue;
        }
        messages.push({
          to: pushToken,
          sound: "default",
          body
        });
      }
      let chunks = expo.chunkPushNotifications(messages);
      let tickets = [];
      (async () => {
        for (let chunk of chunks) {
          try {
            let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            console.log(ticketChunk);
            tickets.push(...ticketChunk);
          } catch (error) {
            console.error(error);
          }
        }
      })();
      res.send(order);
    } catch (e) {
      console.log(e);
      res.status(400).send(e);
    }
  } else {
    res.status(403).send();
  }
});

module.exports = router;
