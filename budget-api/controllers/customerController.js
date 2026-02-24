const Customer = require("../models/Customer");

const getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.status(200).json({ count: customers.length, customers });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch customers.", error: error.message });
  }
};

const getCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: "Customer not found." });
    res.status(200).json({ customer });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch customer.", error: error.message });
  }
};

const createCustomer = async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    if (!name || !email) return res.status(400).json({ message: "Name and email are required." });
    const customer = await Customer.create({ name, email, phone, address, owner: req.user._id });
    res.status(201).json({ message: "Customer created.", customer });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "A customer with that email already exists." });
    res.status(500).json({ message: "Failed to create customer.", error: error.message });
  }
};

const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!customer) return res.status(404).json({ message: "Customer not found." });
    res.status(200).json({ message: "Customer updated.", customer });
  } catch (error) {
    res.status(500).json({ message: "Failed to update customer.", error: error.message });
  }
};

const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) return res.status(404).json({ message: "Customer not found." });
    res.status(200).json({ message: "Customer deleted." });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete customer.", error: error.message });
  }
};

module.exports = { getAllCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer };
