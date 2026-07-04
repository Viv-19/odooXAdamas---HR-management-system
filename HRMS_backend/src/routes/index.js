const express = require("express");
const authRoutes = require("./auth.routes");
const attendanceRoutes = require("./attendance.routes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/attendance", attendanceRoutes);

module.exports = router;
