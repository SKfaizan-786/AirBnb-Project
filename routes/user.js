const express = require("express");
const router = express.Router();
const User = require("../models/user.js");  // Uncommented the User model import
const wrapAsync = require("../utils/wrapAsync");
const passport = require("passport");
const { savedRedirectUrl } = require("../middleware.js");

const userController = require("../controllers/user.js");

router.route("/signup")
    .get(userController.renderSignUpForm)
    .post(wrapAsync(userController.signup));

router.route("/login")
    .get(userController.renderLoginForm)
    .post(
        savedRedirectUrl,
        passport.authenticate("local", {
            failureFlash: true,
            failureRedirect: "/login",
        }),
        (req, res, next) => {
            console.log("User authenticated:", req.user); // Debugging log
            next();
        },
        userController.login
    );

router.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        req.flash("success", "Logged out successfully!");
        res.redirect("/");
    });
});

module.exports = router;
