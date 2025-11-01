const mongoose = require("mongoose");
const passport =  require("passport") ;
const LocalStrategy = require("passport-local");
const  passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
    },
    role: {
        type: String,
        enum: ["customer", "provider"],
        default: "customer"
    },
    // Provider-specific fields
    contactNumber: String,
    workingHours: String,
    bio: String,
    // Customer-specific fields
    address: String,
    phone: String,
    favoriteServices: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service"
    }],
}, { timestamps: true });
userSchema.plugin(passportLocalMongoose);


module.exports = mongoose.model("User", userSchema);
