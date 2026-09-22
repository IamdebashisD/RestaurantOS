import { Router } from "express"

import { authenticate } from "../../../middlewares/auth.middleware.js"
import { requireRestaurantAccess } from "../../../middlewares/restaurant-access.middleware.js"
import { requiredRole } from "../../../middlewares/role.middleware.js"

import {
    getKitchenOrdersController,
    startKitchenOrderPreparationController,
    markKitchenOrderReadyController,
} from "../controllers/kitchen.controller.js"


const router = Router()

/**
 * @route   GET /api/v1/restaurants/:restaurantId/kitchen/orders
 * @desc    Fetch the active kitchen queue containing confirmed and preparing orders
 * @access  Private - OWNER / MANAGER / KITCHEN_STAFF
 */
router.get(
    "/:restaurantId/kitchen/orders",
    authenticate,
    requireRestaurantAccess,
    requiredRole(
        "OWNER", 
        "MANAGER", 
        "KITCHEN_STAFF"
    ),
    getKitchenOrdersController
)

/**
 * @route   PATCH /api/v1/restaurants/:restaurantId/kitchen/orders/:orderId/start
 * @desc    Start preparation for a confirmed restaurant order
 * @access  Private - OWNER / MANAGER / KITCHEN_STAFF
 */
router.patch(
    "/:restaurantId/kitchen/orders/:orderId/start",
    authenticate,
    requireRestaurantAccess,
    requiredRole(
        "OWNER", 
        "MANAGER", 
        "KITCHEN_STAFF"
    ),
    startKitchenOrderPreparationController
)

/**
 * @route   PATCH /api/v1/restaurants/:restaurantId/kitchen/orders/:orderId/ready
 * @desc    Mark a preparing restaurant order as ready for serving
 * @access  Private - OWNER / MANAGER / KITCHEN_STAFF
 */
router.patch(
    "/:restaurantId/kitchen/orders/:orderId/ready",
    authenticate,
    requireRestaurantAccess,
    requiredRole(
        "OWNER", 
        "MANAGER", 
        "KITCHEN_STAFF"
    ),
   markKitchenOrderReadyController
)


export default router