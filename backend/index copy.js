if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}
const express = require("express");
const app = express();
const path = require("path");
const { main } = require("./models/init.js");
const Service = require("./models/browse.js");
const Booking = require("./models/booking.js");
const ejsMate = require("ejs-mate");
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
const methodOverride = require("method-override");
app.use(methodOverride("_method"));
app.use(express.static("public"));  
app.engine("ejs", ejsMate);
const { listingSchema } = require("./schema.js");
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
const { ExpressError } = require("./ExpressError.js");
const Joi = require("joi");
const flash = require("connect-flash");
const User = require("./models/user.js");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const passportLocalMongoose = require("passport-local-mongoose");
const multer = require("multer");
const { storage } = require("./cloudConfig.js");
const upload = multer({ storage });

async function startServer() {
  await main();
  const sessionOption = {
    secret: "mysupersecretcode",
    resave: false,
    saveUninitialized: true,
    cookie: {
      expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
      maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: true,
    },
  };
  app.use(flash());

  app.use(session(sessionOption));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(new LocalStrategy(User.authenticate()));
  passport.serializeUser(User.serializeUser());
  passport.deserializeUser(User.deserializeUser());

  app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    // console.log(res.locals.message);
    next();
  });
  const asyncWrap = (fn) => {
    return function (req, res, next) {
      fn(req, res, next).catch(next);
    };
  };
  const validateListing = (req, res, next) => {
    const { error } = listingSchema.validate(req.body);
    if (error) {
      throw new ExpressError(error.details[0].message, 400);
    } else {
      next();
    }
  };
  //home route
  app.get("/", (req, res) => {
    res.send("Hello World");
  });

  app.get(
    "/services",
    asyncWrap(async (req, res) => {
      let services = await Service.find({});
      res.render("index.ejs", { services });
    })
  );

  app.delete(
    "/services/:id", 
    asyncWrap(async (req, res) => {
      let { id } = req.params;
      await Service.findByIdAndDelete(id);
      req.flash("error", " Listing is deleted");

      res.redirect("/services");
    })
  );
  app.get("/services/new", (req, res) => {
    if (!req.isAuthenticated()) {
      req.flash("error", "you must be logged in to create listing");
      return res.redirect("/login");
    }
    res.render("create.ejs");
  });

  // show route
  app.get(
    "/services/:id",
    asyncWrap(async (req, res) => {
      let { id } = req.params;
      let service = await Service.findById(id).populate("owner");
      console.log(service);
      res.render("show.ejs", { service });
    })
  );

  // create new route
  app.post("/services", upload.single("image"), (req, res) => {
    let url = req.file.path;
    let filename = req.file.filename;
    console.log(url, "..", filename);
    let { title, description, price, location, category } = req.body;
    let newService = new Service({
      title,
      description,

      price,
      location,
      category,
    });
    newService.image = { url, filename };
    newService.owner = req.user._id;
    newService.save();
    req.flash("success", "New Listing Created");
    res.redirect("/services");
  });

  // edit route
  app.get(
    "/services/:id/edit",
    asyncWrap(async (req, res) => {
      let { id } = req.params;
      let service = await Service.findById(id);
      req.flash("success", " Listing is  updated");
      res.render("edit.ejs", { service });
    })
  );

  app.put(
    "/services/:id",
    upload.single("image"),
    validateListing,
    asyncWrap(async (req, res, next) => {
      let { id } = req.params;
      let { title, description, price, location, category } = req.body;
      let service = await Service.findByIdAndUpdate(id, {
        title,
        description,
        price,
        location,
        category,
      });
      if (typeof req.file !== "undefined") {
        let url = req.file.path;
        let filename = req.file.filename;
        service.image = { url, filename };
        await service.save();
      }

      res.redirect("/services");
    })
  );

  // authentication  routes
  app.get("/signup", (req, res) => {
    res.render("signup.ejs");
  });

  app.post(
    "/signup",
    asyncWrap(async (req, res) => {
      let { username, password, email, role } = req.body;
      let user1 = new User({
        username,
        email,
        role,
      });
      let newUser = await User.register(user1, password);
      req.login(newUser, (err) => {
        if (err) {
          next(err);
        }
        req.flash("success", " welcome to service hub");
        res.redirect("/services");
      });
    })
  );

  app.get("/login", (req, res) => {
    res.render("login.ejs");
  });

  app.get("/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return next(err);
      }

      req.flash("success", " you are now log out from the page");
      res.redirect("/services");
    });
  });

  app.post(
    "/login",
    passport.authenticate("local", { failureRedirect: "/login" }),
    async (req, res) => {
      req.flash("success", " login  successfull");
      res.redirect("/services");
    }
  );

  // booking routes
  app.get("/services/:id/book", (req, res) => {
    if (!req.isAuthenticated()) {
      req.flash("error", "you must be logged in to book a service");
      return res.redirect("/login");
    }
    let { id } = req.params;
    let service = Service.findById(id);
    res.render("book.ejs", { service });
  });

  app.post("/bookings", asyncWrap(async (req, res) => {
    if (!req.isAuthenticated()) {
      req.flash("error", "you must be logged in to book a service");
      return res.redirect("/login");
    }
    let { serviceId, date, time, notes } = req.body;
    let newBooking = new Booking({
      serviceId,
      userId: req.user._id,
      date,
      time,
      notes,
    });
    await newBooking.save();
    req.flash("success", "Booking request sent successfully");
    res.redirect("/services");
  }));

  //eror handling middleware

  app.use((err, req, res, next) => {
    let { status = 500, message = "some error occured" } = err;
    res.status(status).render("error.ejs", { message });
  });
  app.listen(8080, () => {
    console.log("app is listening on port 8080");
  });
}

startServer();
