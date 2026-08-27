import { Router } from "express"

import { authenticate } from "../../../middlewares/auth.middleware.js"
import { requireRestaurantAccess } from "../../../middlewares/restaurant-access.middleware.js"
import { requiredRole } from "../../../middlewares/role.middleware.js"

import validate from "../../../middlewares/validate.middleware.js"
import { createMenuCategoryDto } from "../dto/create-menu-category.dto.js"
import { updateMenuCategoryDto } from "../dto/update-menu-category.dto.js";

import {
    createMenuCategoryController,
    getRestaurantMenuCategoriesController,
    getMenuCategoryController,
    updateMenuCategoryController,
    deleteMenuCategoryController,
} from "../controllers/menu-category.controller.js"


const router = Router()


/**
 * @route POST /api/v1/restaurants/:restaurantId/menu-categories
 * @desc  Create a menu category
 * @access Private - OWNER / MANAGER
 */
router.post(
    "/:restaurantId/menu-categories",
    authenticate,
    requireRestaurantAccess,
    requiredRole("OWNER", "MANAGER"),
    validate(createMenuCategoryDto),
    createMenuCategoryController
)

/**
 * @route GET /api/v1/restaurants/:restaurantId/menu-categories
 * @desc  Get all menu categories
 * @access Private - Restaurant staff
 */

router.get(
    "/:restaurantId/menu-categories",
    authenticate,
    requireRestaurantAccess,
    getRestaurantMenuCategoriesController
)

/**
 * @route GET /api/v1/restaurants/:restaurantId/menu-categories/:categoryId
 * @desc  Get a specific menu category
 * @access Private - Restaurant staff
 */
router.get(
    "/:restaurantId/menu-categories/:categoryId",
    authenticate,
    requireRestaurantAccess,
    getMenuCategoryController
)

/**
 * @route PATCH /api/v1/restaurants/:restaurantId/menu-categories/:categoryId
 * @desc  Update a menu category
 * @access Private - OWNER / MANAGER
 */
router.patch(
    "/:restaurantId/menu-categories/:categoryId",
    authenticate,
    requireRestaurantAccess,
    requiredRole("OWNER", "MANAGER"),
    validate(updateMenuCategoryDto),
    updateMenuCategoryController
)

/**
 * @route DELETE /api/v1/restaurants/:restaurantId/menu-categories/:categoryId
 * @desc  Soft delete a menu category
 * @access Private - OWNER / MANAGER
 */

router.delete(
    "/:restaurantId/menu-categories/:categoryId",
    authenticate,
    requireRestaurantAccess,
    requiredRole("OWNER", "MANAGER"),
    deleteMenuCategoryController
)

export default router