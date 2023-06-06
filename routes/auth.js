const express = require("express");
const Joi = require("joi");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const config = require("config");
const _ = require("lodash");
const {
  userMongooseSchema: mongooseSchema,
  userJoiSchema: joiSchema,
  User,
} = require("../models/user");

const router = express.Router();

const loginSchema = Joi.object({
  email: Joi.string().required().email(),
  password: Joi.string().required(),
});

router.post("/login", async (req, res) => {
  const { error, value } = loginSchema.validate(req.body);

  if (error) {
    res.status(400).send(error);
    return;
  }

  let user = await User.findOne({ email: value.email });
  if (!user) return res.status(400).send("Invalid email or password");

  const validPassword = await bcrypt.compare(value.password, user.password);
  if (!validPassword) return res.status(400).send("Invalid email or password");

  const token = user.generateAuthToken();
  res.header("x-auth-token", token).status(200).send({
    message: "logged in successfully",
    token,
  });
});

router.post("/register", async (req, res) => {
  const { error, value } = joiSchema.validate(req.body);

  if (error) {
    res.status(400).send(error);
    return;
  }

  let user = await User.findOne({ email: value.email });
  if (user) return res.status(400).send("User already registered.");

  user = new User(_.pick(value, ["name", "email", "password"]));

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);

  await user.save();

  const token = user.generateAuthToken();

  res
    .header("x-auth-token", token)
    .status(201)
    .send({
      ..._.pick(user, ["name", "email", "_id"]),
      ["x-auth-token"]: token,
    });
});

module.exports = router;
