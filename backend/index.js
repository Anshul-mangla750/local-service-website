// index.js
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const path = require("path");
const { main } = require("./models/init.js");
const Service = require("./models/browse.js");
const Booking = require("./models/booking.js");
const User = require("./models/user.js");
const ejsMate = require("ejs-mate");
const methodOverride = require("method-override");
const { listingSchema } = require("./schema.js");
const { ExpressError } = require("./ExpressError.js");
const flash = require("connect-flash");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const multer = require("multer");
const { storage } = require("./cloudConfig.js");
const upload = multer({ storage });
const Joi = require("joi");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// helper middlewares
const asyncWrap = (fn) => {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

const validateListing = (req, res, next) => {
  const { error } = listingSchema.validate(req.body);
  if (error) {
    throw new ExpressError(error.details[0].message, 400);
  }
  next();
};

const isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    req.flash("error", "You must be logged in");
    return res.redirect("/login");
  }
  next();
};

const isProvider = (req, res, next) => {
  if (!req.user || req.user.role !== "provider") {
    req.flash("error", "You must be a provider to access that resource");
    return res.redirect("/services");
  }
  next();
};

async function startServer() {
  // connect to DB
  await main();

  // session
  const sessionOption = {
    secret: process.env.SESSION_SECRET || "mysupersecretcode",
    resave: false,
    saveUninitialized: true,
    cookie: {
      // expires uses Date object; avoid Date.now() here (that's a number)
      // We'll set maxAge which is enough for browser session lifetime
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      httpOnly: true,
    },
  };

  app.use(session(sessionOption));
  app.use(flash());

  // passport
  app.use(passport.initialize());
  app.use(passport.session());
  passport.use(new LocalStrategy(User.authenticate()));
  passport.serializeUser(User.serializeUser());
  passport.deserializeUser(User.deserializeUser());

  // locals middleware
  app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
  });

  // ---------- BASIC ROUTES ----------
  app.get("/", (req, res) => {
    res.send("Hello World");
  });

  // list all services
  // const Service = require("./models/browse.js
  app.get(
    "/services",
    asyncWrap(async (req, res) => {
      let query = {};
      if (req.query.category) {
        query.category = req.query.category;
      }
      if (req.query.search) {
        const searchRegex = new RegExp(req.query.search, 'i');
        query.$or = [
          { title: searchRegex },
          { description: searchRegex }
        ];
      }
      const services = await Service.find(query);
      // Fetch distinct categories for the filter dropdown
      const categories = await Service.distinct("category");
      res.render("index.ejs", { services, category: req.query.category || null, search: req.query.search || null, categories });
    })
  );

  // delete service
  app.delete(
    "/services/:id",
    asyncWrap(async (req, res) => {
      const { id } = req.params;
      await Service.findByIdAndDelete(id);
      req.flash("error", "Listing is deleted");
      res.redirect("/services");
    })
  );

  // new service form
  app.get("/services/new", isLoggedIn, isProvider, (req, res) => {
    res.render("create.ejs");
  });

  // show route
  app.get(
    "/services/:id",
    asyncWrap(async (req, res) => {
      const { id } = req.params;
      const service = await Service.findById(id).populate("owner");
      if (!service) {
        req.flash("error", "Service not found");
        return res.redirect("/services");
      }

      // Fetch reviews for the service
      const Review = require("./models/reviews.js");
      const reviews = await Review.find({}).populate({
        path: "bookingId",
        match: { serviceId: id },
        populate: { path: "userId", select: "username" }
      }).sort({ createdAt: -1 });

      // Filter reviews where bookingId exists (i.e., for this service)
      const serviceReviews = reviews.filter(r => r.bookingId);

      // Calculate average rating
      const averageRating = serviceReviews.length > 0 ? serviceReviews.reduce((sum, r) => sum + r.rating, 0) / serviceReviews.length : 0;

      // Check if current user can review (has completed booking for this service)
      let canReview = false;
      if (req.user) {
        const completedBooking = await Booking.findOne({
          serviceId: id,
          userId: req.user._id,
          status: "completed"
        });
        canReview = !!completedBooking;

        // Check if user already reviewed
        if (canReview) {
          const existingReview = await Review.findOne({
            bookingId: completedBooking._id,
            userId: req.user._id
          });
          canReview = !existingReview;
        }
      }

      // Fetch distinct categories for search filter
      const categories = await Service.distinct("category");

      res.render("show.ejs", { service, reviews: serviceReviews, averageRating, canReview, categories });
    })
  );
  


  // create service
  app.post(
    "/services",
    isLoggedIn,
    isProvider,
    upload.single("image"),
    validateListing,
    asyncWrap(async (req, res) => {
      // safely handle file presence
      const newServiceData = {
        title: req.body.title,
        description: req.body.description,
        price: req.body.price,
        location: req.body.location,
        category: req.body.category,
        owner: req.user ? req.user._id : undefined,
      };

      if (req.file) {
        newServiceData.image = { url: req.file.path, filename: req.file.filename };
      }

      const newService = new Service(newServiceData);
      await newService.save();
      req.flash("success", "New Listing Created");
      res.redirect("/services");
    })
  );

  // edit form
  app.get(
    "/services/:id/edit",
    isLoggedIn,
    isProvider,
    asyncWrap(async (req, res) => {
      const { id } = req.params;
      const service = await Service.findById(id);
      if (!service) {
        req.flash("error", "Service not found");
        return res.redirect("/services");
      }
      // Only owner should edit (extra safety)
      if (!service.owner || !service.owner.equals(req.user._id)) {
        req.flash("error", "You are not authorized to edit this service");
        return res.redirect(`/services/${id}`);
      }
      res.render("edit.ejs", { service });
    })
  );

  // update service
  app.put(
    "/services/:id",
    isLoggedIn,
    isProvider,
    upload.single("image"),
    validateListing,
    asyncWrap(async (req, res) => {
      const { id } = req.params;
      const { title, description, price, location, category } = req.body;
      const service = await Service.findById(id);

      if (!service) {
        req.flash("error", "Service not found");
        return res.redirect("/services");
      }

      // Only owner may update
      if (!service.owner || !service.owner.equals(req.user._id)) {
        req.flash("error", "You are not authorized to update this service");
        return res.redirect(`/services/${id}`);
      }

      service.title = title;
      service.description = description;
      service.price = price;
      service.location = location;
      service.category = category;

      if (req.file) {
        service.image = { url: req.file.path, filename: req.file.filename };
      }

      await service.save();
      req.flash("success", "Listing is updated");
      res.redirect("/services");
    })
  );

  // ---------- AUTH ROUTES ----------
  app.get("/signup", (req, res) => {
    res.render("signup.ejs");
  });

  app.post(
    "/signup",
    asyncWrap(async (req, res, next) => {
      const { username, password, email, role } = req.body;
      const user1 = new User({ username, email, role });
      const newUser = await User.register(user1, password);
      // log the user in after signup
      req.login(newUser, (err) => {
        if (err) return next(err);
        req.flash("success", "Welcome to service hub");
        // Redirect based on role
        if (req.user.role === "customer") {
          res.redirect("/user/dashboard");
        } else if (req.user.role === "provider") {
          res.redirect("/dashboard");
        } else {
          res.redirect("/services");
        }
      });
    })
  );

  app.get("/login", (req, res) => {
    res.render("login.ejs");
  });

  app.post(
    "/login",
    passport.authenticate("local", { failureRedirect: "/login", failureFlash: true }),
    (req, res) => {
      req.flash("success", "Login successful");
      // Redirect based on role
      if (req.user.role === "customer") {
        res.redirect("/user/dashboard");
      } else if (req.user.role === "provider") {
        res.redirect("/dashboard");
      } else {
        res.redirect("/services");
      }
    }
  );

  app.get("/logout", (req, res, next) => {
    // passport 0.6 uses callback-style logout
    req.logout(function (err) {
      if (err) return next(err);
      req.flash("success", "You are now logged out");
      res.redirect("/services");
    });
  });

  // ---------- BOOKING ROUTES ----------
  // book form
  app.get(
    "/services/:id/book",
    isLoggedIn,
    asyncWrap(async (req, res) => {
      const { id } = req.params;
      const service = await Service.findById(id);
      if (!service) {
        req.flash("error", "Service not found");
        return res.redirect("/services");
      }
      res.render("book.ejs", { service });
    })
  );

  // create booking
  app.post(
    "/bookings",
    isLoggedIn,
    asyncWrap(async (req, res) => {
      const { serviceId, date, time, notes } = req.body;
      const service = await Service.findById(serviceId);
      if (!service) {
        req.flash("error", "Service not found");
        return res.redirect("/services");
      }
      const newBooking = new Booking({
        serviceId,
        userId: req.user._id,
        date,
        time,
        notes,
      });
      await newBooking.save();
      req.flash("success", "Booking request sent successfully");
      res.redirect("/services");
    })
  );

  // submit review from service page
  app.post(
    "/services/:id/reviews",
    isLoggedIn,
    asyncWrap(async (req, res) => {
      const { id } = req.params;
      const { rating, comment } = req.body;

      // Check if user has completed booking for this service
      const completedBooking = await Booking.findOne({
        serviceId: id,
        userId: req.user._id,
        status: "completed"
      });
      if (!completedBooking) {
        req.flash("error", "You can only review services you've completed");
        return res.redirect(`/services/${id}`);
      }

      // Check if review already exists
      const Review = require("./models/reviews.js");
      const existingReview = await Review.findOne({
        bookingId: completedBooking._id,
        userId: req.user._id
      });
      if (existingReview) {
        req.flash("error", "You have already reviewed this service");
        return res.redirect(`/services/${id}`);
      }

      // Create new review
      const newReview = new Review({
        bookingId: completedBooking._id,
        userId: req.user._id,
        rating: parseInt(rating),
        comment,
      });
      await newReview.save();
      req.flash("success", "Review submitted successfully");
      res.redirect(`/services/${id}`);
    })
  );

  // ---------- DASHBOARD (PROVIDER) ----------
  // provider dashboard home — overview: new bookings, completed jobs, revenue
  app.get(
    "/dashboard",
    isLoggedIn,
    isProvider,
    asyncWrap(async (req, res) => {
      // find services owned by provider
      const services = await Service.find({ owner: req.user._id }).select("_id title price");
      const serviceIds = services.map((s) => s._id);

      // new / pending bookings count
      const newBookings = await Booking.find({ serviceId: { $in: serviceIds }, status: "pending" }).populate("serviceId userId");
      const completedBookings = await Booking.find({ serviceId: { $in: serviceIds }, status: "completed" }).populate("serviceId userId");

      // revenue calculation: sum price for completed bookings (assume one booking = service.price)
      // if price can change post-booking, you'd store booking price at creation time
      let revenue = 0;
      const servicePriceMap = {};
      services.forEach((s) => (servicePriceMap[s._id.toString()] = s.price || 0));
      completedBookings.forEach((b) => {
        const sid = b.serviceId._id ? b.serviceId._id.toString() : b.serviceId.toString();
        revenue += Number(servicePriceMap[sid] || 0);
      });

      res.render("dashboard/home.ejs", {
        services,
        newBookings,
        completedCount: completedBookings.length,
        revenue,
      });
    })
  );

  // ---------- USER DASHBOARD (CUSTOMER) ----------
  // user dashboard home — upcoming & past bookings, favorite services
  app.get(
    "/user/dashboard",
    isLoggedIn,
    asyncWrap(async (req, res) => {
      if (req.user.role !== "customer") {
        req.flash("error", "Access denied");
        return res.redirect("/services");
      }

      // upcoming bookings (pending or accepted, future date)
      const upcomingBookings = await Booking.find({
        userId: req.user._id,
        status: { $in: ["pending", "accepted"] },
        date: { $gte: new Date() }
      }).populate("serviceId").sort({ date: 1 });

      // past bookings (completed or rejected)
      const pastBookings = await Booking.find({
        userId: req.user._id,
        status: { $in: ["completed", "rejected"] }
      }).populate("serviceId").sort({ date: -1 });

      // favorite services
      const favoriteServices = await Service.find({ _id: { $in: req.user.favoriteServices || [] } });

      res.render("user/dashboard/home.ejs", {
        upcomingBookings,
        pastBookings,
        favoriteServices,
      });
    })
  );

  // user bookings page
  app.get(
    "/user/dashboard/bookings",
    isLoggedIn,
    asyncWrap(async (req, res) => {
      if (req.user.role !== "customer") {
        req.flash("error", "Access denied");
        return res.redirect("/services");
      }

      const bookings = await Booking.find({ userId: req.user._id }).populate({
        path: "serviceId",
        populate: { path: "owner" }
      }).sort({ createdAt: -1 });
      
      res.render("user/dashboard/bookings.ejs", { bookings });
    })
  );

  // user favorites page
  app.get(
    "/user/dashboard/favorites",
    isLoggedIn,
    asyncWrap(async (req, res) => {
      if (req.user.role !== "customer") {
        req.flash("error", "Access denied");
        return res.redirect("/services");
      }

      const favoriteServices = await Service.find({ _id: { $in: req.user.favoriteServices || [] } });

      res.render("user/dashboard/favorites.ejs", { favoriteServices });
    })
  );

  // add to favorites
  app.post(
    "/user/dashboard/favorites/:serviceId",
    isLoggedIn,
    asyncWrap(async (req, res) => {
      if (req.user.role !== "customer") {
        req.flash("error", "Access denied");
        return res.redirect("/services");
      }

      const { serviceId } = req.params;
      const service = await Service.findById(serviceId);
      if (!service) {
        req.flash("error", "Service not found");
        return res.redirect("/services");
      }

      const user = await User.findById(req.user._id);
      if (!user.favoriteServices.includes(serviceId)) {
        user.favoriteServices.push(serviceId);
        await user.save();
        req.flash("success", "Added to favorites");
      } else {
        req.flash("error", "Already in favorites");
      }

      res.redirect(`/services/${serviceId}`);
    })
  );

  // remove from favorites
  app.delete(
    "/user/dashboard/favorites/:serviceId",
    isLoggedIn,
    asyncWrap(async (req, res) => {
      if (req.user.role !== "customer") {
        req.flash("error", "Access denied");
        return res.redirect("/user/dashboard/favorites");
      }

      const { serviceId } = req.params;
      const user = await User.findById(req.user._id);
      user.favoriteServices = user.favoriteServices.filter(id => id.toString() !== serviceId);
      await user.save();
      req.flash("success", "Removed from favorites");

      res.redirect("/user/dashboard/favorites");
    })
  );

  // user settings page (get)
  app.get(
    "/user/dashboard/settings",
    isLoggedIn,
    asyncWrap(async (req, res) => {
      if (req.user.role !== "customer") {
        req.flash("error", "Access denied");
        return res.redirect("/services");
      }

      res.render("user/dashboard/settings.ejs", { user: req.user });
    })
  );

  // user settings update
  app.put(
    "/user/dashboard/settings",
    isLoggedIn,
    asyncWrap(async (req, res) => {
      if (req.user.role !== "customer") {
        req.flash("error", "Access denied");
        return res.redirect("/user/dashboard/settings");
      }

      const { username, email, address, phone } = req.body;
      const user = await User.findById(req.user._id);
      user.username = username;
      user.email = email;
      user.address = address;
      user.phone = phone;
      await user.save();
      req.flash("success", "Profile updated");
      res.redirect("/user/dashboard/settings");
    })
  );

  // change password
  app.post(
    "/user/dashboard/change-password",
    isLoggedIn,
    asyncWrap(async (req, res) => {
      if (req.user.role !== "customer") {
        req.flash("error", "Access denied");
        return res.redirect("/user/dashboard/settings");
      }

      const { currentPassword, newPassword, confirmPassword } = req.body;
      if (newPassword !== confirmPassword) {
        req.flash("error", "Passwords do not match");
        return res.redirect("/user/dashboard/settings");
      }

      // Note: passport-local-mongoose changePassword method
      const user = await User.findById(req.user._id);
      await user.changePassword(currentPassword, newPassword);
      await user.save();
      req.flash("success", "Password changed successfully");
      res.redirect("/user/dashboard/settings");
    })
  );

  // user wallet/payment history
  app.get(
    "/user/dashboard/wallet",
    isLoggedIn,
    asyncWrap(async (req, res) => {
      if (req.user.role !== "customer") {
        req.flash("error", "Access denied");
        return res.redirect("/services");
      }

      // For now, simulate payment history based on completed bookings
      // In a real app, you'd have a Payment model
      const completedBookings = await Booking.find({
        userId: req.user._id,
        status: "completed"
      }).populate("serviceId");

      const pendingBookings = await Booking.find({
        userId: req.user._id,
        status: { $in: ["pending", "accepted"] }
      }).populate("serviceId");

      let totalSpent = 0;
      const payments = completedBookings.map(booking => {
        const amount = booking.serviceId.price || 0;
        totalSpent += amount;
        return {
          serviceId: booking.serviceId,
          date: booking.date,
          amount: amount,
          status: "completed",
          transactionId: `TXN${booking._id.toString().slice(-8).toUpperCase()}`
        };
      });

      res.render("user/dashboard/wallet.ejs", {
        payments,
        totalSpent,
        completedPayments: completedBookings.length,
        pendingPayments: pendingBookings.length,
      });
    })
  );

  // user reviews page
  app.get(
    "/user/dashboard/reviews",
    isLoggedIn,
    asyncWrap(async (req, res) => {
      if (req.user.role !== "customer") {
        req.flash("error", "Access denied");
        return res.redirect("/services");
      }

      const Review = require("./models/reviews.js");
      const reviews = await Review.find({ userId: req.user._id }).populate({
        path: "bookingId",
        populate: { path: "serviceId" }
      }).sort({ createdAt: -1 });

      const averageRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
      const fiveStarReviews = reviews.filter(r => r.rating === 5).length;

      res.render("user/dashboard/reviews.ejs", {
        reviews,
        averageRating,
        fiveStarReviews,
      });
    })
  );

  // submit review
  app.post(
    "/user/dashboard/reviews",
    isLoggedIn,
    asyncWrap(async (req, res) => {
      if (req.user.role !== "customer") {
        req.flash("error", "Access denied");
        return res.redirect("/user/dashboard/reviews");
      }

      const { bookingId, rating, comment } = req.body;
      const booking = await Booking.findById(bookingId);
      if (!booking || booking.userId.toString() !== req.user._id.toString() || booking.status !== "completed") {
        req.flash("error", "Invalid review submission");
        return res.redirect("/user/dashboard/reviews");
      }

      const Review = require("./models/reviews.js");
      const existingReview = await Review.findOne({ bookingId });
      if (existingReview) {
        req.flash("error", "Review already exists for this booking");
        return res.redirect("/user/dashboard/reviews");
      }

      const newReview = new Review({
        bookingId,
        userId: req.user._id,
        rating: parseInt(rating),
        comment,
      });
      await newReview.save();
      req.flash("success", "Review submitted successfully");
      res.redirect("/user/dashboard/reviews");
    })
  );

  // update review
  app.put(
    "/user/dashboard/reviews/:reviewId",
    isLoggedIn,
    asyncWrap(async (req, res) => {
      if (req.user.role !== "customer") {
        req.flash("error", "Access denied");
        return res.redirect("/user/dashboard/reviews");
      }

      const { reviewId } = req.params;
      const { rating, comment } = req.body;
      const Review = require("./models/reviews.js");
      const review = await Review.findById(reviewId);
      if (!review || review.userId.toString() !== req.user._id.toString()) {
        req.flash("error", "Review not found");
        return res.redirect("/user/dashboard/reviews");
      }

      review.rating = parseInt(rating);
      review.comment = comment;
      await review.save();
      req.flash("success", "Review updated successfully");
      res.redirect("/user/dashboard/reviews");
    })
  );

  // bookings management page (list all bookings for provider's services)
  app.get(
    "/dashboard/bookings",
    isLoggedIn,
    isProvider,
    asyncWrap(async (req, res) => {
      const services = await Service.find({ owner: req.user._id }).select("_id title");
      const serviceIds = services.map((s) => s._id);
      const bookings = await Booking.find({ serviceId: { $in: serviceIds } }).populate("serviceId userId").sort({ createdAt: -1 });
      res.render("dashboard/bookings.ejs", { bookings, services });
    })
  );

  // update booking status: accept / reject / complete
  app.put(
    "/dashboard/bookings/:id/status",
    isLoggedIn,
    isProvider,
    asyncWrap(async (req, res) => {
      const { id } = req.params;
      const { status } = req.body; // expected 'accepted' | 'rejected' | 'completed'
      const booking = await Booking.findById(id).populate("serviceId");
      if (!booking) {
        req.flash("error", "Booking not found");
        return res.redirect("/dashboard/bookings");
      }
      // only provider who owns the service may change status
      if (!booking.serviceId.owner || booking.serviceId.owner.toString() !== req.user._id.toString()) {
        req.flash("error", "You are not authorized to update this booking");
        return res.redirect("/dashboard/bookings");
      }
      if (!["accepted", "rejected", "completed"].includes(status)) {
        req.flash("error", "Invalid status");
        return res.redirect("/dashboard/bookings");
      }
      booking.status = status;
      await booking.save();
      req.flash("success", "Booking status updated");
      res.redirect("/dashboard/bookings");
    })
  );

  // earnings / analytics page
  app.get(
    "/dashboard/earnings",
    isLoggedIn,
    isProvider,
    asyncWrap(async (req, res) => {
      const services = await Service.find({ owner: req.user._id }).select("_id title price category");
      const serviceIds = services.map((s) => s._id);
      const bookings = await Booking.find({ serviceId: { $in: serviceIds } }).populate("serviceId userId");

      // analytics:
      const totalBookings = bookings.length;
      const completedBookings = bookings.filter((b) => b.status === "completed").length;
      const pendingBookings = bookings.filter((b) => b.status === "pending").length;

      // revenue (sum price of completed)
      const priceMap = {};
      services.forEach((s) => (priceMap[s._id.toString()] = s.price || 0));
      let totalRevenue = 0;
      bookings.forEach((b) => {
        if (b.status === "completed") {
          const sid = b.serviceId._id.toString();
          totalRevenue += Number(priceMap[sid] || 0);
        }
      });

      // Calculate average earning per booking
      const averageEarning = completedBookings > 0 ? totalRevenue / completedBookings : 0;

      // Recent bookings (last 10 completed bookings)
      const recentBookings = bookings
        .filter(b => b.status === "completed")
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10);

      // Calculate feedback summary from reviews
      const Review = require("./models/reviews.js");
      const serviceReviews = await Review.find({}).populate({
        path: "bookingId",
        match: { serviceId: { $in: serviceIds } },
      }).sort({ createdAt: -1 });

      // Filter reviews where bookingId exists (i.e., for provider's services)
      const providerReviews = serviceReviews.filter(r => r.bookingId);

      const feedbackSummary = {
        averageRating: providerReviews.length > 0 ? providerReviews.reduce((sum, r) => sum + r.rating, 0) / providerReviews.length : 0,
        totalFeedbacks: providerReviews.length,
      };

      res.render("dashboard/earnings.ejs", {
        services,
        totalBookings,
        completedBookings,
        pendingBookings,
        totalRevenue,
        averageEarning,
        recentBookings,
        feedbackSummary,
      });
    })
  );

  // provider profile settings (get)
  app.get(
    "/dashboard/settings",
    isLoggedIn,
    isProvider,
    asyncWrap(async (req, res) => {
      // req.user holds the user document
      res.render("dashboard/settings.ejs", { user: req.user });
    })
  );

  // provider profile settings (update)
  app.put(
    "/dashboard/settings",
    isLoggedIn,
    isProvider,
    asyncWrap(async (req, res) => {
      const { contactNumber, workingHours, bio } = req.body;
      // store provider-specific fields on user doc; ensure schema supports them
      const user = await User.findById(req.user._id);
      if (!user) {
        req.flash("error", "User not found");
        return res.redirect("/dashboard/settings");
      }
      user.contactNumber = contactNumber || user.contactNumber;
      user.workingHours = workingHours || user.workingHours;
      user.bio = bio || user.bio;
      await user.save();
      req.flash("success", "Profile updated");
      res.redirect("/dashboard/settings");
    })
  );

  // my services page for provider
  app.get(
    "/dashboard/myservices",
    isLoggedIn,
    isProvider,
    asyncWrap(async (req, res) => {
      const services = await Service.find({ owner: req.user._id }).sort({ createdAt: -1 });
      res.render("dashboard/myservices.ejs", { services });
    })
  );

  // ---------- GLOBAL ERROR HANDLING ----------
  app.use((err, req, res, next) => {
    console.error(err);
    const { status = 500, message = "Something went wrong" } = err;
    res.status(status).render("error.ejs", { message });
  });

  // start server
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => {
    console.log(`App is listening on port ${PORT}`);
  });
} // end startServer

startServer().catch((e) => {
  console.error("Failed to start server:", e);
});
