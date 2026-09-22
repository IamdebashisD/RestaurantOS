import { Router } from "express"

import { authenticate } from "../../../middlewares/auth.middleware.js"
import { requireRestaurantAccess } from "../../../middlewares/restaurant-access.middleware.js"
import { requiredRole } from "../../../middlewares/role.middleware.js"

import validate from "../../../middlewares/validate.middleware.js"
import { createSupplierDto } from "../dto/create-supplier.dto.js"
import {
    createSupplierController,
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


export default router
