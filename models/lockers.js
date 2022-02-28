const mongoose = require("mongoose");

var lockerSchema = mongoose.Schema({
  nom: String,
  latitude: String,
  longitude: String,
  departement: String,
});
var LockerModel = mongoose.model("lockers", lockerSchema);

module.exports = LockerModel;
