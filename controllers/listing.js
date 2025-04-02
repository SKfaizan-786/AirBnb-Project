const Listing = require("../models/listing");

module.exports.index = async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
};

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs", { listing: {} });
};

module.exports.showListing = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id)
        .populate({
            path: "reviews",
            populate: {
                path: "author",
            },
        })
        .populate("owner");
    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        res.redirect("/listings");
    }
    res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res, next) => {
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;

    // Handle uploaded image
    if (req.file) {
        newListing.image = {
            url: req.file.path, // Cloudinary or local path
            filename: req.file.filename, // Automatically generated
        };
    } else {
        // Fallback to default image
        newListing.image = {
            url: "https://images.unsplash.com/photo-1625505826533-5c80aca7d157?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fGdvYXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
            filename: "default_image_name",
        };
    }

    await newListing.save();
    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        res.redirect("/listings");
    }
    let originalImageUrl = listing.image.url;
    if (originalImageUrl.includes("/upload")) {
        originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250/e_blur:100");
    }
    res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
    try {
        let { id } = req.params;

        // Prepare update data
        let updateData = { ...req.body.listing };

        // Handle image updates
        if (req.file) {
            updateData.image = { url: req.file.path, filename: req.file.filename };
        } else if (req.body.existingImage) {
            updateData.image = { url: req.body.existingImage }; // Retain the old image
        }

        // Find and update listing in one query
        let listing = await Listing.findByIdAndUpdate(id, updateData, { new: true });

        if (!listing) {
            req.flash("error", "Listing not found!");
            return res.redirect("/listings");
        }

        req.flash("success", "Listing Updated!");
        res.redirect(`/listings/${id}`);
    } catch (error) {
        console.error("Update Listing Error:", error);
        req.flash("error", "Something went wrong while updating the listing!");
        res.redirect(`/listings/${id}/edit`);
    }
};

module.exports.destroyListing = async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success", "Listing Deleated!");
    res.redirect("/listings");
};