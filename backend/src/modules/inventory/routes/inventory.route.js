import { Router } from "express"

import { authenticate } from "../../../middlewares/auth.middleware.js"
import { requireRestaurantAccess } from "../../../middlewares/restaurant-access.middleware.js"
import { requiredRole } from "../../../middlewares/role.middleware.js"

import validate from "../../../middlewares/validate.middleware.js"
import { createInventoryDto } from "../dto/create-inventory.dto.js"
import { updateInventoryDto } from "../dto/update-inventory.dto.js"

import {
    createInventoryController,
    getRestaurantInventoryController,
    getInventoryItemByIdController,
    updateInventoryItemController,
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

/**
 * @route   GET /api/v1/restaurants/:restaurantId/inventory/:itemId
 * @desc    Get a single inventory item by its unique ID
 * @access  Private - OWNER / MANAGER
 */
router.get(
    "/:restaurantId/inventory/:itemId",
    authenticate,
    requireRestaurantAccess,
    requiredRole("OWNER", "MANAGER"),
    getInventoryItemByIdController
)

/**
 * @route PATCH /api/v1/restaurants/:restaurantId/inventory/:itemId
 * @desc Update an inventory item's metadata
 * @access Private - OWNER / MANAGER
 */
router.patch(
    "/:restaurantId/inventory/:itemId",
    authenticate,
    requireRestaurantAccess,
    requiredRole("OWNER", "MANAGER"),
    validate(updateInventoryDto),
    updateInventoryItemController
)



export default router
