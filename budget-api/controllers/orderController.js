const Order = require("../models/Order");

const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({ owner: req.user._id })
      .populate("customerId", "name email")
      .sort({ createdAt: -1 });
    res.status(200).json({ count: orders.length, orders });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch orders.", error: error.message });
  }
};

const getOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, owner: req.user._id }).populate("customerId", "name email");
    if (!order) return res.status(404).json({ message: "Order not found." });
    res.status(200).json({ order });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch order.", error: error.message });
  }
};

const createOrder = async (req, res) => {
  try {
    const { customerId, amount, items } = req.body;
    if (!customerId || !amount) return res.status(400).json({ message: "customerId and amount are required." });
    const order = await Order.create({ customerId, amount, items, owner: req.user._id });
    res.status(201).json({ message: "Order created.", order });
  } catch (error) {
    res.status(500).json({ message: "Failed to create order.", error: error.message });
  }
};

const updateOrder = async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!order) return res.status(404).json({ message: "Order not found." });
    res.status(200).json({ message: "Order updated.", order });
  } catch (error) {
    res.status(500).json({ message: "Failed to update order.", error: error.message });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!order) return res.status(404).json({ message: "Order not found." });
    res.status(200).json({ message: "Order deleted." });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete order.", error: error.message });
  }
};

module.exports = { getAllOrders, getOrder, createOrder, updateOrder, deleteOrder };
