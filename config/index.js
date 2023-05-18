const express = require("express");
const logger = require("morgan");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const FRONTEND_URL = process.env.ORIGIN

module.exports = (app) => {
  // Trust the proxy if the app is behind one
  app.set("trust proxy", 1);

  // Set up CORS to allow requests from the frontend application's domain
  app.use(
    cors({
      origin: FRONTEND_URL,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    })
  );

  app.use(logger("dev"));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
};