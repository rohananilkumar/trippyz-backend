// const customers = require("../routes/customers");
// const movies = require("../routes/movies");
const routes = require("../routes/routes");
// const users = require("../routes/users");
const auth = require("../routes/auth");
// const error = require("../middleware/error");
// const genres = require("../routes/genres.js");

module.exports = function (app) {
  //   app.use("/api/genres", genres);
  //   app.use("/api/customers", customers);
  //   app.use("/api/movies", movies);
  app.use("/api/routes", routes);
  //   app.use("/api/users", users);
  app.use("/api/auth", auth);
  //   app.use(error);
};
