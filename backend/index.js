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
      const services = await Service.find({});
      res.render("index.ejs", { services });
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
      res.render("show.ejs", { service });
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
        res.redirect("/services");
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
      res.redirect("/services");
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
      const services = await Service.find({ owner: req.user._id }).select("_id title price");
      const serviceIds = services.map((s) => s._id);
      const bookings = await Booking.find({ serviceId: { $in: serviceIds } }).populate("serviceId");

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

      // simple feedback summary placeholder — if you have a Feedback model you can aggregate here
      const feedbackSummary = {
        averageRating: null,
        totalFeedbacks: 0,
      };

      res.render("dashboard/earnings.ejs", {
        services,
        totalBookings,
        completedBookings,
        pendingBookings,
        totalRevenue,
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
