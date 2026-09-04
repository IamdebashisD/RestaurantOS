import ApiResponse from "../../../utils/api-response.js"
import { catchAsync } from "../../../utils/catchAsync.js"

import * as InvoiceService from "../services/invoice.service.js"

// 1. Create Invoice Controller
export const createInvoiceController = catchAsync(async (req, res) => {
    const { restaurantId, orderId } = req.params
    const { discount, tax, serviceCharge } = req.body

    const invoice = await InvoiceService.createInvoiceService({
        restaurantId,
        orderId,
        discount,
        tax,
        serviceCharge
    })

    return ApiResponse.created(res, {
        message: "Invoice created successfully",
        data: {
            invoice
        }
    })
})

// 2. Get Invoice by ID
export const getInvoiceByIdController = catchAsync(async (req, res) => {
    const { restaurantId, invoiceId, } = req.params

    const invoice = await InvoiceService.getInvoiceByIdService({ restaurantId, invoiceId, })

    return ApiResponse.success(res, {
        message: "Invoice fetched successfully",
        data: {
            invoice
        }
    })
})

// 3. Get all invoices for a specific restaurant with pagination Controller
export const getRestaurantInvoicesController = catchAsync(async (req, res) =>  {
    const { restaurantId } = req.params
    const { page, limit } = req.query
    console.log({ page, limit })

    const invoices = await InvoiceService.getRestaurantInvoicesService({ restaurantId, page, limit })

    return ApiResponse.success(res, {
        message: "Invoices fetched successfully",
        data: invoices
    })
})

// 4. Get Invoice by Order Controller
export const getInvoiceByOrderController  =  catchAsync(async(req, res) => {
    const { restaurantId, orderId } = req.params

    const invoice = await InvoiceService.getInvoiceByOrderService({ restaurantId, orderId })

    return ApiResponse.success(res, {
        message: "Invoice fetched successfully",
        data: {
            invoice
        }
    })
})

// 5. Get Invoice by Invoice Number Controller
export const getInvoiceByNumberController = catchAsync(async (req, res) => {
    const { restaurantId, invoiceNumber } = req.params

    const invoice = await InvoiceService.getInvoiceByNumberService({ restaurantId, invoiceNumber })

    return ApiResponse.success(res, {
        message: "Invoice retrieved successfully via token lookup map",
        data: {
            invoice
        }
    })
})