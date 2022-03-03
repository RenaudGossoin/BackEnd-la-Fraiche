var express = require("express");
var router = express.Router();
var ArticleModel = require("../models/articles");
var FarmerModel = require("../models/farmers");
var LockerModel = require("../models/lockers");
var OrderModel = require("../models/orders");
var UserModel = require("../models/users");

var uid2 = require("uid2");
var bcrypt = require("bcrypt");
/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

/*sign-up screen*/
router.post("/sign-up", async function (req, res, next) {
  var error = [];
  var result = false;
  var saveUser = null;
  var token = null;

  const data = await UserModel.findOne({
    email: req.body.email.toLowerCase(),
  });

  if (data != null) {
    error.push("utilisateur déjà présent");
  }

  if (
    req.body.username == "" ||
    req.body.email == "" ||
    req.body.password == "" ||
    req.body.departement == ""
  ) {
    error.push("champs vides");
  }

  if (error.length == 0) {
    var hash = bcrypt.hashSync(req.body.password, 10);
    var newUser = new UserModel({
      username: req.body.username.toLowerCase(),
      email: req.body.email.toLowerCase(),
      password: hash,
      departement: req.body.departement,
      token: uid2(32),
      orders: [],
    });

    saveUser = await newUser.save();

    if (saveUser) {
      result = true;
      token = saveUser.token;
    }
  }

  res.json({ result, saveUser, error, token });
});

/*sign-in screen*/
router.post("/sign-in", async function (req, res, next) {
  var result = false;
  var user = null;
  var error = [];
  var token = null;

  if (req.body.email == "" || req.body.password == "") {
    error.push("champs vides");
  }

  if (error.length == 0) {
    const user = await UserModel.findOne({
      email: req.body.email,
    });

    if (user) {
      if (bcrypt.compareSync(req.body.password, user.password)) {
        result = true;
        token = user.token;
      } else {
        result = false;
        error.push("mot de passe incorrect");
      }
    } else {
      error.push("email incorrect");
    }
  }

  res.json({ result, user, error, token });
});

/*route pour afficher les produits sur la products Screen
Je vais une recherche du token de l'user, ce qui me permets de voir sil'user est connecté, 
il faudra stocker dans le store son token lors de sa connection ou inscritpion et le lire
dans la Producst screen. Si l'user est connecté (donc non null), je fais une recherche des fermes dont le département
est égal au dép de l'user et je populate avec articles (clé étrangère du model farmer)
Sinon si l'user n'est pas connecté, il a rentré son code postal dans la page home, il faudra le stocker
dans le store redux et l'afficher à la page Products screen et l'imposer en condition contraire */
router.get("/articles", async function (req, res, next) {
  var articles = [];
  let result = [];
  var user = await UserModel.findOne({ token: req.query.token });
  var cities = await FarmerModel.find({ departement: req.query.departement });

  if (user != null) {
    result = await FarmerModel.find({
      departement: user.departement,
    })
      .populate("articles")
      .exec();
    for (let i = 0; i < result.length; i++) {
      articles.push(result[i].articles);
    }
  } else if (user == null && cities != null) {
    result = await FarmerModel.find({
      departement: req.query.departement,
    })
      .populate("articles")
      .exec();

    for (let i = 0; i < result.length; i++) {
      articles.push(result[i].articles);
    }
  }
  console.log(articles);
  console.log(cities);

  res.json({ articles, cities });
});

router.post("/orders", async function (req, res, next) {
  var result = false;

  var user = await UserModel.findOne({ token: req.body.token });

  if (user != null) {
    var newOrder = new OrderModel({
      totalOrder: req.body.totalorder,
      shippingCost: req.body.shippingCost,
      date_insert: req.body.date_insert,
      date_shipment: req.body.date_shipment,
      articles: req.body.articles,
      locker: req.body.locker,
    });

    var orderSave = await newOrder.save();

    if (orderSave) {
      result = true;
    }

    var user = await UserModel.updateOne(
      { token: req.body.token },
      { orders: orderSave }
    );
    console.log(orderSave);
  }

  res.json({ result });
});

/*recherche dans la bdd des lockers correspondant au departement de l'utilisateur */
router.get("/lockers", async function (req, res, next) {
  var result = [];

  var data = await LockerModel.find({ departement: req.query.departement });

  if (data != null) {
    result = await LockerModel.find({
      departement: req.query.departement,
    });
  }
  //console.log(result);

  res.json({ result });
});

/*route pour afficher les infos de l'user et ses commandes dans la page account */
router.get("/account", async function (req, res, next) {
  var orders = [];
  let info;
  var user = await UserModel.findOne({ token: req.query.token });

  if (user != null) {
    info = await UserModel.find({ token: req.query.token });
    result = await UserModel.find({
      token: req.query.token,
    })
      .populate("orders")
      .exec();
    for (let i = 0; i < result.length; i++) {
      orders.push(result[i].orders);
    }
  }
  console.log(orders);
  console.log(info);

  res.json({ orders, info });
});

/*Route pour afficher le détail d'un produit dans la page detail Screen */
router.get("/detail-product", async function (req, res, next) {
  var detailArticle;

  var data = await ArticleModel.findById(req.query.id);

  if (data != null) {
    detailArticle = await ArticleModel.findById(req.query.id);
  }
  console.log(detailArticle);

  res.json({ detailArticle });
});

module.exports = router;
