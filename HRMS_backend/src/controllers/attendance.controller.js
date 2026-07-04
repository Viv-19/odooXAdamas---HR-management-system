const attendanceService = require("../services/attendance.service");
const ApiResponse = require("../utils/apiResponse.util");
const { HttpStatusCode } = require("../constants");

class AttendanceController {
  async checkIn(req, res, next) {
    try {
      const userId = req.user.id;
      const record = await attendanceService.checkIn(userId);
      return ApiResponse.success(res, HttpStatusCode.CREATED, "Checked In Successfully", record);
    } catch (error) {
      if (error.message.includes("Already checked in")) {
        return ApiResponse.error(res, HttpStatusCode.BAD_REQUEST, error.message);
      }
      next(error);
    }
  }

  async checkOut(req, res, next) {
    try {
      const userId = req.user.id;
      const record = await attendanceService.checkOut(userId);
      return ApiResponse.success(res, HttpStatusCode.OK, "Checked Out Successfully", record);
    } catch (error) {
      if (error.message.includes("Cannot check out") || error.message.includes("Already checked out")) {
        return ApiResponse.error(res, HttpStatusCode.BAD_REQUEST, error.message);
      }
      next(error);
    }
  }

  async getTodayStatus(req, res, next) {
    try {
      const userId = req.user.id;
      const record = await attendanceService.getTodayStatus(userId);
      return ApiResponse.success(res, HttpStatusCode.OK, "Today's Attendance Status", record);
    } catch (error) {
      next(error);
    }
  }

  async getAllAttendances(req, res, next) {
    try {
      const { date } = req.query; // optional date format YYYY-MM-DD
      const records = await attendanceService.getAllAttendances(date);
      return ApiResponse.success(res, HttpStatusCode.OK, "All Attendances", records);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AttendanceController();
