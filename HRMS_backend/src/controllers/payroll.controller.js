const payrollService = require("../services/payroll.service");
const ApiResponse = require("../utils/apiResponse.util");
const { HttpStatusCode } = require("../constants");

class PayrollController {
  async me(req, res, next) {
    try {
      const data = await payrollService.getForUser(req.user.id);
      return ApiResponse.success(res, HttpStatusCode.OK, "My payroll", data);
    } catch (error) { next(error); }
  }

  async list(req, res, next) {
    try {
      const data = await payrollService.listAll();
      return ApiResponse.success(res, HttpStatusCode.OK, "Payroll overview", data);
    } catch (error) { next(error); }
  }

  async getOne(req, res, next) {
    try {
      const data = await payrollService.getByEmployeeId(req.params.id);
      return ApiResponse.success(res, HttpStatusCode.OK, "Employee payroll", data);
    } catch (error) { next(error); }
  }

  async update(req, res, next) {
    try {
      const data = await payrollService.updateByEmployeeId(req.params.id, req.body.structure || req.body);
      return ApiResponse.success(res, HttpStatusCode.OK, "Salary structure updated", data);
    } catch (error) { next(error); }
  }
}

module.exports = new PayrollController();
