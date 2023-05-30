const axios = require("axios");
const { googleMapsClient } = require("../startup/gmap");

const querystring = require("querystring");
const config = require("config");
const getGmapImageFromPoints = async (points) => {
  // Get the directions between the points
  const directionsResponse = await googleMapsClient
    .directions({
      origin: points[0],
      destination: points[points.length - 1],
      waypoints: points.slice(1, -1),
      timeout: 1000, // Request timeout in milliseconds
    })
    .asPromise();

  const jsonDirections = await directionsResponse.json;

  // Extract the polyline from the directions response
  const polyline = jsonDirections.routes[0].overview_polyline.points;
  console.log(polyline);

  // Generate the path parameter for the static map

  // Generate the final URL for the static map
  const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?size=1200x00&path=enc:${polyline}&key=${config.get(
    "gmap"
  )}`;
  console.log(staticMapUrl);

  return staticMapUrl;
};

module.exports = {
  getGmapImageFromPoints,
};
