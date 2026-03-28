const express = require("express");
const multer = require("multer");

const asyncWrap = require("../../middleware/asyncWrap.js");
const {
  ensureAuthenticated,
  ensureCustomer,
  ensureProvider,
  validateListing,
} = require("../../middleware/auth.js");
const Booking = require("../../models/booking.js");
const Review = require("../../models/reviews.js");
const Service = require("../../models/browse.js");
const { storage } = require("../../cloudConfig.js");
const {
  serializeReview,
  serializeService,
  toIdArray,
} = require("../../utils/serializers.js");

const router = express.Router();
const upload = multer({ storage });

async function requireOwnedService(serviceId, userId) {
  const service = await Service.findById(serviceId).populate(
    "owner",
    "username role bio contactNumber workingHours",
  );

  if (!service) {
    return { error: { status: 404, message: "Service not found." } };
  }

  if (!service.owner || String(service.owner._id) !== String(userId)) {
    return { error: { status: 403, message: "You are not allowed to manage this service." } };
  }

  return { service };
}

router.get(
  "/",
  asyncWrap(async (req, res) => {
    const { category, search } = req.query;
    const parsedLimit = Number.parseInt(req.query.limit, 10);
    const query = {};

    if (category) {
      query.category = category;
    }

    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { location: searchRegex },
        { category: searchRegex },
      ];
    }

    const servicesQuery = Service.find(query)
      .populate("owner", "username role bio contactNumber workingHours")
      .sort({ _id: -1 });

    if (Number.isFinite(parsedLimit) && parsedLimit > 0) {
      servicesQuery.limit(parsedLimit);
    }

    const [services, total, categories] = await Promise.all([
      servicesQuery,
      Service.countDocuments(query),
      Service.aggregate([
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
      ]),
    ]);

    return res.json({
      success: true,
      total,
      filters: {
        category: category || "",
        search: search || "",
      },
      categories: categories.map((item) => ({
        name: item._id,
        count: item.count,
      })),
      services: services.map((service) =>
        serializeService(service, { currentUser: req.user }),
      ),
    });
  }),
);

router.get(
  "/:id",
  asyncWrap(async (req, res) => {
    const { id } = req.params;
    const service = await Service.findById(id).populate(
      "owner",
      "username role bio contactNumber workingHours",
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found.",
      });
    }

    const bookings = await Booking.find({ serviceId: id })
      .sort({ date: -1 })
      .populate("userId", "username role");
    const bookingIds = bookings.map((booking) => booking._id);

    const reviews = bookingIds.length
      ? await Review.find({ bookingId: { $in: bookingIds } })
          .sort({ createdAt: -1 })
          .populate("userId", "username role")
      : [];

    const bookingMap = new Map(bookings.map((booking) => [String(booking._id), booking]));
    const hydratedReviews = reviews
      .map((review) => {
        const matchingBooking = bookingMap.get(String(review.bookingId));
        if (!matchingBooking) {
          return null;
        }

        return serializeReview({
          ...review.toObject(),
          userId: review.userId,
          bookingId: {
            ...matchingBooking.toObject(),
            userId: matchingBooking.userId,
            serviceId: service,
          },
        });
      })
      .filter(Boolean);

    const averageRating = hydratedReviews.length
      ? hydratedReviews.reduce((total, review) => total + review.rating, 0) / hydratedReviews.length
      : 0;

    const relatedServices = await Service.find({
      category: service.category,
      _id: { $ne: service._id },
    })
      .populate("owner", "username role bio contactNumber workingHours")
      .limit(4)
      .sort({ _id: -1 });

    const currentUserFavoriteIds = req.user
      ? toIdArray(req.user.favoriteServices || [])
      : [];

    let canReview = false;
    if (req.user && req.user.role === "customer") {
      const completedBooking = bookings.find(
        (booking) =>
          String(booking.userId?._id || booking.userId) === String(req.user._id) &&
          booking.status === "completed",
      );

      if (completedBooking) {
        const existingReview = reviews.find(
          (review) =>
            String(review.bookingId) === String(completedBooking._id) &&
            String(review.userId?._id || review.userId) === String(req.user._id),
        );
        canReview = !existingReview;
      }
    }

    return res.json({
      success: true,
      service: {
        ...serializeService(service, { currentUser: req.user }),
        averageRating: Number(averageRating.toFixed(1)),
        reviewCount: hydratedReviews.length,
        bookingCount: bookings.length,
        isFavorite: currentUserFavoriteIds.includes(String(service._id)),
        isOwner:
          req.user && service.owner
            ? String(service.owner._id) === String(req.user._id)
            : false,
      },
      reviews: hydratedReviews,
      canReview,
      relatedServices: relatedServices.map((relatedService) =>
        serializeService(relatedService, { currentUser: req.user }),
      ),
    });
  }),
);

router.post(
  "/",
  ensureProvider,
  upload.single("image"),
  validateListing,
  asyncWrap(async (req, res) => {
    const newService = new Service({
      title: req.body.title,
      description: req.body.description,
      price: Number(req.body.price),
      location: req.body.location,
      category: req.body.category,
      owner: req.user._id,
      image: req.file
        ? {
            url: req.file.path,
            filename: req.file.filename,
          }
        : undefined,
    });

    await newService.save();
    await newService.populate("owner", "username role bio contactNumber workingHours");

    return res.status(201).json({
      success: true,
      message: "Service created successfully.",
      service: serializeService(newService, { currentUser: req.user }),
    });
  }),
);

router.put(
  "/:id",
  ensureProvider,
  upload.single("image"),
  validateListing,
  asyncWrap(async (req, res) => {
    const { id } = req.params;
    const { error, service } = await requireOwnedService(id, req.user._id);

    if (error) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }

    service.title = req.body.title;
    service.description = req.body.description;
    service.price = Number(req.body.price);
    service.location = req.body.location;
    service.category = req.body.category;

    if (req.file) {
      service.image = {
        url: req.file.path,
        filename: req.file.filename,
      };
    }

    await service.save();

    return res.json({
      success: true,
      message: "Service updated successfully.",
      service: serializeService(service, { currentUser: req.user }),
    });
  }),
);

router.delete(
  "/:id",
  ensureProvider,
  asyncWrap(async (req, res) => {
    const { id } = req.params;
    const { error, service } = await requireOwnedService(id, req.user._id);

    if (error) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }

    const relatedBookings = await Booking.find({ serviceId: service._id }).select("_id");
    const bookingIds = relatedBookings.map((booking) => booking._id);

    if (bookingIds.length) {
      await Review.deleteMany({ bookingId: { $in: bookingIds } });
    }

    await Booking.deleteMany({ serviceId: service._id });
    await Service.findByIdAndDelete(service._id);

    return res.json({
      success: true,
      message: "Service deleted successfully.",
    });
  }),
);

router.post(
  "/:id/reviews",
  ensureAuthenticated,
  ensureCustomer,
  asyncWrap(async (req, res) => {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const service = await Service.findById(id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found.",
      });
    }

    const completedBooking = await Booking.findOne({
      serviceId: id,
      userId: req.user._id,
      status: "completed",
    });

    if (!completedBooking) {
      return res.status(400).json({
        success: false,
        message: "You can only review services that you have completed.",
      });
    }

    const existingReview = await Review.findOne({
      bookingId: completedBooking._id,
      userId: req.user._id,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this service.",
      });
    }

    const newReview = new Review({
      bookingId: completedBooking._id,
      userId: req.user._id,
      rating: Number(rating),
      comment,
    });

    await newReview.save();
    await newReview.populate("userId", "username role");

    return res.status(201).json({
      success: true,
      message: "Review submitted successfully.",
      review: serializeReview({
        ...newReview.toObject(),
        userId: newReview.userId,
        bookingId: {
          ...completedBooking.toObject(),
          serviceId: service,
        },
      }),
    });
  }),
);

module.exports = router;
