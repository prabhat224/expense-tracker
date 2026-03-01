import { Router } from "express";
import { getAllCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer } from "./customer.controller.js";
import { protect } from "../../middleware/auth.middleware.js";

const router = Router();
router.use(protect);
router.route("/").get(getAllCustomers).post(createCustomer);
router.route("/:id").get(getCustomer).put(updateCustomer).delete(deleteCustomer);

export default router;
