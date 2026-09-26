import { Router } from "express"

import { authenticate } from "../../../middlewares/auth.middleware.js"
import { requireRestaurantAccess } from "../../../middlewares/restaurant-access.middleware.js"
import { requiredRole } from "../../../middlewares/role.middleware.js"

import validate from "../../../middlewares/validate.middleware.js"
import { createPurchaseOrderDto } from "../dto/create-purchase-order.dto.js"
import { updatePurchaseOrderDto } from "../dto/update-purchase-order.dto.js"

import {
    createPurchaseOrderController,
    getRestaurantPurchaseOrdersController,
    getPurchaseOrderByIdController,
    updatePurchaseOrderController,
} from "../controllers/purchase-order.controller.js"


const router = Router()


/**
 * @route   POST /api/v1/restaurants/:restaurantId/purchase-orders
 * @desc    Create a new purchase order for a restaurant
 * @access  Private - OWNER / MANAGER
 */
router.post(
    "/:restaurantId/purchase-orders",
    authenticate,
    requireRestaurantAccess,
    requiredRole("OWNER", "MANAGER"),
    validate(createPurchaseOrderDto),
    createPurchaseOrderController
)

/**
 * @route   GET /api/v1/restaurants/:restaurantId/purchase-orders
 * @desc    Fetch a paginated list of purchase orders for a restaurant with optional
 *          status, supplier, and search filters
 * @access  Private - OWNER / MANAGER
 */
router.get(
    "/:restaurantId/purchase-orders",
    authenticate,
    requireRestaurantAccess,
    requiredRole("OWNER", "MANAGER"),
    getRestaurantPurchaseOrdersController
)

/**
 * @route   GET /api/v1/restaurants/:restaurantId/purchase-orders/:purchaseOrderId
 * @desc    Fetch a specific purchase order belonging to a restaurant
 * @access  Private - OWNER / MANAGER
 */
router.get(
    "/:restaurantId/purchase-orders/:purchaseOrderId",
    authenticate,
    requireRestaurantAccess,
    requiredRole("OWNER", "MANAGER"),
    getPurchaseOrderByIdController
)

/**
 * @route   PATCH /api/v1/restaurants/:restaurantId/purchase-orders/:purchaseOrderId
 * @desc    Update a draft purchase order belonging to a restaurant
 * @access  Private - OWNER / MANAGER
 */
router.patch(
    "/:restaurantId/purchase-orders/:purchaseOrderId",
    authenticate,
    requireRestaurantAccess,
    requiredRole("OWNER", "MANAGER"),
    validate(updatePurchaseOrderDto),
    updatePurchaseOrderController
)


export default router
