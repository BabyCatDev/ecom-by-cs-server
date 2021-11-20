const mongoose = require("mongoose");

mongoose.connect(process.env.MONGODB_URL, err => {
  if (err) throw err;
  console.log("connected to MongoDB");
});
