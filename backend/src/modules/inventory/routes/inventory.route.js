import { Router } from "express"

import { authenticate } from "../../../middlewares/auth.middleware.js"
import { requireRestaurantAccess } from "../../../middlewares/restaurant-access.middleware.js"
import { requiredRole } from "../../../middlewares/role.middleware.js"

import validate from "../../../middlewares/validate.middleware.js"
import { createInventoryDto } from "../dto/create-inventory.dto.js"
import { updateInventoryDto } from "../dto/update-inventory.dto.js"
import { stockInDto } from "../dto/stock-in.dto.js"
import { stockOutDto } from "../dto/stock-out.dto.js"
import { stockAdjustmentDto } from "../dto/stock-adjustment.dto.js"
import { wastageDto } from "../dto/wastage.dto.js"

import {
    createInventoryController,
    getRestaurantInventoryController,
    getInventoryItemByIdController,
    updateInventoryItemController,
    stockInInventoryController,
    stockOutInventoryController,
    stockAdjustmentInventoryController,
    recordInventoryWastageController,
    getLowStockAlertController,
    getInventoryHistoryController,
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
 * @route   GET /api/v1/restaurants/:restaurantId/inventory/low-stock
 * @desc    Fetch a paginated dashboard list of ingredients requiring urgent replenishment
 * @access  Private - OWNER / MANAGER
 */
router.get(
    "/:restaurantId/inventory/low-stock",
    authenticate,
    requireRestaurantAccess,
    requiredRole("OWNER", "MANAGER"),
    getLowStockAlertController
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

/* ======================================== History ========================================= */
/**
 * @route   GET /api/v1/restaurants/:restaurantId/inventory/:itemId/history
 * @desc    Fetch an immutable audit trace timeline of all stock movements for an item
 * @access  Private - OWNER / MANAGER
 */
router.get(
    "/:restaurantId/inventory/:itemId/history",
    authenticate,
    requireRestaurantAccess,
    requiredRole("OWNER", "MANAGER"),
    getInventoryHistoryController
)

/* ============================= Action Commands (Ledger Events) ============================= */
/**
 * @route   POST /api/v1/restaurants/:restaurantId/inventory/:itemId/stock-in
 * @desc    Record an incoming delivery batch influx for a specific inventory ingredient item
 * @access  Private - OWNER / MANAGER
 */
router.post(
    "/:restaurantId/inventory/:itemId/stock-in",
    authenticate,
    requireRestaurantAccess,
    requiredRole("OWNER", "MANAGER"),
    validate(stockInDto),
    stockInInventoryController
)

/**
 * @route PATCH /api/v1/restaurants/:restaurantId/inventory/:itemId/stock-out
 * @desc Remove stock from an inventory item
 * @access Private - OWNER / MANAGER
 */
router.patch(
    "/:restaurantId/inventory/:itemId/stock-out",
    authenticate,
    requireRestaurantAccess,
    requiredRole("OWNER", "MANAGER"),
    validate(stockOutDto),
    stockOutInventoryController
)

/**
 * @route PATCH /api/v1/restaurants/:restaurantId/inventory/:itemId/adjustment
 * @desc Adjust inventory quantity to match physical stock OR Execute a physical count correction/balancing log for a specific ingredient
 * @access Private - OWNER / MANAGER
 */
router.patch(
    "/:restaurantId/inventory/:itemId/adjustment",
    authenticate,
    requireRestaurantAccess,
    requiredRole("OWNER", "MANAGER"),
    validate(stockAdjustmentDto),
    stockAdjustmentInventoryController
)

/**
 * @route PATCH /api/v1/restaurants/:restaurantId/inventory/:itemId/wastage
 * @desc Record inventory wastage
 * @access Private - OWNER / MANAGER
 */
router.patch(
    "/:restaurantId/inventory/:itemId/wastage",
    authenticate,
    requireRestaurantAccess,
    requiredRole("OWNER", "MANAGER"),
    validate(wastageDto),
    recordInventoryWastageController
)


export default router
