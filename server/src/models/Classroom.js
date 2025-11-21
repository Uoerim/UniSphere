const mongoose = require("mongoose");

const classroomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,      // basic constraint
      trim: true,
    },
    building: {
      type: String,
      required: true,
      trim: true,
    },
    floor: {
      type: Number,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    type: {
      type: String,
      enum: ["lecture", "lab", "tutorial", "exam", "other"],
      default: "lecture",
    },
    resources: [
      {
        type: String,
        trim: true,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Classroom = mongoose.model("Classroom", classroomSchema);
module.exports = Classroom;
