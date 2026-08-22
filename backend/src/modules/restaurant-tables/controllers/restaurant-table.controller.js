import { catchAsync } from "../../../utils/catchAsync.js"
import ApiError from "../../../utils/api-error.js"
import ApiResponse from "../../../utils/api-response.js"

import * as RestaurantTableService from "../services/restaurant-table.service.js"

export const createRestaurantTableController = catchAsync(async (req, res) => {
    const { restaurantId } = req.params
    const { tableNumber, capacity, status } = req.body

    const table = await RestaurantTableService.createRestaurantTableService({
        restaurantId,
        tableNumber,
        capacity,
        status
    })

    return ApiResponse.created(res, {
        message: "Restaurant table created successfully",
        data: {
            table
        }
    })
})

export const getRestaurantTablesController = catchAsync(async (req, res) => {
    const { restaurantId } = req.params

    const tables = await RestaurantTableService.getRestaurantTablesService(restaurantId)

    return ApiResponse.success(res, {
        message: "Restaurant tables retrieved successfully",
        data: tables
    })
})

