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

module.exports = router;
