const mongoose = require("mongoose");
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const config = require("config");

const userJoiSchema = Joi.object({
  name: Joi.required(),
  email: Joi.string().required().email(),
  password: Joi.string().required(),
});

const userMongooseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  isAdmin: {
    type: Boolean,
  },

  password: {
    type: String,
    required: true,
  },
});

//Function to create authentication token
userMongooseSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    { _id: this._id, isAdmin: this.isAdmin },
    config.get("jwtPrivateKey")
  );
  return token;
};

User = mongoose.model("User", userMongooseSchema);

exports.userJoiSchema = userJoiSchema;
exports.userMongooseSchema = userMongooseSchema;
exports.User = User;
