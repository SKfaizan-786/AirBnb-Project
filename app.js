if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const multer = require("multer");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

// Ensure ATLASDB_URL is set
const dbUrl = process.env.ATLASDB_URL;
if (!dbUrl) {
    console.error("❌ ERROR: ATLASDB_URL is missing in .env");
    process.exit(1);
}

// MongoDB Connection with Retry Mechanism
async function connectDB(retries = 5) {
    while (retries) {
        try {
            await mongoose.connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true });
            console.log("✅ Connected to MongoDB");
            return;
        } catch (err) {
            console.error("❌ MongoDB Connection Error:", err);
            retries -= 1;
            console.log(`Retrying MongoDB connection... (${5 - retries}/5)`);
            await new Promise((res) => setTimeout(res, 5000)); // Wait before retrying
        }
    }
    console.error("❌ Could not connect to MongoDB after multiple attempts.");
    process.exit(1);
}
connectDB();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

// Session Store
const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: { secret: process.env.SECRET || "fallbackSecretKey" },
    touchAfter: 24 * 3600,
});

store.on("error", (err) => {
    console.error("❌ ERROR IN MONGO SESSION STORE:", err);
});

const sessionOptions = {
    store,
    secret: process.env.SECRET || "fallbackSecretKey",
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
    },
};

app.use(session(sessionOptions));
app.use(flash());

// Passport.js Authentication
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Middleware
app.use((req, res, next) => {
    res.locals.successMsg = req.flash("success");
    res.locals.errorMsg = req.flash("error");
    res.locals.currentUser = req.user || null;
    next();
});

// Routes
app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

// Handle Undefined Routes (404)
app.all("*", (req, res, next) => {
    next(new ExpressError(404, "Page Not Found!"));
});

// Multer File Upload Error Handling
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError || err.message === "Only image files are allowed!") {
        req.flash("error", err.message);
        return res.redirect("back");
    }
    next(err);
});

// Global Error Handler
app.use((err, req, res, next) => {
    const { statusCode = 500, message = "Something went wrong!" } = err;
    console.error(`❌ Error (${statusCode}): ${message}`);
    res.status(statusCode).render("error.ejs", { message });
});

// Start Server
const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

// Graceful Shutdown Handling
process.on("SIGTERM", () => {
    console.log("👋 SIGTERM received. Shutting down gracefully...");
    server.close(() => {
        console.log("💥 Process terminated!");
        process.exit(0);
    });
});
