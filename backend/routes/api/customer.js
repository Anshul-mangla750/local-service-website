const express = require("express");

const asyncWrap = require("../../middleware/asyncWrap.js");
const { ensureCustomer } = require("../../middleware/auth.js");
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

router.use(ensureCustomer);

router.get(
  "/dashboard",
  asyncWrap(async (req, res) => {
    const [user, upcomingBookings, pastBookings, favorites, reviews] = await Promise.all([
      User.findById(req.user._id),
      Booking.find({
        userId: req.user._id,
        status: { $in: ["pending", "accepted"] },
      })
        .sort({ date: 1 })
        .populate({
          path: "serviceId",
          populate: { path: "owner", select: "username role bio contactNumber workingHours" },
        })
        .populate("userId", "username role"),
      Booking.find({
        userId: req.user._id,
        status: { $in: ["completed", "rejected"] },
      })
        .sort({ date: -1 })
        .populate({
          path: "serviceId",
          populate: { path: "owner", select: "username role bio contactNumber workingHours" },
        })
        .populate("userId", "username role"),
      Service.find({ _id: { $in: req.user.favoriteServices || [] } })
        .sort({ _id: -1 })
        .populate("owner", "username role bio contactNumber workingHours"),
      Review.find({ userId: req.user._id })
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

    const totalSpent = pastBookings.reduce((total, booking) => {
      if (booking.status !== "completed" || !booking.serviceId) {
        return total;
      }

      return total + Number(booking.serviceId.price || 0);
    }, 0);

    return res.json({
      success: true,
      user: serializeCurrentUser(user),
      stats: {
        upcomingCount: upcomingBookings.length,
        completedCount: pastBookings.filter((booking) => booking.status === "completed").length,
        favoritesCount: favorites.length,
        reviewsCount: reviews.length,
        totalSpent,
      },
      upcomingBookings: upcomingBookings.slice(0, 4).map((booking) =>
        serializeBooking(booking, { currentUser: user }),
      ),
      pastBookings: pastBookings.slice(0, 4).map((booking) =>
        serializeBooking(booking, { currentUser: user }),
      ),
      favoriteServices: favorites.slice(0, 4).map((service) =>
        serializeService(service, { currentUser: user }),
      ),
      recentReviews: reviews.slice(0, 3).map((review) => serializeReview(review)),
    });
  }),
);

router.get(
  "/bookings",
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
  "/favorites",
  asyncWrap(async (req, res) => {
    const user = await User.findById(req.user._id);
    const favoriteServices = await Service.find({
      _id: { $in: user.favoriteServices || [] },
    })
      .sort({ _id: -1 })
      .populate("owner", "username role bio contactNumber workingHours");

    return res.json({
      success: true,
      services: favoriteServices.map((service) =>
        serializeService(service, { currentUser: user }),
      ),
      user: serializeCurrentUser(user),
    });
  }),
);

router.post(
  "/favorites/:serviceId",
  asyncWrap(async (req, res) => {
    const { serviceId } = req.params;
    const [service, user] = await Promise.all([
      Service.findById(serviceId),
      User.findById(req.user._id),
    ]);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found.",
      });
    }

    if (!user.favoriteServices.some((id) => String(id) === serviceId)) {
      user.favoriteServices.push(service._id);
      await user.save();
    }

    return res.json({
      success: true,
      message: "Saved to favorites.",
      user: serializeCurrentUser(user),
    });
  }),
);

router.delete(
  "/favorites/:serviceId",
  asyncWrap(async (req, res) => {
    const { serviceId } = req.params;
    const user = await User.findById(req.user._id);

    user.favoriteServices = user.favoriteServices.filter(
      (id) => String(id) !== serviceId,
    );
    await user.save();

    return res.json({
      success: true,
      message: "Removed from favorites.",
      user: serializeCurrentUser(user),
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
    const { username, email, address, phone } = req.body;
    const user = await User.findById(req.user._id);

    user.username = username || user.username;
    user.email = email || user.email;
    user.address = address || "";
    user.phone = phone || "";
    await user.save();

    return res.json({
      success: true,
      message: "Profile updated successfully.",
      user: serializeCurrentUser(user),
    });
  }),
);

router.post(
  "/change-password",
  asyncWrap(async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all password fields.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirmation password do not match.",
      });
    }

    const user = await User.findById(req.user._id);
    await user.changePassword(currentPassword, newPassword);
    await user.save();

    return res.json({
      success: true,
      message: "Password changed successfully.",
    });
  }),
);

router.get(
  "/wallet",
  asyncWrap(async (req, res) => {
    const completedBookings = await Booking.find({
      userId: req.user._id,
      status: "completed",
    })
      .sort({ date: -1 })
      .populate({
        path: "serviceId",
        populate: { path: "owner", select: "username role bio contactNumber workingHours" },
      })
      .populate("userId", "username role");

    const pendingBookings = await Booking.find({
      userId: req.user._id,
      status: { $in: ["pending", "accepted"] },
    });

    let totalSpent = 0;
    const payments = completedBookings.map((booking) => {
      const amount = Number(booking.serviceId?.price || 0);
      totalSpent += amount;

      return {
        ...serializeBooking(booking, { currentUser: req.user }),
        amount,
        transactionId: `TXN${String(booking._id).slice(-8).toUpperCase()}`,
      };
    });

    return res.json({
      success: true,
      stats: {
        totalSpent,
        completedPayments: completedBookings.length,
        pendingPayments: pendingBookings.length,
      },
      payments,
    });
  }),
);

router.get(
  "/reviews",
  asyncWrap(async (req, res) => {
    const reviews = await Review.find({ userId: req.user._id })
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

    const averageRating = reviews.length
      ? reviews.reduce((total, review) => total + Number(review.rating || 0), 0) / reviews.length
      : 0;

    return res.json({
      success: true,
      stats: {
        averageRating: Number(averageRating.toFixed(1)),
        totalReviews: reviews.length,
        fiveStarReviews: reviews.filter((review) => review.rating === 5).length,
      },
      reviews: reviews.map((review) => serializeReview(review)),
    });
  }),
);

router.put(
  "/reviews/:reviewId",
  asyncWrap(async (req, res) => {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;

    const review = await Review.findById(reviewId)
      .populate("userId", "username role")
      .populate({
        path: "bookingId",
        populate: {
          path: "serviceId",
          select: "title category location image owner",
          populate: { path: "owner", select: "username role bio contactNumber workingHours" },
        },
      });

    if (!review || String(review.userId?._id || review.userId) !== String(req.user._id)) {
      return res.status(404).json({
        success: false,
        message: "Review not found.",
      });
    }

    review.rating = Number(rating);
    review.comment = comment || "";
    await review.save();

    return res.json({
      success: true,
      message: "Review updated successfully.",
      review: serializeReview(review),
    });
  }),
);

module.exports = router;
