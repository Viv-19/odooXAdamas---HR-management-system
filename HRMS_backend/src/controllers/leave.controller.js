const leaveService = require("../services/leave.service");
const ApiResponse = require("../utils/apiResponse.util");
const { HttpStatusCode } = require("../constants");

class LeaveController {
  async list(req, res, next) {
    try {
      const leaves = await leaveService.list(req.user);
      return ApiResponse.success(res, HttpStatusCode.OK, "Leave requests", leaves);
    } catch (error) { next(error); }
  }

  async apply(req, res, next) {
    try {
      const leave = await leaveService.apply(req.user.id, req.body);
      return ApiResponse.success(res, HttpStatusCode.CREATED, "Leave request submitted", leave);
    } catch (error) { next(error); }
  }

  async setStatus(req, res, next) {
    try {
      const leave = await leaveService.setStatus(req.params.id, req.body.status, req.user.id, req.body.comments);
      return ApiResponse.success(res, HttpStatusCode.OK, "Leave " + (req.body.status || "").toLowerCase(), leave);
    } catch (error) { next(error); }
  }

  async balance(req, res, next) {
    try {
      const bal = await leaveService.balance(req.user.id);
      return ApiResponse.success(res, HttpStatusCode.OK, "Leave balance", bal);
    } catch (error) { next(error); }
  }

  async allocate(req, res, next) {
    try {
      const result = await leaveService.allocate(req.body);
      return ApiResponse.success(res, HttpStatusCode.OK, "Time-off allocated", result);
    } catch (error) { next(error); }
  }

  async holidays(req, res, next) {
    try {
      const hs = await leaveService.holidays();
      return ApiResponse.success(res, HttpStatusCode.OK, "Holidays", hs);
    } catch (error) { next(error); }
  }
}

module.exports = new LeaveController();
