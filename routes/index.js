var express = require("express");
var router = express.Router();
var ArticleModel = require("../models/articles");
var FarmerModel = require("../models/farmers");
var LockerModel = require("../models/lockers");
var OrderModel = require("../models/orders");
var UserModel = require("../models/users");

var uid2 = require("uid2");
var bcrypt = require("bcrypt");
/*test*/
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
      email: req.body.email.toLowerCase(),
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
  var categorieName = await ArticleModel.find({
    categorie: req.query.categorie,
  });
  //test commentaire
  if (user != null) {
    result = await FarmerModel.find({
      departement: user.departement,
    })
      .populate("articles")
      .exec();

    for (let i = 0; i < result.length; i++) {
      articles = [...articles, ...result[i].articles];
    }
  }

  console.log("tout le req", req.query);
  if (cities != null) {
    result = await FarmerModel.find({
      departement: req.query.departement,
    })
      .populate("articles")
      .exec();

    for (let i = 0; i < result.length; i++) {
      articles = [...articles, ...result[i].articles];
    }
  }
  var articlesFilter = articles.filter(
    (element) => element.categorie === req.query.categorie
  );

  //console.log("test: ", articlesFilter);

  res.json({ articlesFilter, cities, user });
});

router.post("/orders", async function (req, res, next) {
  var result = false;
  var response = false;
  var orderNumber = Math.floor(Math.random() * Math.floor(1000000) + 1);
  var shippingCost = 5;
  console.log(orderNumber);

  var user = await UserModel.findOne({ token: req.body.token });
  // console.log("infouser", user.orders);

  if (user != null) {
    var newOrder = new OrderModel({
      OrderNumber: orderNumber,
      totalOrder: req.body.totalOrder,
      shippingCost: shippingCost,
      date_insert: req.body.date_insert,
      date_shipment: req.body.date_shipment,
      articles: req.body.articles,
      locker: req.body.locker,
    });

    var orderSave = await newOrder.save();

    if (orderSave) {
      result = true;
    }
    console.log("typeof", orderSave.date_insert);
    //il faut push order dans models
    if (result) {
      user.orders.push(orderSave._id);
      response = true;
      // console.log("orderscopfinal", user);
      await user.save();
      res.json({ user, response });
    } else {
      res.json(err.message);
    }
    //console.log("answer", response);
    //console.log("detail", user);
  } else {
    res.json("Something went wrong");
  }
});

/*recherche dans la bdd des lockers correspondant au departement de l'utilisateur */
router.get("/lockers", async function (req, res, next) {
  var result = [];

  var user = await UserModel.findOne({ token: req.query.token });
  var data = await LockerModel.find({ departement: req.query.departement });
  console.log(user);
  if (user != null) {
    result = await LockerModel.find({
      departement: user.departement,
    });
  }
  console.log(result);

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
      orders = [...orders, ...result[i].orders];
    }
  }
  console.log("orders", orders);
  //console.log("info", info[0].username);

  res.json({ orders, info });
});

/*Route pour afficher le détail d'un produit dans la page detail Screen */
router.get("/user-info", async function (req, res, next) {
  var data = await UserModel.findOne({ token: req.query.token });

  if (data != null) {
    detailUser = await UserModel.findOne({ token: req.query.token });
  }
  console.log(detailUser);

  res.json({ detailUser });
});

module.exports = router;
