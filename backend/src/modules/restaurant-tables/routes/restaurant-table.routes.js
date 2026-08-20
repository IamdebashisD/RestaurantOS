import { Router } from "express"

import { authenticate } from "../../../middlewares/auth.middleware.js"
import { requireRestaurantAccess } from "../../../middlewares/restaurant-access.middleware.js"
import { requiredRole } from "../../../middlewares/role.middleware.js"

import validate from "../../../middlewares/validate.middleware.js"
import { createRestaurantTableDto } from "../dto/create-restaurant-table.dto.js"

import { createRestaurantTableController, getRestaurantTableController } from "../controllers/restaurant-table.controller.js"


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
    getRestaurantTableController
)

export default router