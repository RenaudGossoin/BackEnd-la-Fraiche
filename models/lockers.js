const mongoose = require("mongoose");

var lockerSchema = mongoose.Schema({
  nom: String,
  adresse: String,
  latitude: Number,
  longitude: Number,
  departement: String,
});
var LockerModel = mongoose.model("lockers", lockerSchema);

module.exports = LockerModel;
