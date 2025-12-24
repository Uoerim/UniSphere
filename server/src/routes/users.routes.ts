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

// GET all accounts (admin only)
router.get("/", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const accounts = await prisma.account.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(accounts);
  } catch (error) {
    console.error("Get accounts error:", error);
    res.status(500).json({ error: "Failed to fetch accounts" });
  }
});

// GET single account by ID (admin only)
router.get("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = req.params.id as string;

    const account = await prisma.account.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }

    res.json(account);
  } catch (error) {
    console.error("Get account error:", error);
    res.status(500).json({ error: "Failed to fetch account" });
  }
});

// CREATE new account (admin only)
router.post("/", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { email, password, role = 'STUDENT' } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Check if account already exists
    const existingAccount = await prisma.account.findUnique({
      where: { email }
    });

    if (existingAccount) {
      return res.status(400).json({ error: "Account with this email already exists" });
    }

    // Validate role
    const validRoles = ['ADMIN', 'STAFF', 'STUDENT', 'PARENT'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: "Invalid role. Must be one of: ADMIN, STAFF, STUDENT, PARENT" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create account
    const account = await prisma.account.create({
      data: {
        email,
        password: hashedPassword,
        role
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    res.status(201).json(account);
  } catch (error) {
    console.error("Create account error:", error);
    // Return the actual error message if available
    const errorMessage = error instanceof Error ? error.message : "Failed to create account";
    res.status(500).json({ error: errorMessage });
  }
});

// UPDATE account (admin only)
router.put("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = req.params.id as string;
    const { email, password, role } = req.body;

    // Check if account exists
    const existingAccount = await prisma.account.findUnique({
      where: { id }
    });

    if (!existingAccount) {
      return res.status(404).json({ error: "Account not found" });
    }

    // Prepare update data
    const updateData: any = {};

    if (email) {
      // Check if new email is already taken by another account
      const emailTaken = await prisma.account.findFirst({
        where: {
          email,
          NOT: { id }
        }
      });

      if (emailTaken) {
        return res.status(400).json({ error: "Email is already taken" });
      }

      updateData.email = email;
    }

    if (password) {
      // Hash new password
      updateData.password = await bcrypt.hash(password, 10);
    }

    if (role) {
      // Validate role
      const validRoles = ['ADMIN', 'STAFF', 'STUDENT', 'PARENT'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: "Invalid role. Must be one of: ADMIN, STAFF, STUDENT, PARENT" });
      }
      updateData.role = role;
    }

    // Update account
    const account = await prisma.account.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    res.json(account);
  } catch (error) {
    console.error("Update account error:", error);
    res.status(500).json({ error: "Failed to update account" });
  }
});

// DELETE account (admin only)
router.delete("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = req.params.id as string;
    const currentUser = (req as any).user;

    // Prevent admin from deleting their own account
    if (currentUser.id === id) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }

    // Check if account exists
    const account = await prisma.account.findUnique({
      where: { id }
    });

    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }

    // Delete account
    await prisma.account.delete({
      where: { id }
    });

    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({ error: "Failed to delete account" });
  }
});

export const usersRouter = router;
