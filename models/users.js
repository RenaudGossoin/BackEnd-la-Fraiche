const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  username: String,
  email: String,
  password: String,
  token: String,
  orders: [{ type: mongoose.Schema.Types.ObjectId, ref: "orders" }],
});

const UserModel = mongoose.model("users", userSchema);

module.exports = UserModel;
