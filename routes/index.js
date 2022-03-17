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

/*sign-up screen
On reçoit depuis le frontend plusieurs infos : username, email, le password et le departement
1ere etape: recherche des éventuelles erreurs à pusher dans le tableau error
2e etape: si aucune erreur, on enregistre cet user dans la bdd grâce au modèle user. 
On recupère les informations du front et on passe tout en caractères minuscules, on protège le mdp grâce à la fonction hashage bcrypt
On génère un token unique à l'uilisateur qui permettra de l'identifier ultérieurement
On renvoie au front en réponse les infos user, result, error, et le token */
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

/*sign-in screen
On reçoit depuis le frontend l'email et le mdp.
1er etape: on verifie les erreurs
2e etape: si aucune erreur, on recherche l'user en bdd grâce à l'email
Si l'user existe, on compare le mdp saisi en front avec celui en bdd grâce à la fonction bcrypt.compareSync. S'il y a correspondance, on attribue à la variable token, le token de l'user en bdd sinon erreur mdp
Si l'user n'existe pas, erreur email incorrect */
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

/*route pour afficher les produits en fonction de la catégorie sur Products Screen
1er etape: recherche de l'user grâce au token pour voir s'il est connecté ou non 
Si l'user est connecté (donc non null), recherche des fermes dont le département
est égal au département de l'user et je populate avec la collection articles (clé étrangère du model farmer en bdd)
Dans le tableau articles, on copie tous les articles de result
Sinon si l'user n'est pas connecté, il a rentré son code postal dans la page home. 
Cette info a été enregistrée dans le store grâce à un reducer.
On reçoit en back le departement, on fait une recherche des fermes livrant dans le departement de l'user. 
S'il existe des fermes du même département, on recherche les articles liées à ces fermes et on copie les articles dans
un tableau nommé articles
2e etape: On filtre les articles en fonction de leur catégorie pour n'envoyer au front end que les articles de la catégorie choisie */
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
      articles = [...articles, ...result[i].articles];
    }
  }

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

  res.json({ articlesFilter, cities, user });
});

/*Route qui permet d'enregistrer la commande passée et de l'affecter à l'user concerné
Recherche de l'user en bdd grâce au token
S'il existe, on enregistre en bdd une commande grâce au modèle user avec les infos reçues depuis le front
Pour le numéro d'ordre, on génère un numéro aléatoire à 6 chiffres
pour les articles : étant donné qu'on reçoit une string, on utilise la fonction split pour transformer la chaîne de caractères par un tableau d'obects déparés par une ,
Si la commande a été enregistrée, on push dans le tableau des ordres de l'user (cf modeèle en bdd) la commande qui vient d'être enregistrée
Si on a réussi à affecter la commande à l'user on revoit au front le resultat de la réponse et les infos de l'user sinon on renvoit un message d'erreur*/
router.post("/orders", async function (req, res, next) {
  var result = false;
  var response = false;
  var orderNumber = Math.floor(Math.random() * Math.floor(1000000) + 1);
  var shippingCost = 5;
  var articlesarray = [];

  var user = await UserModel.findOne({ token: req.body.token });
  articlesarray = req.body.articles.split(",");

  if (user != null) {
    var newOrder = new OrderModel({
      OrderNumber: orderNumber,
      totalOrder: req.body.totalOrder,
      shippingCost: shippingCost,
      date_insert: req.body.date_insert,
      date_shipment: req.body.date_shipment,
      articles: articlesarray,
      locker: req.body.locker,
    });

    var orderSave = await newOrder.save();

    if (orderSave) {
      result = true;
    }

    //il faut push order dans models
    if (result) {
      user.orders.push(orderSave._id);
      response = true;

      await user.save();
      res.json({ user, response });
    } else {
      res.json(err.message);
    }
  } else {
    res.json("Something went wrong");
  }
});

/*recherche dans la bdd des lockers correspondant au departement de l'utilisateur 
On reçoit depuis le front le token de l'utilisateur. 
Grâe au token, on recherche en bdd l'user.
S'il existe, on cherche tous les lockers dont le departement est égal à celui de l'user et on les renvoit en réponse au front*/
router.get("/lockers", async function (req, res, next) {
  var result = [];

  var user = await UserModel.findOne({ token: req.query.token });

  if (user != null) {
    result = await LockerModel.find({
      departement: user.departement,
    });
  }

  res.json({ result });
});

/*route pour afficher les infos de l'user et ses commandes dans la page account
 Grâce au token reçu depuis le front, on recherche en bdd l'user connecté
 S'il l'user existe, on stocke ses info dans la variable info
 On stocke dans le tableau result,  toutes les commandes liés à notre user (order est clé étrangère de la collection user)
 On copie dans le tableau orders initialisé à vide, tous les orders de l'user
 On renvoie au front les infos de l'user ainsi que toutes ses commandes*/
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

  res.json({ orders, info });
});

/*Route pour récupérer l'username de l'user
On reçoit le token depuis le front,
On recherche dans la bdd s'il existe et si oui ont recupère les infos de l'user grâce au token
On renvoit au front les infos de l'user  */
router.get("/user-info", async function (req, res, next) {
  var data = await UserModel.findOne({ token: req.query.token });

  if (data != null) {
    detailUser = await UserModel.findOne({ token: req.query.token });
  }

  res.json({ detailUser });
});

module.exports = router;
