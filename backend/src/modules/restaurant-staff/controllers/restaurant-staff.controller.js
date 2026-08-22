import * as RestaurantStaffService from "../services/restaurant-staff.service.js"
import { catchAsync } from "../../../utils/catchAsync.js"

import ApiResponse from "../../../utils/api-response.js"

export const addRestaurantStaffController = catchAsync(async (req, res, next) => {
    const { restaurantId } = req.params
    const { email, role } = req.body
    const membership = await RestaurantStaffService.addRestaurantStaffService({ restaurantId, email, role })
    return ApiResponse.created(res, {
        message: "Staff member added successfully",
        data: {
            membership
        }
    })
})

export const getRestaurantStaffController = catchAsync(async (req, res, _) => {
    const { restaurantId } = req.params
    const staff = await RestaurantStaffService.getRestaurantStaffService(restaurantId)
    console.log(`[total staff: ${staff.length} at ${staff[0].restaurant.name}]`)
    return ApiResponse.success(res, {
        message: "Restaurant staff retrieved successfully",
        data: {
            staff
        }
    })
})

export const updateRestaurantStaffController = catchAsync(async (req, res, _) => {
    const { restaurantId, staffId } = req.params
    const { role, status } = req.body

    const membership = await RestaurantStaffService.updateRestaurantStaffService({ restaurantId, staffId, role, status })
    return ApiResponse.success(res, {
        message: "Staff member updated successfully",
        data: {
            membership
        }
    })
})

export const getRestaurantStaffByIdController = catchAsync(async (req, res, _) => {
    const { restaurantId, staffId } = req.params
    const membership = await RestaurantStaffService.getRestaurantStaffByIdService({ restaurantId, staffId })
    return ApiResponse.success(res, {
        message: "Staff member retrieved successfully",
        data: {
            membership
        }
    })
})

export const removeRestaurantStaffController = catchAsync(async (req, res, _) => {
    const { restaurantId, staffId } = req.params

    const memebership = await RestaurantStaffService.removeRestaurantStaffService({ restaurantId, staffId })
    return ApiResponse.success(res, {
        message: "Staff member removed successfully",
        data: {
            memebership
        },
    })
})