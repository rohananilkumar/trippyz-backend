const mongoose = require("mongoose");
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const config = require("config");

const coordinatesJoiSchema = Joi.object({});

const coordinatesMongooseSchema = new mongoose.Schema({
  lat: {
    type: Number,
    required: true,
  },
  lng: {
    type: Number,
    required: true,
  },
});

Coordinates = mongoose.model("Coordinate", coordinatesMongooseSchema);

exports.coordinatesJoiSchema = coordinatesJoiSchema;
exports.coordinatesMongooseSchema = coordinatesMongooseSchema;
exports.Coordinates = Coordinates;
