import mongoose from "mongoose"
import crypto from "node:crypto"
import ApiError from "../../../utils/api-error.js"

import {
    createPayment,
    findPaymentByTransactionId,
    findPaymentById,
    findPaymentsByRestaurant,
    countPaymentsByRestaurant,
} from "../repositories/payment.repository.js"

import { findInvoiceById, updateInvoiceById } from "../../invoices/repositories/invoice.repository.js"
import { updateOrderById } from "../../orders/repositories/order.repository.js"
import { updateTableById } from "../../restaurant-tables/repositories/restaurant-table.repository.js"


// Create Payment
export async function createPaymentService({ 
    restaurantId,
    invoiceId, 
    method, 
    transactionId = null , 
    gatewayMetadata = {} 
}) {
    const preCheckInvoice = await findInvoiceById(invoiceId)

    if (!preCheckInvoice) throw ApiError.notFound("Invoice not found")
    const invoiceRestaurantId = preCheckInvoice.restaurant?._id?.toString() ?? preCheckInvoice.restaurant?.toString()
    if (invoiceRestaurantId !== restaurantId) throw ApiError.notFound("Invoice not found")
    if (preCheckInvoice.status !== "ISSUED") {
        throw ApiError.conflict(
            `Payment cannot be created for an invoice with ${preCheckInvoice.status} status`
        )
    }

    const session = await mongoose.startSession()

    try {
        let createdPayment

        await session.withTransaction(async () => {
            const invoice = await findInvoiceById(invoiceId, session)
            if (!invoice) throw ApiError.notFound("Invoice not found")
            if (invoice.status !== "ISSUED") {
                throw ApiError.conflict(`Invoice status changed to ${invoice.status} by another operator`)
            }
            if (transactionId) {
                const duplicatePayment = await findPaymentByTransactionId(transactionId, session)
                if (duplicatePayment) throw ApiError.conflict("This bank transaction tracking ID has already been settled")
            }

            const targetOrderId = invoice.order?._id?.toString() ?? invoice.order?.toString()
            const targetTableId = invoice.table?._id?.toString() ?? invoice.table?.toString()
            const paymentNumber = `PAY-${Date.now()}-${crypto.randomInt(1000, 10000)}`
            // Create and finalize the payment ledger record entry
            createdPayment = await createPayment(
                {
                    paymentNumber,
                    restaurant: invoice.restaurant,
                    invoice: invoice._id,
                    order: targetOrderId,
                    customer: invoice.customer?._id ?? invoice.customer,
                    amount: invoice.totalAmount,
                    method,
                    status: "COMPLETED",
                    transactionId,
                    gatewayMetadata
                }, 
                session
            )

            /* 
             * Mark invoice as paid
             * Mark order payment status as paid
             * Release restaurant table
             */
            await updateInvoiceById(invoiceId, { status: "PAID", paidAt: Date.now()}, session)
            await updateOrderById(targetOrderId, { paymentStatus: "PAID" }, session)
            await updateTableById(targetTableId, { status: "AVAILABLE" }, session)
        })

        return createdPayment

    } catch (error) {
        if (error instanceof ApiError) throw error
        ApiError.internal(
            "Failed to create payment due to a database error",
            error
        )
    } finally {
        await session.endSession()
    }
}

// Get Payment by ID
export async function getPaymentByIdService({ restaurantId, paymentId }) {
    const payment = await findPaymentById(paymentId) 
    if (!payment) throw ApiError.notFound("Payment not found")
    const paymentRestaurantId = payment.restaurant?._id?.toString() ?? payment.restaurant?.toString()
    if (paymentRestaurantId !== restaurantId) throw ApiError.notFound("Payment not found")
    return payment
}

// Get All Payments for a Restaurant
export async function getRestaurantPaymentsService({ restaurantId, page = 1, limit = 10 }) {
    //Basic pagination calculation
    const parsedPage = Math.max(1, parseInt(page, 10))
    const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10)))
    const skip = (parsedPage - 1) * parsedLimit

    const [payments, totalItems] = await Promise.all([
        findPaymentsByRestaurant({ restaurantId, options: { skip, limit: parsedLimit } }),
        countPaymentsByRestaurant(restaurantId)
    ])

    return {
        payments,
        pagination: {
            page: parsedPage,
            limit: parsedLimit,
            totalItems,
            totalPages: Math.ceil(totalItems / parsedLimit)
        }
    }
}
