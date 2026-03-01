import { registerUser, loginUser } from "./auth.service.js";
import { successResponse, errorResponse } from "../../utils/response.js";

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return errorResponse(res, "username, email, and password are required.", 400);
    const data = await registerUser({ username, email, password });
    return successResponse(res, data, "User registered successfully.", 201);
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500, err);
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return errorResponse(res, "Email and password are required.", 400);
    const data = await loginUser({ email, password });
    return successResponse(res, data, "Login successful.");
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500, err);
  }
};

export const logout = (req, res) => {
  return successResponse(res, null, "Logged out successfully. Please discard your token.");
};

export const getMe = async (req, res) => {
  return successResponse(res, { user: req.user }, "User fetched.");
};
