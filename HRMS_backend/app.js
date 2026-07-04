const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const routes = require("./src/routes");
const errorHandler = require("./src/middlewares/error.middleware");

const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

// API Routes
app.use("/api/v1", routes);

// Base route
app.get("/", (req, res) => {
  res.send("HRMS Backend API is running...");
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
