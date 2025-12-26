import { Router, Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "shhhhhhhh";

// Middleware to verify JWT token
const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.substring(7);

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Get account
    const account = await prisma.account.findUnique({
      where: { id: decoded.userId }
    });

    if (!account) {
      return res.status(401).json({ error: "User not found" });
    }

    // Attach user to request
    (req as any).user = account;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
};

// Middleware to verify admin role
const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;

  if (!user || user.role !== 'ADMIN') {
    return res.status(403).json({ error: "Admin access required" });
  }

  next();
};

// Register endpoint (admin only)
router.post("/register", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { email, password, role = 'STUDENT' } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Check if user already exists
    const existingAccount = await prisma.account.findUnique({
      where: { email }
    });

    if (existingAccount) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Validate role
    const validRoles = ['ADMIN', 'STAFF', 'STUDENT', 'FACULTY'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create account
    const account = await prisma.account.create({
      data: {
        email,
        password: hashedPassword,
        role
      }
    });

    // Generate JWT token
    const token = jwt.sign({
      userId: account.id,
      email: account.email,
      role: account.role
    }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      token,
      user: {
        id: account.id,
        email: account.email,
        role: account.role,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

// Login endpoint
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find account by email
    const account = await prisma.account.findUnique({
      where: { email }
    });

    if (!account) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, account.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Update lastLogin timestamp
    await prisma.account.update({
      where: { id: account.id },
      data: { lastLogin: new Date() }
    });

    // Generate JWT token
    const token = jwt.sign({
      userId: account.id,
      email: account.email,
      role: account.role
    }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      token,
      user: {
        id: account.id,
        email: account.email,
        role: account.role,
        createdAt: account.createdAt,
        mustChangePassword: account.mustChangePassword,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// Get current user (protected route)
router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.substring(7);

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Get account
    const account = await prisma.account.findUnique({
      where: { id: decoded.userId }
    });

    if (!account) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      id: account.id,
      email: account.email,
      role: account.role,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
      mustChangePassword: account.mustChangePassword,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Failed to get user data" });
  }
});

// Reset temp password (for users who logged in with temp password)
router.post("/reset-temp-password", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const { newPassword, confirmPassword } = req.body;

    // Check if user actually needs to change password
    if (!user.mustChangePassword) {
      return res.status(400).json({ error: "Password change not required" });
    }

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({ error: "New password and confirmation are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear temp password flags
    await prisma.account.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        mustChangePassword: false,
        tempPassword: null
      }
    });

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Reset temp password error:", error);
    res.status(500).json({ error: "Failed to reset password" });
  }
});

// Change password (protected route)
router.post("/change-password", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current password and new password are required" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters" });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.account.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ error: "Failed to change password" });
  }
});

export const authRouter = router;
