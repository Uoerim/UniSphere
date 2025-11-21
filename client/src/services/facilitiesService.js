import axios from "axios";

const API_URL = "http://localhost:5000/api/facilities/";
const AUTH_API_URL = "http://localhost:5000/api/auth/";

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return {
    Authorization: `Bearer ${token}`,
  };
};

export const getClassroomAvailability = async (date) => {
  const res = await axios.get(API_URL + "classrooms/availability", {
    params: { date },
    headers: getAuthHeader(),
  });

  return res.data;
};

export const getAllClassrooms = async () => {
  const res = await axios.get(API_URL + "classrooms", {
    headers: getAuthHeader(),
  });

  return res.data;
};

export const createClassroom = async (classroomData) => {
  const res = await axios.post(API_URL + "classrooms", classroomData, {
    headers: getAuthHeader(),
  });

  return res.data;
};

export const deleteClassroom = async (classroomId) => {
  const res = await axios.delete(API_URL + `classrooms/${classroomId}`, {
    headers: getAuthHeader(),
  });

  return res.data;
};

export const getAllReservations = async () => {
  const res = await axios.get(API_URL + "reservations", {
    headers: getAuthHeader(),
  });

  return res.data;
};

export const createReservation = async (reservationData) => {
  const res = await axios.post(API_URL + "reservations", reservationData, {
    headers: getAuthHeader(),
  });

  return res.data;
};

export const cancelReservation = async (reservationId) => {
  const res = await axios.patch(
    API_URL + `reservations/${reservationId}/cancel`,
    {},
    {
      headers: getAuthHeader(),
    }
  );

  return res.data;
};

export const getAllTimeslots = async () => {
  const res = await axios.get(API_URL + "timeslots", {
    headers: getAuthHeader(),
  });

  return res.data;
};

export const createTimeslot = async (timeslotData) => {
  const res = await axios.post(API_URL + "timeslots", timeslotData, {
    headers: getAuthHeader(),
  });

  return res.data;
};

export const deleteTimeslot = async (timeslotId) => {
  const res = await axios.delete(API_URL + `timeslots/${timeslotId}`, {
    headers: getAuthHeader(),
  });

  return res.data;
};

export const getAllUsers = async () => {
  const res = await axios.get(AUTH_API_URL + "users", {
    headers: getAuthHeader(),
  });

  return res.data;
};

export const createUser = async (userData) => {
  const res = await axios.post(AUTH_API_URL + "users", userData, {
    headers: getAuthHeader(),
  });

  return res.data;
};

export const deleteUser = async (userId) => {
  const res = await axios.delete(AUTH_API_URL + `users/${userId}`, {
    headers: getAuthHeader(),
  });

  return res.data;
};

export const getDatabaseStats = async () => {
  const res = await axios.get(API_URL + "stats", {
    headers: getAuthHeader(),
  });

  return res.data;
};
