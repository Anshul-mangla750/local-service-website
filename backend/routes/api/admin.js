const express = require("express");

const asyncWrap = require("../../middleware/asyncWrap.js");
const { ensureAdmin } = require("../../middleware/auth.js");
const Booking = require("../../models/booking.js");
const Review = require("../../models/reviews.js");
const Service = require("../../models/browse.js");
const User = require("../../models/user.js");
const {
  serializeBooking,
  serializeCurrentUser,
  serializeReview,
  serializeService,
} = require("../../utils/serializers.js");

const router = express.Router();

router.use(ensureAdmin);

router.get(
  "/stats",
  asyncWrap(async (req, res) => {
    const [users, services, bookings, reviews] = await Promise.all([
      User.find({}).sort({ createdAt: -1 }),
      Service.find({})
        .sort({ createdAt: -1 })
        .populate("owner", "username role bio contactNumber workingHours"),
      Booking.find({})
        .sort({ createdAt: -1 })
        .populate({
          path: "serviceId",
          populate: { path: "owner", select: "username role bio contactNumber workingHours" },
        })
        .populate("userId", "username role"),
      Review.find({})
        .sort({ createdAt: -1 })
        .populate("userId", "username role")
        .populate({
          path: "bookingId",
          populate: {
            path: "serviceId",
            select: "title category location image owner",
            populate: { path: "owner", select: "username role bio contactNumber workingHours" },
          },
        }),
    ]);

    const completedBookings = bookings.filter((booking) => booking.status === "completed");
    const revenue = completedBookings.reduce(
      (total, booking) => total + Number(booking.serviceId?.price || 0),
      0,
    );
    const customerCount = users.filter((user) => user.role === "customer").length;
    const providerCount = users.filter((user) => user.role === "provider").length;
    const adminCount = users.filter((user) => user.role === "admin").length;

    return res.json({
      success: true,
      stats: {
        totalUsers: users.length,
        customerCount,
        providerCount,
        adminCount,
        totalServices: services.length,
        totalBookings: bookings.length,
        completedBookings: completedBookings.length,
        pendingBookings: bookings.filter((booking) => booking.status === "pending").length,
        totalReviews: reviews.length,
        totalRevenue: revenue,
      },
      recentBookings: bookings.slice(0, 6).map((booking) =>
        serializeBooking(booking, { currentUser: req.user }),
      ),
      recentReviews: reviews.slice(0, 4).map((review) => serializeReview(review)),
    });
  }),
);

router.get(
  "/users",
  asyncWrap(async (req, res) => {
    const [users, services, bookings] = await Promise.all([
      User.find({}).sort({ createdAt: -1 }),
      Service.find({}).select("owner"),
      Booking.find({}).select("userId"),
    ]);

    return res.json({
      success: true,
      users: users.map((user) => ({
        ...serializeCurrentUser(user),
        servicesCount: services.filter(
          (service) => String(service.owner) === String(user._id),
        ).length,
        bookingsCount: bookings.filter(
          (booking) => String(booking.userId) === String(user._id),
        ).length,
        joinedAt: user.createdAt || null,
      })),
    });
  }),
);

router.get(
  "/services",
  asyncWrap(async (req, res) => {
    const [services, bookings, reviews] = await Promise.all([
      Service.find({})
        .sort({ createdAt: -1 })
        .populate("owner", "username role bio contactNumber workingHours"),
      Booking.find({}).select("serviceId status"),
      Review.find({})
        .populate({
          path: "bookingId",
          select: "serviceId",
        })
        .select("bookingId rating comment createdAt"),
    ]);

    const reviewsByService = new Map();
    reviews.forEach((review) => {
      const serviceId = review.bookingId?.serviceId;
      if (!serviceId) {
        return;
      }

      const key = String(serviceId);
      if (!reviewsByService.has(key)) {
        reviewsByService.set(key, []);
      }
      reviewsByService.get(key).push(review);
    });

    return res.json({
      success: true,
      services: services.map((service) => {
        const serviceBookings = bookings.filter(
          (booking) => String(booking.serviceId) === String(service._id),
        );
        const serviceReviews = reviewsByService.get(String(service._id)) || [];
        const averageRating = serviceReviews.length
          ? serviceReviews.reduce((total, review) => total + Number(review.rating || 0), 0) /
            serviceReviews.length
          : 0;

        return {
          ...serializeService(
            {
              ...service.toObject(),
              reviewCount: serviceReviews.length,
              bookingCount: serviceBookings.length,
              averageRating,
            },
            { currentUser: req.user },
          ),
          pendingBookings: serviceBookings.filter((booking) => booking.status === "pending").length,
        };
      }),
    });
  }),
);

router.get(
  "/bookings",
  asyncWrap(async (req, res) => {
    const { status = "" } = req.query;
    const parsedLimit = Number.parseInt(req.query.limit, 10);
    const query = status ? { status } : {};

    const bookingsQuery = Booking.find(query)
      .sort({ createdAt: -1 })
      .populate({
        path: "serviceId",
        populate: { path: "owner", select: "username role bio contactNumber workingHours" },
      })
      .populate("userId", "username role");

    if (Number.isFinite(parsedLimit) && parsedLimit > 0) {
      bookingsQuery.limit(parsedLimit);
    }

    const [bookings, counts] = await Promise.all([
      bookingsQuery,
      Booking.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    ]);

    const stats = {
      total: 0,
      pending: 0,
      accepted: 0,
      completed: 0,
      rejected: 0,
    };

    counts.forEach((entry) => {
      if (entry?._id && Object.prototype.hasOwnProperty.call(stats, entry._id)) {
        stats[entry._id] = entry.count;
      }
      stats.total += entry.count || 0;
    });

    return res.json({
      success: true,
      filters: {
        status,
      },
      stats,
      bookings: bookings.map((booking) =>
        serializeBooking(booking, { currentUser: req.user }),
      ),
    });
  }),
);

router.get(
  "/disputes",
  asyncWrap(async (req, res) => {
    const [rejectedBookings, lowRatedReviews] = await Promise.all([
      Booking.find({ status: "rejected" })
        .sort({ createdAt: -1 })
        .populate({
          path: "serviceId",
          populate: { path: "owner", select: "username role bio contactNumber workingHours" },
        })
        .populate("userId", "username role")
        .limit(10),
      Review.find({ rating: { $lte: 2 } })
        .sort({ createdAt: -1 })
        .populate("userId", "username role")
        .populate({
          path: "bookingId",
          populate: {
            path: "serviceId",
            select: "title category location image owner",
            populate: { path: "owner", select: "username role bio contactNumber workingHours" },
          },
        })
        .limit(10),
    ]);

    return res.json({
      success: true,
      disputeSignals: [
        ...rejectedBookings.map((booking) => ({
          id: `booking-${booking._id}`,
          type: "Rejected booking",
          severity: "medium",
          summary: `${booking.serviceId?.title || "Service"} booking was rejected.`,
          detail: booking.notes || "Customer request needs follow-up.",
          createdAt: booking.createdAt || null,
          booking: serializeBooking(booking, { currentUser: req.user }),
        })),
        ...lowRatedReviews.map((review) => ({
          id: `review-${review._id}`,
          type: "Low rating review",
          severity: review.rating === 1 ? "high" : "medium",
          summary: `${review.bookingId?.serviceId?.title || "Service"} received a ${review.rating}/5 review.`,
          detail: review.comment || "Customer reported a poor experience.",
          createdAt: review.createdAt || null,
          review: serializeReview(review),
        })),
      ].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
    });
  }),
);

module.exports = router;
