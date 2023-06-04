const express = require("express");
const helmet = require("helmet");
const app = express();
const cors = require("cors");

app.use(cors());
app.use(express.json());

require("./startup/routes")(app);
// require("./startup/logging")();
// require("./startup/config")();
// require("./startup/validation")();
require("./startup/db")();
// require("./startup/prod")(app);

const server = app.listen(3001, () => console.log("Connected to port 3001"));
module.exports = server;
