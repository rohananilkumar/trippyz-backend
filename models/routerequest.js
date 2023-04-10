const mongoose = require("mongoose");
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const config = require("config");
const { coordinatesMongooseSchema } = require("./coordinates");

const routeRequestJoiSchema = Joi.object({
  dest: Joi.required(),
  start: Joi.string().required(),
  startTime: Joi.date(),
  endTime: Joi.date(),
  duration: Joi.string(),
  budget: Joi.number().required(),
  peopleCount: Joi.number().required().min(1),
  considerations: Joi.array().items(
    Joi.string().valid("food", "stay", "ticket", "petrol")
  ),
  mileage: Joi.number(),
  roomForError: Joi.number().min(10).max(90).required(),
  restaurantRatingPreference: Joi.number().min(0).max(5),
});

const routeRequestMongooseSchema = new mongoose.Schema({
  dest: {
    type: String,
    required: true,
  },
  destCoordinates: {
    type: coordinatesMongooseSchema,
    required: true,
  },
  start: {
    type: String,
    required: true,
  },
  startCoordinates: {
    type: coordinatesMongooseSchema,
    required: true,
  },
  startTime: {
    type: String,
    required: false,
  },
  endTime: {
    type: String,
    required: false,
  },
  duration: {
    type: String,
    required: false,
  },
  budget: {
    type: Number,
    required: true,
  },
  peopleCount: {
    type: Number,
    required: true,
  },
  considerations: [
    {
      type: String,
      required: true,
      enum: ["food", "stay", "ticket", "petrol"],
    },
  ],
  mileage: {
    type: Number,
    required: false,
  },
  roomForError: {
    type: Number,
    required: true,
  },
  restaurantRatingPreference: {
    type: Number,
    required: false,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

RouteRequest = mongoose.model("RouteRequest", routeRequestMongooseSchema);

exports.routeRequestJoiSchema = routeRequestJoiSchema;
exports.routeRequestMongooseSchema = routeRequestMongooseSchema;
exports.RouteRequest = RouteRequest;
