const express = require("express");

const asyncWrap = require("../../middleware/asyncWrap.js");
const Booking = require("../../models/booking.js");
const Review = require("../../models/reviews.js");
const Service = require("../../models/browse.js");
const User = require("../../models/user.js");
const {
  normalizeImage,
  serializeReview,
  serializeService,
} = require("../../utils/serializers.js");

const router = express.Router();

router.get(
  "/",
  asyncWrap(async (req, res) => {
    const [
      featuredServices,
      totalServices,
      providersCount,
      completedJobs,
      categoryRows,
      ratingRows,
      testimonials,
    ] = await Promise.all([
      Service.find({})
        .populate("owner", "username role bio contactNumber workingHours")
        .sort({ _id: -1 })
        .limit(6),
      Service.countDocuments({}),
      User.countDocuments({ role: "provider" }),
      Booking.countDocuments({ status: "completed" }),
      Service.aggregate([
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
            averagePrice: { $avg: "$price" },
            sampleImage: { $first: "$image" },
            sampleLocation: { $first: "$location" },
          },
        },
        { $sort: { count: -1, _id: 1 } },
        { $limit: 6 },
      ]),
      Review.aggregate([
        {
          $group: {
            _id: null,
            averageRating: { $avg: "$rating" },
            totalReviews: { $sum: 1 },
          },
        },
      ]),
      Review.find({})
        .sort({ createdAt: -1 })
        .limit(4)
        .populate("userId", "username role")
        .populate({
          path: "bookingId",
          populate: {
            path: "serviceId",
            select: "title category image location",
          },
        }),
    ]);

    return res.json({
      success: true,
      stats: {
        totalServices,
        providersCount,
        completedJobs,
        averageRating: ratingRows[0]?.averageRating
          ? Number(ratingRows[0].averageRating.toFixed(1))
          : 0,
        totalReviews: ratingRows[0]?.totalReviews || 0,
      },
      featuredServices: featuredServices.map((service) =>
        serializeService(service, { currentUser: req.user }),
      ),
      categories: categoryRows.map((row) => ({
        name: row._id,
        count: row.count,
        averagePrice: Number((row.averagePrice || 0).toFixed(0)),
        location: row.sampleLocation || "",
        image: normalizeImage(row.sampleImage),
      })),
      testimonials: testimonials
        .filter((review) => review.bookingId && review.bookingId.serviceId)
        .map((review) => serializeReview(review)),
      spotlight: {
        headline: "From urgent plumbing fixes to trusted electricians, LocalFix helps customers hire reliable pros nearby.",
        subheadline:
          "Search hyper-local services, compare providers, book confidently, and manage the full customer-provider workflow in one place.",
      },
    });
  }),
);

module.exports = router;
