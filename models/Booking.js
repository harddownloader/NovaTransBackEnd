const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const verificationEnumNotVerified = "notverified";
const verificationEnumVerified = "verified";
const verificationEnumPayed = "payed";


const bookingSchema = new mongoose.Schema(
  {
    price: {
      type: String
    },
    passengers: {
      type: Number,
      default: 1
    },
    seatNumber: {
      type: String,
      required: true
    },
    boardingPoints: {
      type: String,
      required: false
    },
    
    guest: { type: Schema.Types.ObjectId, ref: "Guest" },
    user: { type: Schema.Types.ObjectId, ref: "User" },
    owner: { type: Schema.Types.ObjectId, ref: "Owner" },
    bus: { type: Schema.Types.ObjectId, ref: "Bus" },
    self: { type: Schema.Types.ObjectId, ref: "Owner" },

    verification: {
      type: String,
      enum: [
        verificationEnumVerified,
        verificationEnumNotVerified,
        verificationEnumPayed,
      ],
      default: verificationEnumNotVerified
    }
  },
  { timestamps: true }
);

module.exports = {
  Booking: mongoose.model("Booking", bookingSchema),
  verificationEnumVerified,
  verificationEnumNotVerified,
  verificationEnumPayed,
}
