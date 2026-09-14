import { Router } from "express"

import { authenticate } from "../../../middlewares/auth.middleware.js"
import { requireRestaurantAccess } from "../../../middlewares/restaurant-access.middleware.js"
import { requiredRole } from "../../../middlewares/role.middleware.js"

import validate from "../../../middlewares/validate.middleware.js"
import { createInventoryDto } from "../dto/create-inventory.dto.js"

import {
    createInventoryController,
    getRestaurantInventoryController,
} from "../controllers/inventory.controller.js"

const router = Router()

/**
 * @route POST /api/v1/restaurants/:restaurantId/inventory
 * @desc Create a brand new inventory item
 * @access Private - OWNER / MANAGER
 */
router.post(
    "/:restaurantId/inventory",
    authenticate,
    requireRestaurantAccess,
    requiredRole("OWNER", "MANAGER"),
    validate(createInventoryDto),
    createInventoryController
)

/**
 * @route   GET /api/v1/restaurants/:restaurantId/inventory
 * @desc    Fetch a paginated, alphabetically sorted list of active stock items
 * @access  Private - OWNER / MANAGER
 */
router.get(
    "/:restaurantId/inventory",
    authenticate,
    requireRestaurantAccess,
    requiredRole("OWNER", "MANAGER"),
    getRestaurantInventoryController
)


export default router
