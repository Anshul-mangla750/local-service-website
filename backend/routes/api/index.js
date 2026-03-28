const express = require("express");

const adminRoutes = require("./admin.js");
const authRoutes = require("./auth.js");
const bookingsRoutes = require("./bookings.js");
const chatRoutes = require("./chat.js");
const customerRoutes = require("./customer.js");
const homeRoutes = require("./home.js");
const notificationsRoutes = require("./notifications.js");
const providerRoutes = require("./provider.js");
const servicesRoutes = require("./services.js");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/home", homeRoutes);
router.use("/services", servicesRoutes);
router.use("/bookings", bookingsRoutes);
router.use("/chat", chatRoutes);
router.use("/notifications", notificationsRoutes);
router.use("/customer", customerRoutes);
router.use("/provider", providerRoutes);

module.exports = router;
