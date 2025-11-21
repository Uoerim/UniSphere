const express = require("express");
const router = express.Router();

const { 
  getClassroomAvailability, 
  getAllClassrooms, 
  getAllReservations, 
  getDatabaseStats,
  createClassroom,
  createReservation,
  cancelReservation,
  getAllTimeslots,
  createTimeslot,
  deleteTimeslot,
  deleteClassroom
} = require("../controllers/facilitiesController");
const { protect, requireAdmin } = require("../middleware/auth");

// More specific routes first
router.get("/classrooms/availability", protect, getClassroomAvailability);
router.get("/stats", protect, getDatabaseStats);

// General routes
router.get("/classrooms", protect, getAllClassrooms);
router.post("/classrooms", protect, requireAdmin, createClassroom);
router.delete("/classrooms/:classroomId", protect, requireAdmin, deleteClassroom);

router.get("/reservations", protect, getAllReservations);
router.post("/reservations", protect, createReservation);
router.patch("/reservations/:reservationId/cancel", protect, cancelReservation);

router.get("/timeslots", protect, getAllTimeslots);
router.post("/timeslots", protect, requireAdmin, createTimeslot);
router.delete("/timeslots/:timeslotId", protect, requireAdmin, deleteTimeslot);

module.exports = router;
