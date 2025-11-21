require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");


const run = async () => {
    await connectDB();

    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
        console.log("Admin user already exists. Exiting.");
        process.exit(0);
    }

    const adminUser = new User({
        name: "Default Admin",
        username: "admin",
        password: "admin123",
        role: "admin",
    });

    await adminUser.save();

    console.log("Admin user created with username: 'admin' and password: 'admin123'");
    process.exit(0);
};


run();