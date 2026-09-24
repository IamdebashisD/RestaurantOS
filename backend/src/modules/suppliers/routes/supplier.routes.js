import { Router } from "express"

import { authenticate } from "../../../middlewares/auth.middleware.js"
import { requireRestaurantAccess } from "../../../middlewares/restaurant-access.middleware.js"
import { requiredRole } from "../../../middlewares/role.middleware.js"

import validate from "../../../middlewares/validate.middleware.js"
import { createSupplierDto } from "../dto/create-supplier.dto.js"
import {
    createSupplierController,
    getRestaurantSuppliersController,
    getSupplierByIdController,
} from "../controllers/supplier.controller.js"


const router = Router()

/**
 * @route   POST /api/v1/restaurants/:restaurantId/suppliers
 * @desc    Create a new supplier for a restaurant
 * @access  Private - OWNER / MANAGER
 */
router.post(
    "/:restaurantId/suppliers",
    authenticate,
    requireRestaurantAccess,
    requiredRole("OWNER", "MANAGER"),
    validate(createSupplierDto),
    createSupplierController
)

/**
 * @route   GET /api/v1/restaurants/:restaurantId/suppliers
 * @desc    Fetch a paginated list of suppliers for a restaurant with optional status and name search filters
 * @access  Private - OWNER / MANAGER
 */
router.get(
    "/:restaurantId/suppliers",
    authenticate,
    requireRestaurantAccess,
    requiredRole("OWNER", "MANAGER"),
    getRestaurantSuppliersController
)

/**
 * @route   GET /api/v1/restaurants/:restaurantId/suppliers/:supplierId
 * @desc    Fetch a specific supplier belonging to a restaurant
 * @access  Private - OWNER / MANAGER
 */
router.get(
    "/:restaurantId/suppliers/:supplierId",
    authenticate,
    requireRestaurantAccess,
    requiredRole("OWNER", "MANAGER"),
    getSupplierByIdController
)


export default router
