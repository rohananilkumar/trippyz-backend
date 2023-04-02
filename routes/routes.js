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

router.get("/", async (req, res) => {
  console.log("get request");

  return res.status(200).send({
    message: "this works",
  });
});

router.post("/get-route", auth, async (req, res) => {
  const { error, value } = routeRequestJoiSchema.validate(req.body);
  if (error) return res.status(400).send(error);

  const route = new RouteRequest({ ...value, user: req.user._id });
  const result = await route.save();

  return res.status(200).send({ message: "success", value: result });
});

router.get("/lat-long/:area", auth, async (req, res) => {
  const area = req.params.area;

  const key = config.get("gmap");
  console.log(area, key);

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${area}&key=${key}`
  );

  const body = await response.json();

  // const coordinates = body.feature;s[0].geometry

  return res.status(200).send(body.results[0].geometry);
});

router.get("/tourist-places/:area", auth, async (req, res) => {
  const area = req.params.area;

  const key = config.get("gmap");

  const coordinateResponse = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${area}&key=${key}`
  );

  const coordinatesBody = await coordinateResponse.json();

  const coordinates = coordinatesBody.results[0].geometry.location;
  console.log(coordinates);
  const radius = 3000;

  //https://maps.googleapis.com/maps/api/place/nearbysearch/json?location={latitude},{longitude}&radius={radius}&type={type}&key={API_KEY}
  const type = "tourist_attraction";
  const requeststring = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${coordinates.lat},${coordinates.lng}&radius=${radius}&type=${type}&key=${key}`;
  const tourismResponse = await fetch(requeststring);
  const touristPlaces = await tourismResponse.json();

  return res.status(200).send({
    coordinates,
    touristPlaces,
  });
});

module.exports = router;
