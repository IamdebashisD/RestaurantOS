import ApiResponse from "../../../utils/api-response.js"
import { catchAsync } from "../../../utils/catchAsync.js"

import * as MenuCategoryService from "../services/menu-category.service.js"


// Create Menu Category
export const createMenuCategoryController = catchAsync(async (req, res) => {
    const { restaurantId } = req.params
    const { name, description, displayOrder, isActive } = req.body

    const category = await MenuCategoryService.createMenuCategoryService({ 
        restaurantId, 
        name, 
        description, 
        displayOrder, 
        isActive 
    })

    return ApiResponse.created(res, {
        message: "Menu category created successfully",
        data: {
            category
        }
    })
})

// Get All Menu Categories
export const getRestaurantMenuCategoriesController = catchAsync(async (req, res) => {
    const { restaurantId } = req.params
    const categories = await MenuCategoryService.getRestaurantMenuCategoriesService(restaurantId)

    return ApiResponse.success(res, {
        message: "Menu categories retrieved successfully",
        data: {
            categories
        }
    })
})

// Get Single Menu Category
export const getMenuCategoryController = catchAsync(async (req, res) => {
    const { restaurantId, categoryId } = req.params
    const category = await MenuCategoryService.getMenuCategoryService({ restaurantId, categoryId })

    return ApiResponse.success(res, {
        message: "Menu category retrieved successfully",
        data: {
            category
        }
    })
})

// Update Menu Category
export const updateMenuCategoryController = catchAsync(async (req, res) => {
    const { restaurantId, categoryId } = req.params
    const {
        name,
        description,
        displayOrder,
        isActive
    } = req.body

    const category = await MenuCategoryService.updateMenuCategoryService({
        restaurantId,
        categoryId,
        name,
        description,
        displayOrder,
        isActive
    })

    return ApiResponse.success(res, {
        message: "Menu category updated successfully",
        data: {
            category
        }
    })
})

// 
export const deleteMenuCategoryController = catchAsync(async (req, res) => {
    const { restaurantId, categoryId } = req.params
    const category = await MenuCategoryService.deleteMenuCategoryService({ restaurantId, categoryId })

    return ApiResponse.success(res, {
        message: "Menu category removed successfully",
        data: {
            category
        }
    })
    
})