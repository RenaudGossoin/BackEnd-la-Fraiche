var express = require("express");
var router = express.Router();
var ArticleModel = require("../models/articles");
var FarmerModel = require("../models/farmers");
var LockerModel = require("../models/lockers");
var OrderModel = require("../models/orders");
var UserModel = require("../models/users");
/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

module.exports = router;
