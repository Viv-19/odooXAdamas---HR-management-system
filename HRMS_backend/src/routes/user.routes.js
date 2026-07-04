const express = require("express");
const userController = require("../controllers/user.controller");
const { authenticate, authorize } = require("../middlewares/auth.middleware");
const { Role } = require("../constants");

const router = express.Router();

router.use(authenticate);

// Current user's own employee record (any authenticated user)
router.get("/me", userController.me);

// HR / Admin management endpoints
router.get("/", authorize(Role.HR, Role.ADMIN), userController.list);
router.post("/", authorize(Role.HR, Role.ADMIN), userController.create);
router.get("/:id", authorize(Role.HR, Role.ADMIN), userController.getOne);
router.put("/:id", authorize(Role.HR, Role.ADMIN), userController.update);
router.patch("/:id", authorize(Role.HR, Role.ADMIN), userController.update);
router.delete("/:id", authorize(Role.HR, Role.ADMIN), userController.remove);

module.exports = router;
