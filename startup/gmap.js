const config = require("config");

const googleMapsClient = require("@google/maps").createClient({
  key: config.get("gmap"),
  Promise: Promise,
});

module.exports.googleMapsClient = googleMapsClient;
