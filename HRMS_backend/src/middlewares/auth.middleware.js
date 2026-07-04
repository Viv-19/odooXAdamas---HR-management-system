const { verifyToken } = require("../utils/token.util");
const ApiResponse = require("../utils/apiResponse.util");
const { HttpStatusCode } = require("../constants");
const prisma = require("../clients/prisma.client");

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return ApiResponse.error(res, HttpStatusCode.UNAUTHORIZED, "Access denied. No token provided.");
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return ApiResponse.error(res, HttpStatusCode.UNAUTHORIZED, "Invalid or expired token.");
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, employeeId: true, email: true, role: true }
    });

    if (!user) {
      return ApiResponse.error(res, HttpStatusCode.UNAUTHORIZED, "User not found.");
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return ApiResponse.error(res, HttpStatusCode.FORBIDDEN, "Access forbidden. Insufficient permissions.");
    }
    next();
  };
};

module.exports = {
  authenticate,
  authorize,
};
