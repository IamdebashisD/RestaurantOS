import { Router } from "express"

import { authenticate } from "../../../middlewares/auth.middleware.js"
import { requireRestaurantAccess } from "../../../middlewares/restaurant-access.middleware.js"
import { requiredRole } from "../../../middlewares/role.middleware.js"

import validate from "../../../middlewares/validate.middleware.js"
import { createMenuItemDto } from "../dto/create-menu-item.dto.js"
import { updateMenuItemDto } from "../dto/update-menu-item.dto.js"

import { 
    createMenuItemController,
    getRestaurantMenuItemsController,
    getMenuItemController,
    updateMenuItemController,
    deleteMenuItemController,
} from "../controllers/menu-item.controller.js"


const router = Router()

/**
 * @route POST /api/v1/restaurants/:restaurantId/menu-items
 * @desc  Create a menu item
 * @access Private - OWNER / MANAGER
 */

router.post(
    "/:restaurantId/menu-items",
    authenticate,
    requireRestaurantAccess,
    requiredRole("OWNER", "MANAGER"),
    validate(createMenuItemDto),
    createMenuItemController
)

/**
 * @route GET /api/v1/restaurants/:restaurantId/menu-items
 * @desc  Get all menu items for a restaurant
 * @access Private - Restaurant staff
 */

router.get(
    "/:restaurantId/menu-items",
    authenticate,
    requireRestaurantAccess,
    getRestaurantMenuItemsController
)

/**
 * @route GET /api/v1/restaurants/:restaurantId/menu-items/:menuItemId
 * @desc  Get a specific menu item
 * @access Private - Restaurant staff
 */

router.get(
    "/:restaurantId/menu-items/:menuItemId",
    authenticate,
    requireRestaurantAccess,
    getMenuItemController
)

/**
 * @route PATCH /api/v1/restaurants/:restaurantId/menu-items/:menuItemId
 * @desc  Update a specific menu item
 * @access Private - OWNER / MANAGER
 */
router.patch(
    "/:restaurantId/menu-items/:menuItemId",
    authenticate,
    requireRestaurantAccess,
    requiredRole("OWNER", "MANAGER"),
    validate(updateMenuItemDto),
    updateMenuItemController
)

/**
 * @route DELETE /api/v1/restaurants/:restaurantId/menu-items/:menuItemId
 * @desc  Disable a menu item
 * @access Private - OWNER / MANAGER
 */
router.delete(
    "/:restaurantId/menu-items/:menuItemId",
    authenticate,
    requireRestaurantAccess,
    requiredRole("OWNER", "MANAGER"),
    deleteMenuItemController
)


export default router