const express = require("express");
const Joi = require("joi");
const mongoose = require("mongoose");
const router = express.Router();

router.get("/", async (req, res) => {
  console.log("get request");

  return res.status(200).send({
    message: "this works",
  });
});

module.exports = router;
