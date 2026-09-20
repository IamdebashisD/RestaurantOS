import ApiResponse from "../../../utils/api-response.js"
import { catchAsync } from "../../../utils/catchAsync.js"

import * as InventoryService from "../services/inventory.service.js"

// 1. Create New Inventory Item Controller
export const createInventoryController = catchAsync(async (req, res) => {
    const { restaurantId } = req.params
    const { name, unit, minimumQuantity, costPerUnit } = req.body

    const inventory = await InventoryService.createInventoryService({
        restaurantId,
        name,
        unit,
        minimumQuantity,
        costPerUnit
    })

    return ApiResponse.created(res, {
        message: "Inventory item created successfully",
        data: {
            inventory
        }
    })
})

// 2. Get all inventory items with alphabetical sorting and pagination pagination
export const getRestaurantInventoryController = catchAsync(async (req, res) => {
    const { restaurantId } = req.params
    const { page = 1, limit = 10 } = req.query

    const inventory = await InventoryService.getRestaurantInventoryService({ restaurantId, page, limit })

    return ApiResponse.success(res, {
        message: "Inventory dashboard records retrieved successfully",
        data: {
            inventory: inventory.inventoryItems,
            meta: inventory.pagination
        }
    })
})

// 3. Get Inventory Item by ID Controller
export const getInventoryItemByIdController = catchAsync(async (req, res) => {
    const { restaurantId, itemId } = req.params
    const inventoryItem = await InventoryService.getInventoryItemByIdService({ restaurantId, itemId })
    return ApiResponse.success(res, {
        message: "Inventory fetched successfully",
        data: {
            inventoryItem
        }
    })
})

// 4. Update Inventory Item Controller
export const updateInventoryItemController = catchAsync(async (req, res) => {
    const { restaurantId, itemId } = req.params
    const { name, minimumQuantity, costPerUnit, status  } = req.body

    const inventory = await InventoryService.updateInventoryItemService({
        restaurantId,
        itemId,
        name,
        minimumQuantity,
        costPerUnit,
        status
    })

    return ApiResponse.success(res, {
        message: "Inventory item updated successfully",
        data: {
            inventory
        }
    })
})

// 5. Controller: Processes incoming stock arrivals, updates quantities, and records an audit log
export const stockInInventoryController = catchAsync(async (req, res) => {
    const { restaurantId, itemId } = req.params
    const { quantity, costPerUnit, reason } = req.body
    const performedBy = req.user.id

    const updatedInventory  = await InventoryService.stockInInventoryService({
        restaurantId,
        itemId,
        quantity,
        costPerUnit,
        reason,
        performedBy
    })

    return ApiResponse.success(res, {
        message: "Stock replenishment processed and ledger item recorded successfully",
        data: {
            updatedInventory
        }
    })
})

/**
 * @desc    Processes kitchen stock depletions, checks minimum thresholds, and records logs
 * @route   POST /api/v1/restaurants/:restaurantId/inventory/:itemId/stock-out
 * @access  Private (OWNER, MANAGER)
 */
export const stockOutInventoryController = catchAsync(async (req, res) => {
    const { restaurantId, itemId } = req.params
    const { quantity, reason } = req.body
    
    // Extracted securely from user auth token context mapping to protect ledger logs
    const performedBy = req.user.id

    const updatedInventory = await InventoryService.stockOutInventoryService({
        restaurantId,
        itemId,
        quantity,
        reason,
        performedBy
    })

    return ApiResponse.success(res, {
        message: "Stock usage logged and inventory adjusted successfully",
        data: {
            updatedInventory
        }
    })
})

/**
 * @desc    Corrects system stock metrics to match an audited physical shelf count
 * @route   POST /api/v1/restaurants/:restaurantId/inventory/:itemId/adjustment
 * @access  Private (OWNER, MANAGER)
 */
export const stockAdjustmentInventoryController = catchAsync(async (req, res) => {
    const { restaurantId, itemId } = req.params
    const { actualQuantity, reason } = req.body
    const performedBy = req.user.id

    const updatedInventory = await InventoryService
        .stockAdjustmentInventoryService({
            restaurantId,
            itemId,
            actualQuantity,
            reason,
            performedBy
        })

    return ApiResponse.success(res, {
        message: "Inventory quantity adjusted and ledger item recorded successfully",
        data: {
            updatedInventory
        }
    })
})

/**
 * @desc    Logs spoiled, damaged, or expired stock and reduces inventory metrics securely
 * @route   POST /api/v1/restaurants/:restaurantId/inventory/:itemId/wastage
 * @access  Private (OWNER, MANAGER)
 */
export const recordInventoryWastageController = catchAsync(async (req, res) => {
    const { restaurantId, itemId } = req.params
    const { quantity, reason } = req.body
    const performedBy = req.user.id

    const updatedInventory = await InventoryService
        .recordInventoryWastageService({
            restaurantId,
            itemId,
            quantity,
            reason,
            performedBy
        })

    return ApiResponse.success(res, {
        message: "Inventory wastage recorded and ledger item created successfully",
        data: {
            updatedInventory
        }
    })
})
