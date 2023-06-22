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
const {
  dijkstra,
  dayRouteReturnTrip,
  filterPlaces,
  filterHotels,
  dayRouteRoundTrip,
} = require("../utils/algos");
const { getHotelPrice } = require("../utils/scraping");
const {
  parseDuration,
  filter,
  getNearestPlace,
  dayRoute,
} = require("../utils/algos");
const { getGmapImageFromPoints } = require("../utils/gmapimage");
const { fetchData } = require("../utils/hotels");

router.post(
  "/get-route",
  [auth, coordinates("start"), coordinates("dest")],
  async (req, res) => {
    const { error, value } = routeRequestJoiSchema.validate(req.body);
    if (error) return res.status(400).send(error);

    const routeType = {
      ["lightly-scheduled"]: 120,
      ["tightly-scheduled"]: 60,
      ["normal-scheduled"]: 90,
    };

    const userRouteType = routeType[value.routeType];

    const route = new RouteRequest({
      ...value,
      user: req.user._id,
      destCoordinates: new Coordinates(req.coordinates.dest),
      startCoordinates: new Coordinates(req.coordinates.start),
    });
    // const result = await route.save();
    const radius = value.radius * 1000;
    let places = await getTouristPlaces(value.dest, radius);

    places = filterPlaces(places.results);
    let placeNames = places.map((place) => place.name + ", " + value.dest);
    const restaurants = await getRestaurants(value.dest, radius);
    let restaurantNames = restaurants.results.map(
      (place) => place.name + ", " + value.dest
    );

    let hotels = await getHotels(value.dest, radius);
    console.log("hotels", hotels);
    // console.log("expensive", filterHotels(hotels, "expensive").length);
    // console.log("moderate", filterHotels(hotels, "moderate").length);
    // console.log("cheap", filterHotels(hotels, "cheap").length);
    hotels = filterHotels(hotels, value.budgetType);

    // console.log(hotels);
    // let hotelNames = hotels.map((place) => place.name + ", " + value.dest);
    // console.log(hotelNames);
    // console.log(restaurantNames);

    const duration = parseDuration(value.duration);
    console.log(duration);
    let numberOfDays = value.duration;
    let fuelPriceTotal = 0;
    let hotelPriceTotal = 0;

    try {
      let generatedRoute = [];
      if (numberOfDays == 1) {
        let {
          route,
          updatedPlaceList,
          updatedRestaurantList,
          fuelPrice,
          hotelPrice,
        } = await dayRouteRoundTrip(
          value.start,
          placeNames,
          restaurantNames,
          value.mileage,
          userRouteType,
          value.peopleCount,
          value.vehicleType
        );
        route.forEach((x) => generatedRoute.push({ ...x, day: 0 }));
        fuelPriceTotal += fuelPrice;
        hotelPriceTotal += hotelPrice;
      } else {
        let finalPoint;
        while (numberOfDays > 1) {
          let {
            route,
            updatedPlaceList,
            updatedRestaurantList,
            updatedHotelList,
            fuelPrice,
            hotelPrice,
          } = await dayRoute(
            finalPoint ? finalPoint : value.start,
            placeNames,
            restaurantNames,
            hotels,
            value.mileage,
            userRouteType,
            value.peopleCount,
            value.vehicleType
          );
          fuelPriceTotal += fuelPrice;
          hotelPriceTotal += hotelPrice;
          route.forEach((x) =>
            generatedRoute.push({ ...x, day: value.duration - numberOfDays })
          );
          placeNames = updatedPlaceList;
          restaurantNames = updatedRestaurantList;
          hotels = updatedHotelList;
          finalPoint = generatedRoute[generatedRoute.length - 1].place;
          numberOfDays -= 1;
        }
        let {
          route,
          updatedPlaceList,
          updatedRestaurantList,
          hotelPrice,
          fuelPrice,
        } = await dayRouteReturnTrip(
          finalPoint,
          placeNames,
          restaurantNames,
          value.start,
          value.mileage,
          userRouteType,
          value.peopleCount,
          value.vehicleType
        );
        fuelPriceTotal += fuelPrice;
        hotelPriceTotal += hotelPrice;
        route.forEach((x) =>
          generatedRoute.push({ ...x, day: value.duration - numberOfDays })
        );
      }

      const coordinates = await getCoordinatesList(
        generatedRoute.map((r) => r.place)
      );
      console.log(coordinates, generatedRoute);
      const pathurl = await getGmapImageFromPoints(coordinates);
      // console.log(route);
      return res.status(200).send({
        generatedRoute,
        staticUrl: pathurl.url,
        polyLine: pathurl.polyline,
        coordinates: coordinates,
        budget: {
          fuelPriceTotal,
          hotelPriceTotal,
        },
      });
    } catch (e) {
      console.log(e);
    }

    //return res.status(200).send({ message: "success", value: rows });
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

  const data = await fetchData(hotel);

  return res.status(200).send({ data });
});

router.get("/", auth, async (req, res) => {});

module.exports = router;
