import { Router } from "express";
import { getAllOrders, getOrder, createOrder, updateOrder, deleteOrder } from "./order.controller.js";
import { protect } from "../../middleware/auth.middleware.js";
import { audit } from "../../middleware/audit.middleware.js";

const router = Router();
router.use(protect);
router.route("/").get(getAllOrders).post(audit('CREATE', 'order'), createOrder);
router.route("/:id").get(getOrder).put(audit('UPDATE', 'order'), updateOrder).delete(audit('DELETE', 'order'), deleteOrder);

export default router;
