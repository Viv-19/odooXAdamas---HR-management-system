const express = require("express");
const payrollController = require("../controllers/payroll.controller");
const { authenticate, authorize } = require("../middlewares/auth.middleware");
const { Role } = require("../constants");

const router = express.Router();

router.use(authenticate);

// Employee: own payroll (read-only)
router.get("/me", payrollController.me);

// HR / Admin
router.get("/", authorize(Role.HR, Role.ADMIN), payrollController.list);
router.get("/:id", authorize(Role.HR, Role.ADMIN), payrollController.getOne);
router.put("/:id", authorize(Role.HR, Role.ADMIN), payrollController.update);

module.exports = router;
