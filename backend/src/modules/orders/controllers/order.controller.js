import ApiResponse from "../../../utils/api-response.js"

import { catchAsync } from "../../../utils/catchAsync.js"

import * as OrderService from "../services/order.service.js"

// 1. Create Order Controller
export const createOrderController = catchAsync(async (req, res) => {
    const { restaurantId } = req.params
    const customer = req.user.id

    const order = await OrderService.createOrderService({ restaurantId, customer, ...req.body })

    return ApiResponse.created(res, {
        message: "Order created successfully",
        data: {
            order
        }
    })
})

// 2. Get All Orders Controller
export const getRestaurantOrdersController = catchAsync(async (req, res) => {
    const { restaurantId } = req.params

    const orders = await OrderService.getRestaurantOrdersService(restaurantId)

    return ApiResponse.success(res, {
        message: "Orders fetched successfully",
        data: {
            orders
        }
    }) 
})

// 3. Get Single Order
export const getOrderController = catchAsync(async (req, res) => {
    const { restaurantId, orderId } = req.params

    const order = await OrderService.getOrderService({ restaurantId, orderId })

    return ApiResponse.success(res, {
        message: "Order fetched successfully",
        data: {
            order
        }
    })
})

// 4. Update Order Controller
export const updateOrderController = catchAsync(async (req, res) => {
    const { restaurantId, orderId } = req.params

    const order = await OrderService.updateOrderService({ 
        restaurantId, 
        orderId, 
        ...req.body 
    })

    return ApiResponse.success(res, {
        message: "Order updated successfully",
        data: {
            order
        }
    })
})

// 5. Cancel Order Controller 
export const cancelOrderController = catchAsync(async (req, res) => {
    const { restaurantId, orderId } = req.params

    const order = await OrderService.cancelOrderService({ restaurantId, orderId })

    return ApiResponse.success(res, {
        message: "Order cancelled successfully",
        data: {
            order
        }
    })
})

// 6. Confirm Order Controller
export const confirmOrderController = catchAsync(async (req, res) => {
    const { restaurantId, orderId } = req.params

    const confirmedOrder = await OrderService.confirmOrderService({ restaurantId, orderId })

    return ApiResponse.success(res, {
        message: "Order confirmed successfully",
        data: {
            confirmedOrder
        }
    })
})

// 7. Prepared Order Controller
export const prepareOrderController = catchAsync(async (req, res) => {
    const { restaurantId, orderId } = req.params

    const order = await OrderService.prepareOrderService({ restaurantId, orderId })
    return ApiResponse.success(res, {
        message:  "Order preparation started successfully",
        data: {
            order
        }
    })
}) 

// 8. Ready Order Controller
export const readyOrderController = catchAsync(async (req, res) => {
    const { restaurantId, orderId } = req.params

    const order = await OrderService.readyOrderService({ restaurantId, orderId })

    return ApiResponse.success(res, {
        message: "Order marked as ready successfully",
        data: {
            order
        }
    })
})

// 8. Serve Order Controller
export const serveOrderController = catchAsync(async (req, res) => {
    const { restaurantId, orderId } = req.params

    const order = await OrderService.serveOrderService({ restaurantId, orderId })

    return ApiResponse.success(res, {
        message: "Order served successfully",
        data: {
            order
        }
    })
})

// 10. Complete Order Controller
export const completeOrderController = catchAsync(async (req, res) => {
    const { restaurantId, orderId } = req.params

    const order = await OrderService.completeOrderService({ restaurantId, orderId })

    return ApiResponse.success(res, {
        message: "Order completed successfully",
        data: {
            order
        }
    })
})

// 11. Mark Order as Paid
export const markOrderAsPaidController = catchAsync(async (req, res) => {
    const { restaurantId, orderId } = req.params

    const order = await OrderService.markOrderAsPaidService({ restaurantId, orderId })

    return ApiResponse.success(res, {
        message: "Order payment marked as paid successfully",
        data: {
            order
        }
    })
})

// 12. Mark Order Payment as Failed
export const markOrderPaymentAsFailedController = catchAsync(async (req, res) => {
    const { restaurantId, orderId } = req.params

    const order = await OrderService.markOrderPaymentAsFailedService({ restaurantId, orderId })

    return ApiResponse.success(res, {
        message: "Order payment marked as failed",
        data: {
            order
        }
    })
})

// 13. Refund Order Payment
export const refundOrderPaymentController = catchAsync(async (req, res) => {
    const { restaurantId, orderId } = req.params

    const order = await OrderService.refundOrderPaymentService({ restaurantId, orderId })

    return ApiResponse.success(res, {
        message: "Order payment refunded successfully",
        data: {
            order
        }
    })
})