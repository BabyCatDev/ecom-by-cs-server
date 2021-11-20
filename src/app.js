const express = require("express");
const bodyParser = require("body-parser");
require("./db/mongoose");
const app = express();
//RESTFUL API
const userRouter = require("./routers/user");

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());
// Routes
app.use(userRouter);

const port = process.env.PORT;

app.listen(port, () => {
  console.log("Server is up on port : " + port);
});
