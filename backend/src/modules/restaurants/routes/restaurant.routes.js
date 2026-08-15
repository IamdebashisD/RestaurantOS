import { Router } from "express"

import validate from "../../../middlewares/validate.middleware.js"
import { createRestaurantDto } from "../dto/restaurant.dto.js"
import { updateRestaurantDto } from "../dto/update-restaurant.dto.js"

import { authenticate } from "../../../middlewares/auth.middleware.js"
import { requireRestaurantAccess } from "../../../middlewares/restaurant-access.middleware.js"
import { requiredRole } from "../../../middlewares/role.middleware.js"

import { 
    createRestaurantController, 
    getRestaurantController, 
    updateRestaurantController,
    deactivateRestaurantController 
} from "../controllers/restaurant.controller.js"

const router = Router()


/**
 * @route   POST /api/v1/restaurants
 * @desc    Create a new restaurant
 * @access  Private
 */
router.post(
    "/", 
    authenticate, 
    validate(createRestaurantDto), 
    createRestaurantController
)


/**
 * @route   GET /api/v1/restaurants/:restaurantId
 * @desc    Get a restaurant
 * @access  Private
 */
router.get(
    "/:restaurantId",
    authenticate,
    requireRestaurantAccess,
    getRestaurantController
)


/**
 * @route   PATCH /api/v1/restaurants/:restaurantId
 * @desc    Update a restaurant
 * @access  Private
 */
router.patch(
    "/:restaurantId", 
    authenticate,
    requireRestaurantAccess, 
    requiredRole("OWNER", "MANAGER"),
    validate(updateRestaurantDto),
    updateRestaurantController
)


/**
 * @route   PATCH /api/v1/restaurants/:restaurantId/deactivate
 * @desc    Deactivate a restaurant
 * @access  Private
 */
router.patch(
    "/:restaurantId/deactivate",
    authenticate,
    requireRestaurantAccess,
    requiredRole("OWNER"),
    deactivateRestaurantController
)

export default router