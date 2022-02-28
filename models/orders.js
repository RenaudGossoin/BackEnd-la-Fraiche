const mongoose = require("mongoose");

var orderSchema = mongoose.Schema({
  totalOrder: Number,
  shippingCost: Number,
  date_insert: Date,
  date_shipment: Date,
  articles: [{ type: mongoose.Schema.Types.ObjectId, ref: "articles" }],
  locker: [{ type: mongoose.Schema.Types.ObjectId, ref: "lockers" }],
});
var OrderModel = mongoose.model("orders", orderSchema);

module.exports = OrderModel;
