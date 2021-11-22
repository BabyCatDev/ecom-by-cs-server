const express = require("express");
const User = require("../models/user");
const Company = require("../models/company");
const auth = require("../middleware/auth");

const router = new express.Router();

//Create company
router.post("/company", auth, async (req, res) => {
  if (req.user.type === "Administrateur") {
    const company = new Company({ ...req.body });
    try {
      await company.save();
      res.status(201).send({ company });
    } catch (e) {
      res.status(400).send(e);
    }
  } else {
    res.status(403).send();
  }
});

//get companies
router.get("/companies", auth, async (req, res) => {
  if (req.user.type === "Administrateur" || req.user.type === "Commercial") {
    try {
      const companies = await Company.find()
        .populate({ path: "products" })
        .sort({ createdAt: -1 });

      if (!companies) {
        return res.status(404).send();
      }
      res.send(companies);
    } catch (e) {
      console.log(e);
      res.status(500).send();
    }
  } else {
    res.status(403).send();
  }
});

module.exports = router;
