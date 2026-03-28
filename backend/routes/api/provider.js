const express = require("express");

const asyncWrap = require("../../middleware/asyncWrap.js");
const { ensureProvider } = require("../../middleware/auth.js");
const Booking = require("../../models/booking.js");
const Review = require("../../models/reviews.js");
const Service = require("../../models/browse.js");
const User = require("../../models/user.js");
const { getSocketServer } = require("../../socket/index.js");
const { createNotification } = require("../../utils/notifications.js");
const {
  serializeBooking,
  serializeCurrentUser,
  serializeReview,
  serializeService,
} = require("../../utils/serializers.js");

const router = express.Router();

router.use(ensureProvider);

async function getProviderServices(userId) {
  return Service.find({ owner: userId })
    .sort({ _id: -1 })
    .populate("owner", "username role bio contactNumber workingHours");
}

async function getProviderBookings(userId) {
  const services = await Service.find({ owner: userId }).select("_id");
  const serviceIds = services.map((service) => service._id);

  return Booking.find({ serviceId: { $in: serviceIds } })
    .sort({ createdAt: -1 })
    .populate({
      path: "serviceId",
      populate: { path: "owner", select: "username role bio contactNumber workingHours" },
    })
    .populate("userId", "username role");
}

router.get(
  "/dashboard",
  asyncWrap(async (req, res) => {
    const [user, services, bookings] = await Promise.all([
      User.findById(req.user._id),
      getProviderServices(req.user._id),
      getProviderBookings(req.user._id),
    ]);

    const pendingBookings = bookings.filter((booking) => booking.status === "pending");
    const completedBookings = bookings.filter((booking) => booking.status === "completed");
    const revenue = completedBookings.reduce((total, booking) => {
      return total + Number(booking.serviceId?.price || 0);
    }, 0);

    return res.json({
      success: true,
      user: serializeCurrentUser(user),
      stats: {
        servicesCount: services.length,
        newBookings: pendingBookings.length,
        completedJobs: completedBookings.length,
        revenue,
      },
      services: services.slice(0, 4).map((service) =>
        serializeService(service, { currentUser: user }),
      ),
      recentBookings: bookings.slice(0, 5).map((booking) =>
        serializeBooking(booking, { currentUser: user }),
      ),
    });
  }),
);

router.get(
  "/services",
  asyncWrap(async (req, res) => {
    const user = await User.findById(req.user._id);
    const services = await getProviderServices(req.user._id);

    return res.json({
      success: true,
      services: services.map((service) =>
        serializeService(service, { currentUser: user }),
      ),
    });
  }),
);

router.get(
  "/bookings",
  asyncWrap(async (req, res) => {
    const user = await User.findById(req.user._id);
    const bookings = await getProviderBookings(req.user._id);

    return res.json({
      success: true,
      bookings: bookings.map((booking) =>
        serializeBooking(booking, { currentUser: user }),
      ),
    });
  }),
);

router.patch(
  "/bookings/:id/status",
  asyncWrap(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!["accepted", "rejected", "completed"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Please choose a valid booking status.",
      });
    }

    const booking = await Booking.findById(id)
      .populate({
        path: "serviceId",
        populate: { path: "owner", select: "username role bio contactNumber workingHours" },
      })
      .populate("userId", "username role");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    if (!booking.serviceId?.owner || String(booking.serviceId.owner._id) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update this booking.",
      });
    }

    booking.status = status;
    await booking.save();
    const io = getSocketServer();

    if (booking.userId?._id) {
      const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
      await createNotification(
        {
          userId: booking.userId._id,
          actorId: req.user._id,
          kind: "booking_status_updated",
          title: `${booking.serviceId?.title || "Your booking"} is now ${statusLabel}`,
          message: `${req.user.username} updated the booking status to ${statusLabel}.`,
          link: `/customer/bookings/${booking._id}`,
        },
        { io },
      );
    }

    return res.json({
      success: true,
      message: "Booking status updated successfully.",
      booking: serializeBooking(booking, { currentUser: req.user }),
    });
  }),
);

router.get(
  "/earnings",
  asyncWrap(async (req, res) => {
    const services = await getProviderServices(req.user._id);
    const serviceIds = services.map((service) => service._id);
    const bookings = await Booking.find({ serviceId: { $in: serviceIds } })
      .populate({
        path: "serviceId",
        populate: { path: "owner", select: "username role bio contactNumber workingHours" },
      })
      .populate("userId", "username role");

    const completedBookings = bookings.filter((booking) => booking.status === "completed");
    const totalRevenue = completedBookings.reduce((total, booking) => {
      return total + Number(booking.serviceId?.price || 0);
    }, 0);

    const reviews = await Review.find({})
      .sort({ createdAt: -1 })
      .populate("userId", "username role")
      .populate({
        path: "bookingId",
        populate: {
          path: "serviceId",
          select: "title category location image owner",
          populate: { path: "owner", select: "username role bio contactNumber workingHours" },
        },
      });

    const providerReviews = reviews.filter((review) => {
      const ownerId = review.bookingId?.serviceId?.owner?._id || review.bookingId?.serviceId?.owner;
      return ownerId && String(ownerId) === String(req.user._id);
    });

    const averageRating = providerReviews.length
      ? providerReviews.reduce((total, review) => total + Number(review.rating || 0), 0) /
        providerReviews.length
      : 0;

    return res.json({
      success: true,
      stats: {
        totalBookings: bookings.length,
        completedBookings: completedBookings.length,
        pendingBookings: bookings.filter((booking) => booking.status === "pending").length,
        totalRevenue,
        averageEarning: completedBookings.length
          ? Number((totalRevenue / completedBookings.length).toFixed(0))
          : 0,
        averageRating: Number(averageRating.toFixed(1)),
        totalFeedbacks: providerReviews.length,
      },
      recentCompletedBookings: completedBookings.slice(0, 10).map((booking) =>
        serializeBooking(booking, { currentUser: req.user }),
      ),
      latestReviews: providerReviews.slice(0, 5).map((review) =>
        serializeReview(review),
      ),
    });
  }),
);

router.get(
  "/settings",
  asyncWrap(async (req, res) => {
    const user = await User.findById(req.user._id);

    return res.json({
      success: true,
      user: serializeCurrentUser(user),
    });
  }),
);

router.put(
  "/settings",
  asyncWrap(async (req, res) => {
    const { username, email, contactNumber, workingHours, bio } = req.body;
    const user = await User.findById(req.user._id);

    user.username = username || user.username;
    user.email = email || user.email;
    user.contactNumber = contactNumber || "";
    user.workingHours = workingHours || "";
    user.bio = bio || "";
    await user.save();

    return res.json({
      success: true,
      message: "Profile updated successfully.",
      user: serializeCurrentUser(user),
    });
  }),
);

module.exports = router;
