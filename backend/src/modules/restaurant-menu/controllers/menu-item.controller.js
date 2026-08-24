import ApiResponse from "../../../utils/api-response.js";
import { catchAsync } from "../../../utils/catchAsync.js"

import * as MenuItemService from "../services/menu-item.service.js"

// Controller - 1. Create Menu Item
export const createMenuItemController = catchAsync(async (req, res) => {
    const { restaurantId } = req.params

    const {
        name,
        description,
        price,
        category,
        image,
        isAvailable
    } = req.body

    const menuItem = await MenuItemService.createMenuItemService({
        restaurantId,
        name,
        description,
        price,
        category,
        image,
        isAvailable
    })

    return ApiResponse.created(res, {
        message: "Menu item created successfully",
        data: {
            menuItem
        }
    })
})

// Controller - 2. Get All Menu Items
export const getRestaurantMenuItemsController = catchAsync(async (req, res) => {
    const { restaurantId } = req.params

    const menuItems = await MenuItemService.getRestaurantMenuItemsService(restaurantId)

    return ApiResponse.success(res, {
        message: "Restaurant menu items retrieved successfully",
        data: {
            menuItems
        }
    })
})

