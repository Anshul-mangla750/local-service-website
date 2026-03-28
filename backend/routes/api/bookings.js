const express = require("express");

const asyncWrap = require("../../middleware/asyncWrap.js");
const { ensureAuthenticated, ensureCustomer } = require("../../middleware/auth.js");
const Booking = require("../../models/booking.js");
const Service = require("../../models/browse.js");
const { getSocketServer } = require("../../socket/index.js");
const { createNotification } = require("../../utils/notifications.js");
const { serializeBooking } = require("../../utils/serializers.js");

const router = express.Router();

async function fetchBookingForViewer(bookingId) {
  return Booking.findById(bookingId)
    .populate({
      path: "serviceId",
      populate: { path: "owner", select: "username role bio contactNumber workingHours" },
    })
    .populate("userId", "username role");
}

router.post(
  "/",
  ensureAuthenticated,
  ensureCustomer,
  asyncWrap(async (req, res) => {
    const { serviceId, date, time, notes } = req.body;

    if (!serviceId || !date || !time) {
      return res.status(400).json({
        success: false,
        message: "Service, date, and time are required to create a booking.",
      });
    }

    const service = await Service.findById(serviceId).populate(
      "owner",
      "username role bio contactNumber workingHours",
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found.",
      });
    }

    const newBooking = new Booking({
      serviceId,
      userId: req.user._id,
      date,
      time,
      notes,
    });

    await newBooking.save();
    await newBooking.populate("userId", "username role");
    const serializedBooking = serializeBooking({
      ...newBooking.toObject(),
      serviceId: service,
      userId: newBooking.userId,
    });
    const io = getSocketServer();

    if (service.owner?._id) {
      await createNotification(
        {
          userId: service.owner._id,
          actorId: req.user._id,
          kind: "booking_created",
          title: `${req.user.username} booked ${service.title}`,
          message: `New booking request for ${new Date(date).toLocaleDateString("en-IN")}${time ? ` at ${time}` : ""}.`,
          link: `/provider/bookings/${newBooking._id}`,
        },
        { io },
      );
    }

    return res.status(201).json({
      success: true,
      message: "Booking request sent successfully.",
      booking: serializedBooking,
    });
  }),
);

router.get(
  "/mine",
  ensureAuthenticated,
  asyncWrap(async (req, res) => {
    const bookings = await Booking.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate({
        path: "serviceId",
        populate: { path: "owner", select: "username role bio contactNumber workingHours" },
      })
      .populate("userId", "username role");

    return res.json({
      success: true,
      bookings: bookings.map((booking) =>
        serializeBooking(booking, { currentUser: req.user }),
      ),
    });
  }),
);

router.get(
  "/my",
  ensureAuthenticated,
  asyncWrap(async (req, res) => {
    const bookings = await Booking.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate({
        path: "serviceId",
        populate: { path: "owner", select: "username role bio contactNumber workingHours" },
      })
      .populate("userId", "username role");

    return res.json({
      success: true,
      bookings: bookings.map((booking) =>
        serializeBooking(booking, { currentUser: req.user }),
      ),
    });
  }),
);

router.get(
  "/:id",
  ensureAuthenticated,
  asyncWrap(async (req, res) => {
    const booking = await fetchBookingForViewer(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    const isCustomer = String(booking.userId?._id || booking.userId) === String(req.user._id);
    const isProvider =
      String(booking.serviceId?.owner?._id || booking.serviceId?.owner) === String(req.user._id);
    const isAdmin = req.user.role === "admin";

    if (!isCustomer && !isProvider && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to view this booking.",
      });
    }

    return res.json({
      success: true,
      booking: serializeBooking(booking, { currentUser: req.user }),
    });
  }),
);

module.exports = router;
