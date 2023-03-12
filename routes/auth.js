const express = require("express");
const Joi = require("joi");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const config = require("config");
const {
  userMongooseSchema: mongooseSchema,
  userJoiSchema: joiSchema,
} = require("../models/user");

const router = express.Router();

User = mongoose.model("User", mongooseSchema);

const loginSchema = Joi.object({
  email: Joi.string().required().email(),
  password: Joi.string().required(),
});

router.post("/", async (req, res) => {
  console.log("Post request");

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
  res.send(token);
});

module.exports = router;
