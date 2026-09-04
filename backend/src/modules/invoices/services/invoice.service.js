import mongoose from "mongoose"
import crypto from "node:crypto"

import ApiError from "../../../utils/api-error.js"

import {
    createInvoice,
    findInvoiceByOrder,
    findInvoiceById,
    findInvoicesByRestaurant,
    findInvoiceByNumber,
} from "../repositories/invoice.repository.js"

import { findOrderById } from "../../orders/repositories/order.repository.js"



// 1. Create Invoice
export async function createInvoiceService({
    restaurantId,
    orderId,
    discount = 0,
    tax = 0,
    serviceCharge = 0,
}) {
    const existingOrder = await findOrderById(orderId)
    if (!existingOrder) throw ApiError.notFound("Order not found")

    const orderRestaurantId = existingOrder.restaurant?._id?.toString() ?? existingOrder.restaurant?.toString()
    if (orderRestaurantId !== restaurantId) throw ApiError.notFound("Order not found")
    
    // Only completed orders can be invoiced
    if (existingOrder.status !== "COMPLETED") throw ApiError.conflict("Only completed orders can be invoiced")
    
    const session = await mongoose.startSession()
    try {
        let createdInvoice

        await session.withTransaction(async () => {
            // Check whether invoice already exists
            const existingInvoice = await findInvoiceByOrder(orderId, session)
            if (existingInvoice) throw ApiError.conflict("An invoice already exists for this order")
            
            // Create invoice items from Order snapshot
            const invoiceItems = existingOrder.items.map((item) => ({
                menuItem: item.menuItem,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                subtotal: item.subtotal,
            }))

            const subtotalRaw = existingOrder.totalAmount
            const subtotal = Math.round(subtotalRaw * 100) / 100

            // Calculate final total
            const totalRaw = subtotal - discount + tax + serviceCharge
            if (totalRaw < 0) throw ApiError.conflict("Invoice total cannot be negative")
            const totalAmount = Math.round(totalRaw * 100) / 100

            const uniqueStamp = crypto.randomInt(1000, 10000)
            const invoiceNumber = `INV-${Date.now()}-${uniqueStamp}`
            
            createdInvoice = await createInvoice(
                {
                    invoiceNumber,
                    restaurant: existingOrder.restaurant,
                    order: existingOrder._id,
                    customer: existingOrder.customer,
                    table: existingOrder.table,
                    items: invoiceItems,
                    subtotal,
                    discount,
                    tax,
                    serviceCharge,
                    totalAmount,
                    status: "ISSUED"
                },
                session
            )
        })
        
        return createdInvoice

    } catch (error) {
        if (error instanceof ApiError) throw error
        throw ApiError.internal(
            "Failed to create invoice due to a database error",
            error
        )
    } finally {
        await session.endSession()
    }    
}

// 2. Get Invoice by ID
export async function getInvoiceByIdService({ restaurantId, invoiceId }) {
    const invoice = await findInvoiceById(invoiceId)
    if (!invoice) throw ApiError.notFound("Invoice not found")
    // Check invoice belongs to the restaurant
    const invoiceRestaurantId = invoice.restaurant?._id?.toString() ?? invoice.restaurant?.toString()
    if (invoiceRestaurantId !== restaurantId) throw ApiError.notFound("Invoice not found")

    return invoice
}


// Get All Invoices for a Restaurant with Pagination
/**
 * Retrieves a paginated list of invoices for a specific restaurant
 * @param {Object} params
 * @param {string} params.restaurantId
 * @param {number} [params.page=1]
 * @param {number} [params.limit=10]
 */
export async function getRestaurantInvoicesService({ restaurantId, page = 1, limit = 10}) {
    //Basic pagination calculation
    const parsedPage = Math.max(1, parseInt(page, 10))
    const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10)))
    const skip = (parsedPage - 1) * parsedLimit

    const invoices = await findInvoicesByRestaurant(restaurantId, { skip, limit: parsedLimit })

    return {
        invoices,
        pagination: {
            page: parsedPage,
            limit: parsedLimit
        }
    }
}


/**
 * Retrieves a single invoice using its associated Order ID
 * @param {Object} params
 * @param {string} params.restaurantId
 * @param {string} params.orderId
 * @returns {Promise<Object>} The populated invoice document
 */
export async function getInvoiceByOrderService({ restaurantId, orderId }) {
    const invoice = await findInvoiceByOrder(orderId)
    if (!invoice) throw ApiError.notFound("Invoice for this order not found")

    // Multi-tenant boundary isolation validation
    const invoiceRestaurantId = invoice.restaurant?._id?.toString() ?? invoice.restaurant?.toString()
    if (invoiceRestaurantId !== restaurantId) throw ApiError.notFound("Invoice for this order not found")
    
    return invoice
}

/**
 * Retrieves a single invoice using its unique business tracking number
 * @param {Object} params
 * @param {string} params.restaurantId
 * @param {string} params.invoiceNumber
 * @returns {Promise<Object>} The populated invoice document
 */
export async function getInvoiceByNumberService({ restaurantId, invoiceNumber }) {
    if (!invoiceNumber) throw ApiError.badRequest("Invoice number tracking parameter is required")
    const invoice = await findInvoiceByNumber(invoiceNumber.trim())
    if (!invoice) throw ApiError.notFound("Invoice not found")
    const invoiceRestaurantId = invoice.restaurant?._id?.toString() ?? invoice.restaurant?.toString()
    if (invoiceRestaurantId !== restaurantId) throw ApiError.notFound("Invoice not found")    
    return invoice
}