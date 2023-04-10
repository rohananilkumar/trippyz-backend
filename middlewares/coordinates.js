const { default: fetch } = require("node-fetch");
const config = require("config");
const { getCoordinates } = require("../utils/gmap");

const coordinates = function (param) {
  return async function (req, res, next) {
    let area;
    if (req.method == "GET") {
      area = req.params[param];
    } else if (req.method == "POST") {
      area = req.body[param];
    }

    const coordinates = await getCoordinates(area);

    if (!req.coordinates)
      req.coordinates = {
        [param]: coordinates,
      };
    else req.coordinates[param] = coordinates;
    next();
  };
};

module.exports = coordinates;
