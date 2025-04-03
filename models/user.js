const mongoose = require("mongoose");
const { use } = require("passport");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new Schema({
    email: {
        type: String,
        required: true
    }
});

userSchema.plugin(passportLocalMongoose, {
    usernameField: "email" // Ensures authentication works using email
});  // Adds username, hash and salt fields to store the username, the hashed password and the salt value.

module.exports = mongoose.model('User', userSchema); // Exporting the model