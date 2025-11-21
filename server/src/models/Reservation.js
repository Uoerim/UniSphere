const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema(
  {
    classroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Classroom",
      required: true,
    },
    timeslot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Timeslot",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    reservedFor: {
      type: String,  // e.g. "CS101 - Data Structures"
      required: true,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["confirmed", "pending", "cancelled"],
      default: "confirmed",
    },
  },
  { timestamps: true }
);

// Prevent double-booking: same room + date + timeslot
reservationSchema.index(
  { classroom: 1, date: 1, timeslot: 1 },
  { unique: true }
);

const Reservation = mongoose.model("Reservation", reservationSchema);
module.exports = Reservation;
