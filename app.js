if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const multer = require("multer");
const ExpressError = require("./utils/ExpressError.js");
const User = require("./models/user.js");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

const app = express();
const PORT = process.env.PORT || 8080;
const dbUrl = process.env.ATLASDB_URL;
if (!dbUrl) {
    console.error("❌ ERROR: ATLASDB_URL is missing in .env");
    process.exit(1);
}

// Connect to MongoDB
async function connectDB() {
    try {
        await mongoose.connect(dbUrl);
        console.log("✅ Connected to MongoDB");
    } catch (err) {
        console.error("❌ MongoDB Connection Error:", err);
        process.exit(1);
    }
}
connectDB();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "/public")));

// Setup session store
const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: { secret: process.env.SECRET || "fallbackSecretKey" },
    touchAfter: 24 * 3600,
});

store.on("error", (err) => console.error("❌ ERROR IN MONGO SESSION STORE:", err));

const sessionOptions = {
    store,
    secret: process.env.SECRET || "fallbackSecretKey",
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true, // Protects against XSS
        secure: process.env.NODE_ENV === "production" && process.env.HTTPS_ENABLED === "true", // Enables secure cookies only if HTTPS is enabled
    },
};
app.use(session(sessionOptions));
app.use(flash());

// Initialize Passport.js
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Middleware for global variables
app.use((req, res, next) => {
    // console.log("Session Data:", req.session); // Debugging
    // console.log("Current User:", req.user);  // Check if user is being set
    res.locals.successMsg = req.flash("success");
    res.locals.errorMsg = req.flash("error");
    res.locals.currentUser = req.user || null;
    next();
});

// Routes
app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

// Handle invalid routes
app.all("*", (req, res, next) => next(new ExpressError(404, "Page Not Found!")));

// Multer error handling
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError || err.message === "Only image files are allowed!") {
        req.flash("error", err.message);
        return res.redirect("back");
    }
    next(err);
});

// Global error handler
app.use((err, req, res, next) => {
    const { statusCode = 500, message = "Something went wrong!" } = err;
    console.error(`❌ Error (${statusCode}): ${message}`);
    res.status(statusCode).render("error.ejs", { message });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});