import ApiResponse from "../../../utils/api-response.js"
import { catchAsync } from "../../../utils/catchAsync.js"

import * as PaymentService from "../services/payment.service.js"


// 1. Create Payment Controller
export const createPaymentController = catchAsync(async (req, res) => {
    const { restaurantId, invoiceId } = req.params
    const { method, transactionId, gatewayMetadata } = req.body

    const payment = await PaymentService.createPaymentService({
        restaurantId,
        invoiceId,
        method,
        transactionId,
        gatewayMetadata
    })

    return ApiResponse.created(res, {
        message: "Payment created successfully",
        data: {
            payment
        }
    })
})

// 2. Get Payment by ID Controller
export const getPaymentByIdController = catchAsync(async (req, res) => {
    const { restaurantId, paymentId } = req.params

    const payment = await PaymentService.getPaymentByIdService({ restaurantId, paymentId })

    return ApiResponse.success(res, {
        message: "Payment fetched successfully",
        data: {
            payment
        }
    })
})

// 3. Get All Payments for a Restaurant Controller
export const getRestaurantPaymentsController = catchAsync(async (req, res) => {
    const { restaurantId } = req.params
    const { page = 1, limit = 10 } = req.query

    const payments = await PaymentService.getRestaurantPaymentsService({
        restaurantId,
        page: Number(page),
        limit: Number(limit)
    })

    return ApiResponse.success(res, {
        message: "Payments fetched successfully",
        data: {
            payments
        }
    })
})

// 4. Get Payments by Invoice Controller
export const getPaymentsByInvoiceController = catchAsync(async (req, res) => {
    const { restaurantId, invoiceId } = req.params

    const payments = await PaymentService.getPaymentsByInvoiceService({ restaurantId, invoiceId })

    return ApiResponse.success(res, {
        message: "Payments fetched successfully",
        data: {
            payments
        }
    })
})

// 5. Get Payments by Order Controller
export const getPaymentsByOrderController = catchAsync(async (req, res) => {
    const { restaurantId, orderId } = req.params

    const payments = await PaymentService.getPaymentsByOrderService({ restaurantId, orderId })

    return ApiResponse.success(res, {
        message: "Payments fetched successfully",
        data: {
            payments
        }
    })
})

// Get Payment By Number Controller
export const getPaymentByNumberController = catchAsync(async (req, res) => {
    const { restaurantId, paymentNumber } = req.params

    const payment = await PaymentService.getPaymentByNumberService({ restaurantId, paymentNumber })

    return ApiResponse.success(res, {
        message: "Ledger transaction reference resolved successfully",
        data: {
            payment
        }
    })
})
