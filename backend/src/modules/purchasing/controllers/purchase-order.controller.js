import ApiResponse from "../../../utils/api-response.js"
import { catchAsync } from "../../../utils/catchAsync.js"

import * as PurchaseOrderService from "../services/purchase-order.service.js"

/**
 * Express controller to handle HTTP requests for creating a new purchase order
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
export const createPurchaseOrderController = catchAsync(async (req, res) => {
    const { restaurantId } = req.params

    const purchaseOrder = await PurchaseOrderService.createPurchaseOrderService({
        restaurantId,
        ...req.body
    })

    return ApiResponse.created(res, {
        message: "Purchase order created successfully",
        data: {
            purchaseOrder
        }
    })
})

/**
 * Express controller to handle HTTP requests for fetching paginated purchase orders
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
export const getRestaurantPurchaseOrdersController = catchAsync(async (req, res) => {
    const { restaurantId } = req.params
    const { page, limit, status, supplier, search } = req.query

    const result = await PurchaseOrderService
        .getRestaurantPurchaseOrdersService({
            restaurantId,
            page,
            limit,
            status,
            supplier,
            search
        })

    return ApiResponse.success(res, {
        message: "Purchase orders fetched successfully",
        data: {
            purchaseOrders: result.purchaseOrders,
            meta: result.pagination
        }
    })
})

/**
 * Express controller to handle HTTP requests for fetching a single purchase order by ID
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
export const getPurchaseOrderByIdController = catchAsync(async (req, res) => {
    const { restaurantId, purchaseOrderId } = req.params

    const purchaseOrder = await PurchaseOrderService
        .getPurchaseOrderByIdService({ restaurantId, purchaseOrderId })

    return ApiResponse.success(res, {
        message: "Purchase order fetched successfully",
        data: {
            purchaseOrder
        }
    })
})

/**
 * Express controller to handle HTTP requests for updating a purchase order
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
export const updatePurchaseOrderController = catchAsync(async (req, res) => {
    const { restaurantId, purchaseOrderId } = req.params

    const purchaseOrder = 
        await PurchaseOrderService.updatePurchaseOrderService({
            restaurantId,
            purchaseOrderId,
            updateData: req.body
        })

    return ApiResponse.success(res, {
        message: "Purchase order updated successfully",
        data: {
            purchaseOrder
        }
    })
})