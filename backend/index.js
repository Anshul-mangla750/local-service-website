if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const fs = require("fs");
const http = require("http");
const path = require("path");
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local");

const { ExpressError } = require("./ExpressError.js");
const { main } = require("./models/init.js");
const User = require("./models/user.js");
const apiRoutes = require("./routes/api/index.js");
const { initializeSocket } = require("./socket/index.js");

const app = express();
const server = http.createServer(app);
const frontendDistPath = path.join(__dirname, "..", "frontend", "dist");

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const sessionOptions = {
  secret: process.env.SESSION_SECRET || "mysupersecretcode",
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  },
};

const sessionMiddleware = session(sessionOptions);

app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Service Hub API is running.",
  });
});

app.use("/api", apiRoutes);

if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));

  app.get(/^\/(?!api(?:\/|$)).*/, (req, res) => {
    res.sendFile(path.join(frontendDistPath, "index.html"));
  });
}

app.use((req, res, next) => {
  next(new ExpressError("Route not found", 404));
});

app.use((err, req, res, next) => {
  console.error(err);

  const status = err.status || 500;
  const message = err.message || "Something went wrong.";

  res.status(status).json({
    success: false,
    message,
  });
});

async function startServer() {
  await main();
  await initializeSocket(server, {
    sessionMiddleware,
    passport,
  });

  const port = process.env.PORT || 8080;
  server.listen(port, () => {
    console.log(`App is listening on port ${port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
});
