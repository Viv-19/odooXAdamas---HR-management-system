const express = require("express");
const leaveController = require("../controllers/leave.controller");
const { authenticate, authorize } = require("../middlewares/auth.middleware");
const { Role } = require("../constants");

const router = express.Router();

router.use(authenticate);

// Literal paths first so they aren't captured by "/:id/..."
router.get("/holidays", leaveController.holidays);
router.get("/balance", leaveController.balance);
router.post("/allocate", authorize(Role.HR, Role.ADMIN), leaveController.allocate);

// Employee + HR
router.get("/", leaveController.list); // employee sees own; HR/Admin see all
router.post("/", leaveController.apply);

// HR / Admin
router.patch("/:id/status", authorize(Role.HR, Role.ADMIN), leaveController.setStatus);
router.put("/:id/status", authorize(Role.HR, Role.ADMIN), leaveController.setStatus);

module.exports = router;
