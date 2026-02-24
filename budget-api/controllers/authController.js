const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Helper: sign JWT
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

// Helper: send token response
const sendTokenResponse = (user, statusCode, res, message = "Success") => {
  const token = signToken(user._id);
  const userObj = user.toObject();
  delete userObj.password;

  res.status(statusCode).json({ message, token, user: userObj });
};

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Please provide username, email, and password." });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(409).json({ message: "A user with that email or username already exists." });
    }

    const user = await User.create({ username, email, password });
    sendTokenResponse(user, 201, res, "User registered successfully.");
  } catch (error) {
    res.status(500).json({ message: "Registration failed.", error: error.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please provide email and password." });
    }

    // Need to explicitly select password since it's hidden by default
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    sendTokenResponse(user, 200, res, "Login successful.");
  } catch (error) {
    res.status(500).json({ message: "Login failed.", error: error.message });
  }
};

// POST /api/auth/logout  (client-side token removal; server-side is stateless)
const logout = (req, res) => {
  res.status(200).json({ message: "Logged out successfully. Please discard your token." });
};

module.exports = { register, login, logout };
