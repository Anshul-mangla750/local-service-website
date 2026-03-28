const { listingSchema } = require("../schema.js");
const { ExpressError } = require("../ExpressError.js");

function ensureAuthenticated(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({
      success: false,
      message: "You must be logged in to access this resource.",
    });
  }

  return next();
}

function ensureRole(role) {
  return function roleGuard(req, res, next) {
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        message: "You must be logged in to access this resource.",
      });
    }

    if (!req.user || req.user.role !== role) {
      return res.status(403).json({
        success: false,
        message: `This action is only available for ${role}s.`,
      });
    }

    return next();
  };
}

function validateListing(req, res, next) {
  const { error } = listingSchema.validate(req.body);

  if (error) {
    return next(new ExpressError(error.details[0].message, 400));
  }

  return next();
}

module.exports = {
  ensureAuthenticated,
  ensureCustomer: ensureRole("customer"),
  ensureProvider: ensureRole("provider"),
  ensureAdmin: ensureRole("admin"),
  validateListing,
};
