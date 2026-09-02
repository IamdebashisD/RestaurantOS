import { Router } from "express"

import { authenticate } from "../../../middlewares/auth.middleware.js"
import { requireRestaurantAccess } from "../../../middlewares/restaurant-access.middleware.js"
import { requiredRole } from "../../../middlewares/role.middleware.js"

import validate from "../../../middlewares/validate.middleware.js"
import { createOrderDto } from "../dto/create-order.dto.js"
import { updateOrderDto } from "../dto/update-order.dto.js"

import { 
    createOrderController,
    getRestaurantOrdersController,
    getOrderController,
    updateOrderController,
    cancelOrderController,
    confirmOrderController,
    prepareOrderController,
    readyOrderController,
    serveOrderController,
    completeOrderController,
    markOrderAsPaidController,
    markOrderPaymentAsFailedController,
    refundOrderPaymentController,
} from "../controllers/order.controller.js"


const router = Router()

/**
 * @route POST /api/v1/restaurants/:restaurantId/orders
 * @desc  Create an order for a restaurant
 * @access Private - OWNER / MANAGER
 */
router.post(
    "/:restaurantId/orders",
    authenticate,
    requireRestaurantAccess,
    requiredRole("OWNER", "MANAGER"),
    validate(createOrderDto),
    createOrderController
)

/**
 * @route GET /api/v1/restaurants/:restaurantId/orders
 * @desc  Get all orders for a restaurant
 * @access Private - OWNER / MANAGER
 */
router.get(
    "/:restaurantId/orders",
    authenticate,
    requireRestaurantAccess,
    requiredRole("OWNER", "MANAGER"),
    getRestaurantOrdersController
)

/**
 * @route GET /api/v1/restaurants/:restaurantId/orders/:orderId
 * @desc  Get a single order
 * @access Private - OWNER / MANAGER
 */
router.get(
    "/:restaurantId/orders/:orderId",
    authenticate,
    requireRestaurantAccess,
    requiredRole("OWNER", "MANAGER"),
    getOrderController
)

/**
 * @route PATCH /api/v1/restaurants/:restaurantId/orders/:orderId
 * @desc  Update an order
 * @access Private - OWNER / MANAGER
 */
router.patch(
    "/:restaurantId/orders/:orderId",
    authenticate,
    requireRestaurantAccess,
    requiredRole("OWNER", "MANAGER"),
    validate(updateOrderDto),
    updateOrderController
)

/**
 * @route PATCH /api/v1/restaurants/:restaurantId/orders/:orderId/cancel
 * @desc  Cancel an order
 * @access Private - OWNER / MANAGER
 */
router.patch(
    "/:restaurantId/orders/:orderId/cancel",
    authenticate,
    requireRestaurantAccess,
    requiredRole("OWNER", "MANAGER"),
    cancelOrderController
)

/**
 * @route PATCH /api/v1/restaurants/:restaurantId/orders/:orderId/confirm
 * @desc  Confirm an order
 * @access Private - OWNER / MANAGER
 */
router.patch(
    "/:restaurantId/orders/:orderId/confirm",
    authenticate,
    requireRestaurantAccess,
    requiredRole("OWNER", "MANAGER"),
    confirmOrderController
)

/**
 * @route PATCH /api/v1/restaurants/:restaurantId/orders/:orderId/prepare
 * @desc  Start preparing an order
 * @access Private - OWNER / MANAGER
 */
router.patch(
    "/:restaurantId/orders/:orderId/prepare",
    authenticate,
    requireRestaurantAccess,
    requiredRole("OWNER", "MANAGER"),
    prepareOrderController
)

/**
 * @route PATCH /api/v1/restaurants/:restaurantId/orders/:orderId/ready
 * @desc  Mark an order as ready
 * @access Private - OWNER / MANAGER
 */
router.patch(
    "/:restaurantId/orders/:orderId/ready",
    authenticate,
    requireRestaurantAccess,
    requiredRole("OWNER", "MANAGER"),
    readyOrderController
)

/**
 * @route PATCH /api/v1/restaurants/:restaurantId/orders/:orderId/serve
 * @desc  Serve an order
 * @access Private - OWNER / MANAGER
 */
router.patch(
    "/:restaurantId/orders/:orderId/serve",
    authenticate,
    requireRestaurantAccess,
    requiredRole("OWNER", "MANAGER"),
    serveOrderController
)

/**
 * @route PATCH /api/v1/restaurants/:restaurantId/orders/:orderId/complete
 * @desc  Complete an order
 * @access Private - OWNER / MANAGER
 */
router.patch(
    "/:restaurantId/orders/:orderId/complete",
    authenticate,
    requireRestaurantAccess,
    requiredRole("OWNER", "MANAGER"),
    completeOrderController
)

/**
 * @route PATCH /api/v1/restaurants/:restaurantId/orders/:orderId/pay
 * @desc  Mark order payment as paid
 * @access Private - OWNER / MANAGER
 */
router.patch(
    "/:restaurantId/orders/:orderId/pay",
    authenticate,
    requireRestaurantAccess,
    requiredRole("OWNER", "MANAGER"),
    markOrderAsPaidController
)

/**
 * @route PATCH /api/v1/restaurants/:restaurantId/orders/:orderId/payment-failed
 * @desc  Mark order payment as failed
 * @access Private - OWNER / MANAGER
 */
router.patch(
    "/:restaurantId/orders/:orderId/payment-failed",
    authenticate,
    requireRestaurantAccess,
    requiredRole("OWNER", "MANAGER"),
    markOrderPaymentAsFailedController
)

/**
 * @route PATCH /api/v1/restaurants/:restaurantId/orders/:orderId/refund
 * @desc  Refund order payment
 * @access Private - OWNER / MANAGER
 */
router.patch(
    "/:restaurantId/orders/:orderId/refund",
    authenticate,
    requireRestaurantAccess,
    requiredRole("OWNER", "MANAGER"),
    refundOrderPaymentController
)

export default router