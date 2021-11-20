const express = require("express");
const bodyParser = require("body-parser");
require("./db/mongoose");
const app = express();
//RESTFUL API
const userRouter = require("./routers/user");
const companyRouter = require("./routers/company");
const productRouter = require("./routers/product");

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());
// Routes
app.use(userRouter);
app.use(companyRouter);
app.use(productRouter);

const port = process.env.PORT;

app.listen(port, () => {
  console.log("Server is up on port : " + port);
});
