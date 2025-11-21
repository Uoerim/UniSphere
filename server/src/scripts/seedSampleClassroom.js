require("dotenv").config();
const connectDB = require("../config/db");
const Classroom = require("../models/Classroom");

const run = async () => {
  try {
    await connectDB();

    const sample = await Classroom.create({
      name: "B-201",
      building: "Main Building",
      floor: 2,
      capacity: 40,
      type: "lecture",
      resources: ["Projector", "Whiteboard", "AC"],
    });

    console.log("Sample classroom created:", sample);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
