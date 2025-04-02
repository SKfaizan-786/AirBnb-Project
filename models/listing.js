const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./reviews.js");

const listingSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: String,
    image: {
        filename: String,
        url: String,
    },
    price: Number,
    location: String,
    country: String,
    latitude: {
        type: Number,
        default: null, // Ensures geolocation is optional
    },
    longitude: {
        type: Number,
        default: null,
    },
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: "Review",
        },
    ],
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
});

listingSchema.post("findOneAndDelete", async (listing) => {
    if(listing) {
        await Review.deleteMany({_id: { $in: listing.reviews } });
    }
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;