const mongoose = require("mongoose");

const timeslotSchema = new mongoose.Schema(
  {
    dayOfWeek: {
      type: String,
      enum: [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
      required: true,
    },
    startTime: {
      type: String, // "08:30"
      required: true,
    },
    endTime: {
      type: String, // "10:00"
      required: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate timeslots with same (day, start, end)
timeslotSchema.index(
  { dayOfWeek: 1, startTime: 1, endTime: 1 },
  { unique: true }
);

const Timeslot = mongoose.model("Timeslot", timeslotSchema);
module.exports = Timeslot;
