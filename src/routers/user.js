const express = require("express");
const User = require("../models/user");
const auth = require("../middleware/auth");
const bcrypt = require("bcryptjs");

const router = new express.Router();

//Create User
router.post("/user", async (req, res) => {
  const user = new User({ ...req.body });
  try {
    await user.save();
    res.status(201).send({ user });
  } catch (e) {
    res.status(400).send(e);
  }
});

//Login User
router.post("/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.username,
      req.body.password
    );
    const token = await user.generateAuthToken();
    res.send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
});

//Logout User
router.post("/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(token => {
      return token.token !== req.token;
    });
    await req.user.save();
    res.send();
  } catch (error) {
    res.status(500).send();
  }
});

router.patch("/user/:id", auth, async (req, res) => {
  if (req.user.type === "Administrateur") {
    try {
      const userId = req.params.id;
      const user = await User.updateOne(
        {
          _id: userId
        },
        {
          $set: {
            ...req.body
          }
        }
      );
      res.send(user);
    } catch (e) {
      res.status(400).send(e);
    }
  } else {
    res.status(403).send();
  }
});

router.delete("/user/:id", auth, async (req, res) => {
  if (req.user.type === "Administrateur") {
    try {
      const userId = req.params.id;
      const user = await User.deleteOne({
        _id: userId
      });
      res.send(user);
    } catch (e) {
      res.status(400).send(e);
    }
  } else {
    res.status(403).send();
  }
});

//Shows Profile of the user who's logged in
router.get("/user", auth, async (req, res) => {
  res.send(req.user);
});

//get users
router.get("/users", auth, async (req, res) => {
  if (req.user.type === "Administrateur" || req.user.type === "Commercial") {
    try {
      const users = await User.find().sort({ createdAt: -1 });
      if (!users) {
        return res.status(404).send();
      }
      res.send(users);
    } catch (e) {
      res.status(500).send();
    }
  } else {
    res.status(403).send();
  }
});

//update Password
router.patch("/password/:id", auth, async (req, res) => {
  if (req.user.type === "Administrateur") {
    const { password } = req.body;
    const { id } = req.params;
    //find user
    User.findOne({ _id: id }).then(user => {
      //Set the new password
      user.password = password;

      // Save
      user.save(err => {
        if (err) return res.status(500).json({ message: err.message });

        res
          .status(200)
          .json({ message: "The password of this user has been updated." });
      });
    });
    res.status(200).send(user);
  } else {
    res.status(403).send();
  }
});

module.exports = router;
