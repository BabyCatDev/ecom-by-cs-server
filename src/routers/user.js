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

//Shows Profile of the user who's logged in
router.get("/user", auth, async (req, res) => {
  res.send(req.user);
});

// //Update My Profile
// router.patch('/user/me', auth, async (req, res) => {
//   const { fullName, country, city, age, sexe, isCompleted } = req.body
//   const updates = Object.keys({ fullName, country, city, age, sexe })
//   const allowedUpdates = [
//     'fullName',
//     'country',
//     'city',
//     'age',
//     'sexe'
//   ]
//   const isValidOperation = updates.every((update) => {
//     return allowedUpdates.includes(update)
//   })
//
//   if (!isValidOperation) {
//     return res.status(400).send({ error: 'Invalid updates' })
//   }
//
//   try {
//     updates.forEach((update) => req.user[update] = { fullName, country, city, age, sexe }[update])
//     req.user.isCompleted = true
//     await req.user.save()
//     res.send(req.user)
//
//   } catch (e) {
//     res.status(400).send(e)
//   }
// })
// //generate Password
// router.patch('/password', auth, async (req, res) => {
//
//   const { password, newPassword } = req.body
//   //Verifying password
//
//   const isMatch = await bcrypt.compare(password, req.user.password)
//   if (isMatch) {
//     User.findOne({ _id: req.user._id }).then((user) => {
//
//       //Set the new password
//       user.password = req.body.newPassword;
//
//       // Save
//       user.save((err) => {
//         if (err)
//           return res.status(500).json({ message: err.message })
//
//       })
//     })
//   } else {
//
//     res.status(401).send({ message: 'Password is not correct.' })
//   }
// })

module.exports = router;
