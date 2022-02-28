const mongoose = require("mongoose");

var articleSchema = mongoose.Schema({
  nom: String,
  prix: Number,
  description: String,
  img: String,
  nutriscore: String,
  astuce: String,
  categorie: String,
});
var ArticleModel = mongoose.model("articles", articleSchema);

module.exports = ArticleModel;
