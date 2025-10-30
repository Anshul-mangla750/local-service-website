const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema({
    serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    time: {
        type: String,
        required: true,
    },
    notes: {
        type: String,
        default: "",
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "completed", "rejected"],
        default: "pending",
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Booking = mongoose.model("Booking", BookingSchema);
module.exports = Booking;
