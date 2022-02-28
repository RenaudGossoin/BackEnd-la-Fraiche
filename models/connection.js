var mongoose = require("mongoose");

var options = {
  connectTimeoutMS: 5000,
  useNewUrlParser: true,
  useUnifiedTopology: true,
};
mongoose.connect(
  "mongodb+srv://laFraiche:laFraiche@cluster0.ydch2.mongodb.net/laFraiche?retryWrites=true&w=majority",
  options,
  function (err) {
    console.log(err);
  }
);