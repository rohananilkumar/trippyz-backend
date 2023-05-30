const express = require("express");
const Joi = require("joi");
const mongoose = require("mongoose");
const router = express.Router();
const auth = require("../middlewares/auth");
const {
  routeRequestJoiSchema,
  routeRequestMongooseSchema,
  RouteRequest,
} = require("../models/routerequest");
const config = require("config");
const fetch = require("node-fetch");
const { Coordinates } = require("../models/coordinates");
const coordinates = require("../middlewares/coordinates");
const {
  getHotels,
  getRestaurants,
  getTouristPlaces,
  getCoordinates,
  getPlaceDetailsFromPlaceId,
  getPlaceDetails,
  getCoordinatesList,
} = require("../utils/gmap");
const { googleMapsClient } = require("../startup/gmap");
const { dijkstra } = require("../utils/algos");
const { getHotelPrice } = require("../utils/scraping");
const {
  parseDuration,
  filter,
  getNearestPlace,
  dayRoute,
} = require("../utils/algos");
const { getGmapImageFromPoints } = require("../utils/gmapimage");

router.post(
  "/get-route",
  [auth, coordinates("start"), coordinates("dest")],
  async (req, res) => {
    const { error, value } = routeRequestJoiSchema.validate(req.body);
    if (error) return res.status(400).send(error);
    console.log(req.coordinates.start);
    console.log(req.coordinates.dest);

    const route = new RouteRequest({
      ...value,
      user: req.user._id,
      destCoordinates: new Coordinates(req.coordinates.dest),
      startCoordinates: new Coordinates(req.coordinates.start),
    });
    // const result = await route.save();

    const places = await getTouristPlaces(value.dest, 5000);
    const placeNames = places.results.map(
      (place) => place.name + ", " + value.dest
    );
    const restaurants = await getRestaurants(value.dest, 5000);
    const restaurantNames = restaurants.results.map(
      (place) => place.name + ", " + value.dest
    );

    // console.log(restaurantNames);

    let rows;
    const graph = {};
    const durationCovered = 0;
    const duration = parseDuration(value.duration);
    console.log(duration);
    const type = "morning departure";

    try {
      // getNearestPlace(value.start,value.)
      //const nearest = await getNearestPlace(value.start, placeNames);
      //console.log(nearest);
      const route = await dayRoute(value.start, placeNames, restaurantNames);
      const coordinates = await getCoordinatesList(route.map((r) => r.place));
      const pathurl = getGmapImageFromPoints(coordinates);
      console.log(coordinates);
      // durationCovered += nearest.duration;
      // const matrix = await googleMapsClient
      //   .distanceMatrix({
      //     origins: placeNames.slice(0, 10),
      //     destinations: placeNames.slice(0, 10),
      //   })
      //   .asPromise();
    } catch (e) {
      console.log(e);
    }

    return res.status(200).send({ message: "success", value: rows });
  }
);

router.get("/coordinates/:area", auth, async (req, res) => {
  const area = req.params.area;

  const coordinates = await getCoordinates(area);

  return res.status(200).send({ coordinates });
});

router.get("/tourist-places/:area", auth, async (req, res) => {
  const area = req.params.area;
  const touristPlaces = await getTouristPlaces(area, 5000);
  return res.status(200).send(touristPlaces);
});

router.get("/restaurants/:area", [auth], async (req, res) => {
  const area = req.params.area;

  const restaurants = await getRestaurants(area, 5000);

  return res.status(200).send(restaurants);
});

router.get("/hotels/:area", [auth], async (req, res) => {
  const area = req.params.area;

  const hotels = await getHotels(area, 5000);

  return res.status(200).send(hotels);
});

router.get("/place-details-from-id/:placeId", auth, async (req, res) => {
  const placeId = req.params.placeId;
  const details = await getPlaceDetailsFromPlaceId(placeId);
  return res.status(200).send(details);
});

router.get("/place-details/:place", auth, async (req, res) => {
  const place = req.params.place;
  const details = await getPlaceDetails(place);
  return res.status(200).send(details);
});

router.get("/get-price/:hotel", [auth], async (req, res) => {
  const hotel = req.params.hotel;

  getHotelPrice(hotel);

  return res.status(200).send({});
});

router.get("/", auth, async (req, res) => {});

module.exports = router;
