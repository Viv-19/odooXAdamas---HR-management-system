const express = require("express");
const authRoutes = require("./auth.routes");
const attendanceRoutes = require("./attendance.routes");
const userRoutes = require("./user.routes");
const leaveRoutes = require("./leave.routes");
const payrollRoutes = require("./payroll.routes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/employees", userRoutes);
router.use("/leave", leaveRoutes);
router.use("/payroll", payrollRoutes);

module.exports = router;
