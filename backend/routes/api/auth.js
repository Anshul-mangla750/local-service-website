const express = require("express");
const passport = require("passport");

const asyncWrap = require("../../middleware/asyncWrap.js");
const User = require("../../models/user.js");
const { serializeCurrentUser } = require("../../utils/serializers.js");

const router = express.Router();

function getDashboardPath(user) {
  if (user.role === "admin") {
    return "/admin";
  }

  return user.role === "provider" ? "/provider" : "/customer";
}

router.get("/session", (req, res) => {
  return res.json({
    success: true,
    user: req.isAuthenticated() ? serializeCurrentUser(req.user) : null,
  });
});

router.post(
  "/signup",
  asyncWrap(async (req, res, next) => {
    const { username, password, email, role } = req.body;

    if (!username || !password || !email) {
      return res.status(400).json({
        success: false,
        message: "Username, email, and password are required.",
      });
    }

    if (role && !["customer", "provider"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Please choose a valid account role.",
      });
    }

    const newUser = await User.register(
      new User({
        username,
        email,
        role: role || "customer",
      }),
      password,
    );

    req.login(newUser, (error) => {
      if (error) {
        return next(error);
      }

      return res.status(201).json({
        success: true,
        message: "Account created successfully.",
        redirectTo: getDashboardPath(newUser),
        user: serializeCurrentUser(newUser),
      });
    });
  }),
);

router.post("/login", (req, res, next) => {
  passport.authenticate("local", (error, user, info) => {
    if (error) {
      return next(error);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: info?.message || "Invalid username or password.",
      });
    }

    return req.login(user, (loginError) => {
      if (loginError) {
        return next(loginError);
      }

      return res.json({
        success: true,
        message: "Login successful.",
        redirectTo: getDashboardPath(user),
        user: serializeCurrentUser(user),
      });
    });
  })(req, res, next);
});

router.post("/logout", (req, res, next) => {
  req.logout((error) => {
    if (error) {
      return next(error);
    }

    return res.json({
      success: true,
      message: "You have been logged out.",
    });
  });
});

module.exports = router;
