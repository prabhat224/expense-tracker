const Task = require("../models/Task");

const getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ count: tasks.length, tasks });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch tasks.", error: error.message });
  }
};

const getTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });
    if (!task) return res.status(404).json({ message: "Task not found." });
    res.status(200).json({ task });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch task.", error: error.message });
  }
};

const createTask = async (req, res) => {
  try {
    const { description, priority, dueDate } = req.body;
    if (!description) return res.status(400).json({ message: "Description is required." });
    const task = await Task.create({ description, priority, dueDate, owner: req.user._id });
    res.status(201).json({ message: "Task created.", task });
  } catch (error) {
    res.status(500).json({ message: "Failed to create task.", error: error.message });
  }
};

const updateTask = async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!task) return res.status(404).json({ message: "Task not found." });
    res.status(200).json({ message: "Task updated.", task });
  } catch (error) {
    res.status(500).json({ message: "Failed to update task.", error: error.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!task) return res.status(404).json({ message: "Task not found." });
    res.status(200).json({ message: "Task deleted." });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete task.", error: error.message });
  }
};

module.exports = { getAllTasks, getTask, createTask, updateTask, deleteTask };
