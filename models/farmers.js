const mongoose = require("mongoose");

var farmerSchema = mongoose.Schema({
  nom: String,
  articles: [{ type: mongoose.Schema.Types.ObjectId, ref: "articles" }],
  departement: String,
});
var FarmerModel = mongoose.model("farmers", farmerSchema);

module.exports = FarmerModel;
