const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (user) => {
    return jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
}

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: "Please provide username and password" });
        }

        const user = await User.findOne({ username: username.toLowerCase() });

        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        const token = signToken(user);

        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                role: user.role,
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

exports.validateToken = async (req, res) => {
    try {
        res.json({
            valid: true,
            user: {
                id: req.user._id,
                name: req.user.name,
                username: req.user.username,
                role: req.user.role,
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select("-password").sort({ createdAt: -1 });

        res.json({
            success: true,
            count: users.length,
            users,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

exports.adminCreateUser = async (req, res) => {
    try {
        const { name, username, password, role } = req.body;

        if (!name || !username || !password || !role) {
            return res.status(400).json({ message: "Please provide all required fields" });
        }

        const existingUser = await User.findOne({ username: username.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ message: "Username already exists" });
        }

        const newUser = await User.create({
            name,
            username: username.toLowerCase(),
            password,
            role
        });

        res.status(201).json({
            success: true,
            message: "User created successfully",
            user: {
                id: newUser._id,
                name: newUser.name,
                username: newUser.username,
                role: newUser.role,
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

exports.createUser = async (req, res) => {
    try {
        const { name, username, password, role } = req.body;

        if (!name || !username || !password || !role) {
            return res.status(400).json({ message: "Please provide all required fields: name, username, password, role" });
        }

        if (!['student', 'admin', 'instructor'].includes(role)) {
            return res.status(400).json({ message: "Invalid role. Must be student, admin, or instructor" });
        }

        const existingUser = await User.findOne({ username: username.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ message: "Username already exists" });
        }

        const newUser = await User.create({
            name,
            username: username.toLowerCase(),
            password,
            role
        });

        res.status(201).json({
            success: true,
            message: "User created successfully",
            user: {
                id: newUser._id,
                name: newUser.name,
                username: newUser.username,
                role: newUser.role,
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;

        // Don't allow deleting yourself
        if (req.user._id.toString() === userId) {
            return res.status(400).json({ message: "Cannot delete your own account" });
        }

        const user = await User.findByIdAndDelete(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({
            success: true,
            message: "User deleted successfully",
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};