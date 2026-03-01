import { Router } from "express";
import { getAllOrders, getOrder, createOrder, updateOrder, deleteOrder } from "./order.controller.js";
import { protect } from "../../middleware/auth.middleware.js";

const router = Router();
router.use(protect);
router.route("/").get(getAllOrders).post(createOrder);
router.route("/:id").get(getOrder).put(updateOrder).delete(deleteOrder);

export default router;
