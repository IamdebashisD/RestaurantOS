import * as RestaurantService from "../services/restaurant.service.js"
import { catchAsync } from "../../../utils/catchAsync.js"
import ApiResponse from "../../../utils/api-response.js"

export const createRestaurantController = catchAsync(async (req, res, next) => {
    const restaurant = await RestaurantService.createRestaurantService({ 
        userId: req.user.id, ...req.body 
    })

    return ApiResponse.created(res, {
        message: "Restaurant created successfully",
        data: {
            restaurant
        }
    })
})

export const getRestaurantController = catchAsync(async (req, res, next) => {
    const restaurant = await RestaurantService.getRestaurantByIdService(req.params.restaurantId)

    return ApiResponse.success(res, {
        message: "Restaurant retrieved successfully",
        data: {
            restaurant
        },
    })
})

export const updateRestaurantController = catchAsync(async (req, res, next) => {
    const restaurant = await RestaurantService.updateRestaurantService(req.params.restaurantId, req.body)

    return ApiResponse.success(res, {
        message: "Restaurant updated successfully",
        data: {
            restaurant,
        },
    })
})

export const deactivateRestaurantController = catchAsync(async (req, res, next) => {
    const restaurant = await RestaurantService.deactivateRestaurantService(req.params.restaurantId)

    return ApiResponse.success(res, {
        message: "Restaurant deactivate successfully",
        data: {
            restaurant
        }
    })
})