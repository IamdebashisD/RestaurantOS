import { Router } from "express"

import { authenticate } from "../../../middlewares/auth.middleware.js"
import { requireRestaurantAccess } from "../../../middlewares/restaurant-access.middleware.js"
import { requiredRole } from "../../../middlewares/role.middleware.js"

import validate from "../../../middlewares/validate.middleware.js"
import { createRestaurantTableDto } from "../dto/create-restaurant-table.dto.js"
import { updateRestaurantTableDto } from "../dto/update-restaurant-table.dto.js"

import { 
    createRestaurantTableController, 
    getRestaurantTablesController, 
    getRestaurantTableController,
    updateRestaurantTableController,
} from "../controllers/restaurant-table.controller.js"


const router = Router()

/**
 * @route POST /api/v1/restaurants/:restaurantId/tables
 * @desc  Create a restaurant table
 * @access Private - OWNER / MANAGER
 */

router.post(
    "/:restaurantId/tables",
    authenticate,
    requireRestaurantAccess,
    requiredRole("OWNER", "MANAGER"),
    validate(createRestaurantTableDto),
    createRestaurantTableController
)

/**
 * @route GET /api/v1/restaurants/:restaurantId/tables
 * @desc  Get all restaurant tables
 * @access Private - Restaurant staff
 */

router.get(
    "/:restaurantId/tables",
    authenticate,
    requireRestaurantAccess,
    getRestaurantTablesController
)

/**
 * @route GET /api/v1/restaurants/:restaurantId/tables/:tableId
 * @desc  Get a specific restaurant tables by its ID
 * @access Private - Restaurant staff
 */

router.get(
    "/:restaurantId/tables/:tableId",
    authenticate,
    requireRestaurantAccess,
    getRestaurantTableController
)

/**
 * @route PATCH /api/v1/restaurants/:restaurantId/tables/:tableId
 * @desc  Update a restaurant table
 * @access Private - OWNER / MANAGER
 */
router.patch(
    "/:restaurantId/tables/:tableId",
    authenticate,
    requireRestaurantAccess,
    requiredRole("OWNER", "MANAGER"),
    validate(updateRestaurantTableDto),
    updateRestaurantTableController
)

export default router