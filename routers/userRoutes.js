import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import dotenv from "dotenv";
dotenv.config();

const userRouter = express.Router();
const SECRET_KEY = process.env.SECRET_KEY;

// Registration route
userRouter.post("/api/register", async (req, res) => {
  const { username, password } = req.body;

  // Validate username and password
  const usernamePattern = /^[a-zA-Z0-9_]{4,}$/;
  if (!usernamePattern.test(username)) {
    return res
      .status(400)
      .json({
        error:
          "Username must be at least 4 characters long and contain only letters, numbers, and underscores",
      });
  }

  if (password.length < 4) {
    return res
      .status(400)
      .json({ error: "Password must be at least 4 characters long" });
  }

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user and save it to the database
    const newUser = new User({
      username,
      password: hashedPassword,
    });

    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Login route
userRouter.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // Compare the entered password with the hashed password in the database
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // Generate a new JWT
    const token = jwt.sign({ username: user.username }, SECRET_KEY, {
      expiresIn: "1h",
    });

    // Set token as an HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,  // Ensures the cookie cannot be accessed by JavaScript
      secure: true,  // Use HTTPS in production
      sameSite: 'Strict',
      maxAge: 3600000, // 1 hour validity
    });

    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Logout route
userRouter.post("/api/logout", (req, res) => {
  // Clear the token cookie when logging out
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
  });
  res.status(200).json({ message: "Logout successful" });
});

export default userRouter;
