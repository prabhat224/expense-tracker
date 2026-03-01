import { getUserById, updateUserById, getAllUsers, deleteUserById } from "./user.service.js";
import { successResponse, errorResponse } from "../../utils/response.js";

export const getProfile = async (req, res) => {
  try {
    const user = await getUserById(req.user.id);
    return successResponse(res, { user });
  } catch (err) { return errorResponse(res, "Failed to fetch profile.", 500, err); }
};

export const updateProfile = async (req, res) => {
  try {
    const { username, email } = req.body;
    const user = await updateUserById(req.user.id, { username, email });
    return successResponse(res, { user }, "Profile updated.");
  } catch (err) { return errorResponse(res, "Failed to update profile.", 500, err); }
};

export const getUsers = async (req, res) => {
  try {
    const users = await getAllUsers();
    return successResponse(res, { count: users.length, users });
  } catch (err) { return errorResponse(res, "Failed to fetch users.", 500, err); }
};

export const deleteUser = async (req, res) => {
  try {
    await deleteUserById(Number(req.params.id));
    return successResponse(res, null, "User deleted.");
  } catch (err) { return errorResponse(res, "Failed to delete user.", 500, err); }
};
