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
