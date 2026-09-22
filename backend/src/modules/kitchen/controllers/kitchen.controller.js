import ApiResponse from "../../../utils/api-response.js"
import { catchAsync } from "../../../utils/catchAsync.js"

import * as KitchenService from "../services/kitchen.service.js"


// Get current kitchen orders
/**
 * Express controller to handle HTTP requests for fetching paginated kitchen orders.
 * Extracts path parameters and query strings to delegate workflow execution to KitchenService.
 *
 * @param {import('express').Request} req - Express request object containing path parameters and pagination queries.
 * @param {import('express').Response} res - Express response object utilized to return structured API payloads.
 * @returns {Promise<void>} Resolves when the success payload is successfully dispatched to the client.
 */
export const getKitchenOrdersController = catchAsync(async (req, res) => {
    const { restaurantId } = req.params
    const { page, limit } = req.query

    const result = await KitchenService.getKitchenOrdersService({ restaurantId, page, limit })

    return ApiResponse.success(res, {
        message: "Kitchen orders fetched successfully",
        data: {
            orders: result.orders,
            meta: result.pagination
        }
    })
})

/**
 * Express controller to handle HTTP requests for initiating order preparation.
 * Extracts path parameters to trigger the transition from CONFIRMED to PREPARING status.
 *
 * @param {import('express').Request} req - Express request object containing restaurantId and orderId.
 * @param {import('express').Response} res - Express response object utilized to return structured API payloads.
 * @returns {Promise<void>} Resolves when the success payload is successfully dispatched to the client.
 */
export const startKitchenOrderPreparationController = catchAsync(async (req, res) => {
    const { restaurantId, orderId } = req.params

    const order = await KitchenService.startPreparationService({ restaurantId, orderId })

    return ApiResponse.success(res, {
        message: "Order preparation started successfully",
        data: {
            order
        }
    })
}) 

/**
 * Express controller to handle HTTP requests for marking an order as ready.
 * Extracts path parameters to trigger the transition from PREPARING to READY status.
 *
 * @param {import('express').Request} req - Express request object containing restaurantId and orderId.
 * @param {import('express').Response} res - Express response object utilized to return structured API payloads.
 * @returns {Promise<void>} Resolves when the success payload is successfully dispatched to the client.
 */
export const markKitchenOrderReadyController = catchAsync(async (req, res) => {
    const { restaurantId, orderId } = req.params

    const order = await KitchenService.markKitchenOrderReadyService({ restaurantId, orderId })

    return ApiResponse.success(res, {
        message:  "Order marked as ready successfully",
        data: {
            order
        }
    })
})
