const express = require("express");
const authRoutes = require("./auth.routes");
const attendanceRoutes = require("./attendance.routes");
const userRoutes = require("./user.routes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/employees", userRoutes);

module.exports = router;
