const express = require("express");
const User = require("../models/user");
const Product = require("../models/product");
const Company = require("../models/company");
const auth = require("../middleware/auth");

const router = new express.Router();

//Create product
router.post("/product", auth, async (req, res) => {
  if (req.user.type === "Administrateur") {
    const { name, price, companyId } = req.body;
    const product = new Product({ name, price });

    try {
      const result = await product.save();
      const company = await Company.updateOne(
        {
          _id: companyId
        },
        {
          $addToSet: {
            products: result._id
          }
        }
      );
      res.status(201).send({ product });
    } catch (e) {
      res.status(400).send(e);
    }
  } else {
    res.status(403).send();
  }
});

//Get products
router.get("/products", auth, async (req, res) => {
  if (req.user.type === "Administrateur") {
    try {
      const products = await Product.find().sort({ createdAt: -1 });
      if (!products) {
        return res.status(404).send();
      }
      res.send(products);
    } catch (e) {
      res.status(500).send();
    }
  } else {
    res.status(403).send();
  }
});

module.exports = router;
