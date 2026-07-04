const express = require("express");
const attendanceController = require("../controllers/attendance.controller");
const { authenticate, authorize } = require("../middlewares/auth.middleware");
const { Role } = require("../constants");

const router = express.Router();

// Apply authentication middleware to all attendance routes
router.use(authenticate);

// Employee endpoints
router.post("/check-in", attendanceController.checkIn);
router.put("/check-out", attendanceController.checkOut);
router.get("/today", attendanceController.getTodayStatus);

// HR / Admin endpoints
router.get("/all", authorize(Role.HR, Role.ADMIN), attendanceController.getAllAttendances);

module.exports = router;
