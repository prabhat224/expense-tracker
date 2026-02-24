const User = require("../models/User");

// GET /api/users/profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch profile.", error: error.message });
  }
};

// PUT /api/users/profile
const updateProfile = async (req, res) => {
  try {
    const { username, email } = req.body;
    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { username, email },
      { new: true, runValidators: true }
    );
    res.status(200).json({ message: "Profile updated.", user: updated });
  } catch (error) {
    res.status(500).json({ message: "Failed to update profile.", error: error.message });
  }
};

// GET /api/users  (admin only)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json({ count: users.length, users });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users.", error: error.message });
  }
};

// DELETE /api/users/:id  (admin only)
const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "User deleted." });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete user.", error: error.message });
  }
};

module.exports = { getProfile, updateProfile, getAllUsers, deleteUser };
