import express from "express";
import { database } from "../model/database.js";
import jwt from "jsonwebtoken";
import { authenticateToken } from "../libs/utils.js";

const router = express.Router({
  mergeParams: true,
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await database.user.findUnique({
    where: { email },
    include: {
      role: true,
    },
  });
  if (!user || !(password === user.password)) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
    expiresIn: "24h",
  });
  // Set the token as an HTTP-only cookie
  res.cookie("token", token, {
    httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
    sameSite: "lax",
    secure: false,
    maxAge: 24 * 60 * 60 * 1000, // 1 hour in milliseconds
  });

  // Send a success message or user data back to the client
  res.status(200).json({ message: "Login successful", user });
});

router.get("/check-auth", authenticateToken, async (req, res) => {
  const user = await database.user.findUnique({
    where: {
      id: req.user.userId,
    },
    include: {
      role: true,
    },
  });
  const { password, ...rest } = user;
  if (!user) {
    return res.status(401).json({ user: null });
  }

  res.status(200).send({ user: rest });
});
router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 0,
  });

  res.status(200).json({ message: "Logout successful" });
});
export default router;
