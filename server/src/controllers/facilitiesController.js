// src/controllers/facilitiesController.js
const Classroom = require("../models/Classroom");
const Timeslot = require("../models/Timeslot");
const Reservation = require("../models/Reservation");

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

exports.getClassroomAvailability = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res
        .status(400)
        .json({ message: "Query parameter 'date' is required (YYYY-MM-DD)" });
    }

    const selectedDate = new Date(date);
    if (isNaN(selectedDate.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    const dayOfWeek = DAY_NAMES[selectedDate.getDay()];

    const classrooms = await Classroom.find({ isActive: true }).lean();
    const timeslots = await Timeslot.find({ dayOfWeek }).lean();

    if (!timeslots.length || !classrooms.length) {
      return res.json({
        date,
        dayOfWeek,
        slots: [],
      });
    }

    const classroomIds = classrooms.map((c) => c._id);
    const timeslotIds = timeslots.map((t) => t._id);

    const reservations = await Reservation.find({
      date: selectedDate,
      classroom: { $in: classroomIds },
      timeslot: { $in: timeslotIds },
    }).lean();

    const reservedSet = new Set(
      reservations.map(
        (r) => `${r.classroom.toString()}-${r.timeslot.toString()}`
      )
    );

    const slots = timeslots.map((ts) => {
      const availableRooms = classrooms
        .filter(
          (room) =>
            !reservedSet.has(`${room._id.toString()}-${ts._id.toString()}`)
        )
        .map((room) => ({
          id: room._id,
          name: room.name,
          building: room.building,
          capacity: room.capacity,
        }));

      return {
        timeslotId: ts._id,
        dayOfWeek,
        startTime: ts.startTime,
        endTime: ts.endTime,
        availableRooms,
      };
    });

    res.json({
      date,
      dayOfWeek,
      slots,
    });
  } catch (err) {
    console.error("Error in getClassroomAvailability:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllClassrooms = async (req, res) => {
  try {
    const classrooms = await Classroom.find().sort({ name: 1 });

    res.json({
      success: true,
      count: classrooms.length,
      classrooms,
    });
  } catch (err) {
    console.error("Error in getAllClassrooms:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find()
      .populate("classroom", "name building capacity")
      .populate("timeslot", "startTime endTime dayOfWeek")
      .populate("createdBy", "name username")
      .sort({ date: -1 });

    res.json({
      success: true,
      count: reservations.length,
      reservations,
    });
  } catch (err) {
    console.error("Error in getAllReservations:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getDatabaseStats = async (req, res) => {
  try {
    const classroomCount = await Classroom.countDocuments();
    const reservationCount = await Reservation.countDocuments();
    const timeslotCount = await Timeslot.countDocuments();

    res.json({
      success: true,
      stats: {
        classrooms: classroomCount,
        reservations: reservationCount,
        timeslots: timeslotCount,
      },
    });
  } catch (err) {
    console.error("Error in getDatabaseStats:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.createClassroom = async (req, res) => {
  try {
    const { name, building, floor, capacity, type, resources } = req.body;

    if (!name || !building || !capacity) {
      return res.status(400).json({ message: "Please provide required fields: name, building, capacity" });
    }

    const existingClassroom = await Classroom.findOne({ name });
    if (existingClassroom) {
      return res.status(400).json({ message: "Classroom with this name already exists" });
    }

    const classroom = await Classroom.create({
      name,
      building,
      floor,
      capacity,
      type: type || 'lecture',
      resources: resources || [],
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: "Classroom created successfully",
      classroom,
    });
  } catch (err) {
    console.error("Error in createClassroom:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.createReservation = async (req, res) => {
  try {
    const { classroom, timeslot, date, reservedFor } = req.body;

    if (!classroom || !timeslot || !date || !reservedFor) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    // Check if classroom and timeslot exist
    const classroomExists = await Classroom.findById(classroom);
    const timeslotExists = await Timeslot.findById(timeslot);

    if (!classroomExists || !timeslotExists) {
      return res.status(400).json({ message: "Invalid classroom or timeslot" });
    }

    // Check if already reserved
    const selectedDate = new Date(date);
    const existingReservation = await Reservation.findOne({
      classroom,
      timeslot,
      date: selectedDate,
    });

    if (existingReservation) {
      return res.status(400).json({ message: "This classroom is already reserved for this time slot" });
    }

    const reservation = await Reservation.create({
      classroom,
      timeslot,
      date: selectedDate,
      reservedFor,
      createdBy: req.user._id,
      status: 'confirmed'
    });

    await reservation.populate("classroom", "name building capacity");
    await reservation.populate("timeslot", "startTime endTime dayOfWeek");
    await reservation.populate("createdBy", "name username");

    res.status(201).json({
      success: true,
      message: "Reservation created successfully",
      reservation,
    });
  } catch (err) {
    console.error("Error in createReservation:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.cancelReservation = async (req, res) => {
  try {
    const { reservationId } = req.params;

    const reservation = await Reservation.findByIdAndUpdate(
      reservationId,
      { status: 'cancelled' },
      { new: true }
    )
      .populate("classroom", "name building capacity")
      .populate("timeslot", "startTime endTime dayOfWeek")
      .populate("createdBy", "name username");

    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    res.json({
      success: true,
      message: "Reservation cancelled successfully",
      reservation,
    });
  } catch (err) {
    console.error("Error in cancelReservation:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllTimeslots = async (req, res) => {
  try {
    const timeslots = await Timeslot.find().sort({ dayOfWeek: 1, startTime: 1 });

    res.json({
      success: true,
      count: timeslots.length,
      timeslots,
    });
  } catch (err) {
    console.error("Error in getAllTimeslots:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.createTimeslot = async (req, res) => {
  try {
    const { dayOfWeek, startTime, endTime } = req.body;

    if (!dayOfWeek || !startTime || !endTime) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    const validDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    if (!validDays.includes(dayOfWeek)) {
      return res.status(400).json({ message: "Invalid day of week" });
    }

    const timeslot = await Timeslot.create({
      dayOfWeek,
      startTime,
      endTime
    });

    res.status(201).json({
      success: true,
      message: "Timeslot created successfully",
      timeslot,
    });
  } catch (err) {
    console.error("Error in createTimeslot:", err);
    if (err.code === 11000) {
      return res.status(400).json({ message: "This timeslot already exists" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteTimeslot = async (req, res) => {
  try {
    const { timeslotId } = req.params;

    const timeslot = await Timeslot.findByIdAndDelete(timeslotId);

    if (!timeslot) {
      return res.status(404).json({ message: "Timeslot not found" });
    }

    res.json({
      success: true,
      message: "Timeslot deleted successfully",
      timeslot,
    });
  } catch (err) {
    console.error("Error in deleteTimeslot:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteClassroom = async (req, res) => {
  try {
    const { classroomId } = req.params;

    const classroom = await Classroom.findByIdAndDelete(classroomId);

    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    res.json({
      success: true,
      message: "Classroom deleted successfully",
      classroom,
    });
  } catch (err) {
    console.error("Error in deleteClassroom:", err);
    res.status(500).json({ message: "Server error" });
  }
};
