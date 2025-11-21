const express = require("express");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Simple test route
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "UMS backend is running" });
});

module.exports = app;
