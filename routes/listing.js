const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const Listing = require("../models/listing.js");
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");
const listingController = require("../controllers/listing.js");
const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const axios = require("axios");

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Only image files are allowed!"), false);
        }
    },
});

// Function to get latitude & longitude using OpenStreetMap API
async function getCoordinates(location) {
    try {
        if (!location.trim()) throw new Error("Location is required.");

        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`;
        const response = await axios.get(url, { timeout: 5000 });

        if (response.data.length === 0) return { latitude: null, longitude: null };

        return {
            latitude: parseFloat(response.data[0].lat),
            longitude: parseFloat(response.data[0].lon),
        };
    } catch (error) {
        console.error("Geocoding error:", error.message);
        return { latitude: null, longitude: null };
    }
}

// GET all listings & POST new listing
router.route("/")
    .get(asyncHandler(listingController.index))
    .post(
        isLoggedIn,
        upload.single("listing[image]"),
        validateListing,
        asyncHandler(async (req, res) => {
            const { location } = req.body.listing;
            const { latitude, longitude } = await getCoordinates(location);

            if (latitude === null || longitude === null) {
                req.flash("error", "Invalid location. Please enter a valid address.");
                return res.redirect("/listings/new");
            }

            req.body.listing.latitude = latitude;
            req.body.listing.longitude = longitude;

            const listing = new Listing(req.body.listing);
            listing.owner = req.user._id;

            if (req.file) {
                listing.image = { filename: req.file.filename, url: req.file.path };
            }

            await listing.save();
            req.flash("success", "Successfully created a new listing!");
            res.redirect(`/listings/${listing._id}`);
        })
    );

// Render New Listing Form
router.get("/new", isLoggedIn, listingController.renderNewForm);

// GET listing, UPDATE listing, DELETE listing
router.route("/:id")
    .get(asyncHandler(listingController.showListing))
    .put(
        isLoggedIn,
        isOwner,
        upload.single("listing[image]"),
        validateListing,
        asyncHandler(async (req, res) => {
            const { id } = req.params;
            const { location } = req.body.listing;
            const { latitude, longitude } = await getCoordinates(location);

            if (latitude === null || longitude === null) {
                req.flash("error", "Invalid location. Please enter a valid address.");
                return res.redirect(`/listings/${id}/edit`);
            }

            req.body.listing.latitude = latitude;
            req.body.listing.longitude = longitude;

            let listing = await Listing.findById(id);
            if (!listing) {
                req.flash("error", "Listing not found!");
                return res.redirect("/listings");
            }

            // Preserve existing image if no new one is uploaded
            if (!req.file && req.body.listing.existingImage) {
                req.body.listing.image = listing.image;
            } else if (req.file) {
                req.body.listing.image = {
                    filename: req.file.filename,
                    url: req.file.path,
                };
            }

            listing.set(req.body.listing);
            await listing.save();

            req.flash("success", "Successfully updated the listing!");
            res.redirect(`/listings/${listing._id}`);
        })
    )
    .delete(isLoggedIn, isOwner, asyncHandler(async (req, res) => {
        await Listing.findByIdAndDelete(req.params.id);
        req.flash("success", "Listing deleted successfully!");
        res.redirect("/listings");
    }));

// Render Edit Form
router.get("/:id/edit", isLoggedIn, isOwner, asyncHandler(listingController.renderEditForm));

module.exports = router;