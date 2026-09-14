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
