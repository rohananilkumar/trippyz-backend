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
  duration: Joi.number(),
  radius: Joi.number().required(),
  budget: Joi.number().required(),
  peopleCount: Joi.number().required().min(1),
  routeType: Joi.string()
    .required()
    .valid("lightly-scheduled", "tightly-scheduled", "normal-scheduled"),
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
  radius: {
    type: Number,
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
  routeType: {
    type: String,
    required: true,
    enum: ["lightly-scheduled", "tightly-scheduled", "normal-scheduled"],
  },
  endTime: {
    type: String,
    required: false,
  },
  duration: {
    type: Number,
    required: true,
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
