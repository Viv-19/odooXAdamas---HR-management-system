const userService = require("../services/user.service");
const ApiResponse = require("../utils/apiResponse.util");
const { HttpStatusCode } = require("../constants");

class UserController {
  async list(req, res, next) {
    try {
      const employees = await userService.list();
      return ApiResponse.success(res, HttpStatusCode.OK, "Employees fetched", employees);
    } catch (error) {
      next(error);
    }
  }

  async me(req, res, next) {
    try {
      const employee = await userService.getMe(req.user.id);
      return ApiResponse.success(res, HttpStatusCode.OK, "Profile fetched", employee);
    } catch (error) {
      next(error);
    }
  }

  async getOne(req, res, next) {
    try {
      const employee = await userService.getByEmployeeId(req.params.id);
      return ApiResponse.success(res, HttpStatusCode.OK, "Employee fetched", employee);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const employee = await userService.create(req.body);
      return ApiResponse.success(res, HttpStatusCode.CREATED, "Employee created", employee);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const employee = await userService.update(req.params.id, req.body);
      return ApiResponse.success(res, HttpStatusCode.OK, "Employee updated", employee);
    } catch (error) {
      next(error);
    }
  }

  async remove(req, res, next) {
    try {
      const result = await userService.remove(req.params.id);
      return ApiResponse.success(res, HttpStatusCode.OK, "Employee removed", result);
    } catch (error) {
      next(error);
    }
  }

  async setRole(req, res, next) {
    try {
      const employee = await userService.setRole(req.params.id, req.body.role);
      return ApiResponse.success(res, HttpStatusCode.OK, "Role updated", employee);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
