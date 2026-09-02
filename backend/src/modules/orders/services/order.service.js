import mongoose from "mongoose"

import ApiError from "../../../utils/api-error.js"

import {
    findRestaurantById
} from "../../restaurants/repositories/restaurant.repository.js"

import {
    findTableById
} from "../../restaurant-tables/repositories/restaurant-table.repository.js"

import {
    findMenuItemById
} from "../../restaurant-menu/repositories/menu-item.repository.js"


import {
    createOrder,
    findOrdersByRestaurant,
    findOrderById,
    updateOrderById,
} from "../repositories/order.repository.js"

// 1 Create Order
export async function createOrderService({
    restaurantId,
    table,
    customer,
    items,
    notes
}) {
    // Check Restaurant exists
    const restaurant = await findRestaurantById(restaurantId)
    if (!restaurant) throw ApiError.notFound("Restaurant not found")
    
    // Check Table exists
    const restaurantTable = await findTableById(table)
    if (!restaurantTable) throw ApiError.notFound("Table not found")
    
    // Check Table belongs to Restaurant
    const tableRestaurantId = restaurantTable.restaurant._id 
        ? restaurantTable.restaurant._id.toString()
        : restaurantTable.restaurant.toString()

    if (tableRestaurantId !== restaurantId) throw ApiError.notFound("Table not found")
        
    // Ensure Table is active
    if (restaurantTable.status === "INACTIVE") throw ApiError.conflict("Cannot create order for an inactive table")
    
    const session = await mongoose.startSession()
    try {
        let order

        await session.withTransaction(async () => {
            const orderItems = []
            let totalAmount = 0

            // Validate every menu item
            for (const item of items) {
                const menuItem = await findMenuItemById(item.menuItem, session)
                if (!menuItem) throw ApiError.notFound(`Menu item ${item.menuItem} not found`)
                // Check menu Item belongs to restaurant
                if (menuItem.restaurant.toString() !== restaurantId) throw ApiError.notFound("Menu item not found")
                // menu item availablity
                if (!menuItem.isAvailable) throw ApiError.conflict(`"${menuItem.name}" is currently unavailable`)
            
                // Calculate subtotal
                const subtotal = menuItem.price * item.quantity

                orderItems.push({
                    menuItem: menuItem._id,
                    name: menuItem.name,
                    price: menuItem.price,
                    quantity: item.quantity,
                    subtotal
                })

                totalAmount += subtotal
            }

            const orderData = {
                restaurant: restaurantId,
                table,
                customer,
                items: orderItems,
                totalAmount,
                notes
            }

            order = await createOrder(orderData, session)
        })

        return order

    } catch (error) {
        if (error instanceof ApiError) throw error
        throw ApiError.internal(
            "Failed to create reservation due to a database error", 
            error
        )
    } finally {
        await session.endSession()
    }
}

// Get All Orders for a Restaurant
export async function getRestaurantOrdersService(restaurantId) {
    const restaurant = await findRestaurantById(restaurantId)
    if (!restaurant) throw ApiError.notFound("Restaurant not found")
    
    const orders = await findOrdersByRestaurant(restaurantId)
    return orders
}

// 3. Get Single Order
export async function getOrderService({ restaurantId, orderId }) {
    // Find order
    const order = await findOrderById(orderId)
    if (!order) throw ApiError.notFound("Order not found")

    const orderRestaurantId = order.restaurant._id 
        ? order.restaurant._id.toString() 
        : order.restaurant.toString()

    if (orderRestaurantId !== restaurantId) throw ApiError.notFound("Order not found")
    
    return order
}

// 4. update Order
export async function updateOrderService({ 
    restaurantId, 
    orderId, 
    table, 
    items, 
    notes 
}) {
    const existingOrder = await findOrderById(orderId)
    if (!existingOrder) throw ApiError.notFound("Order not found")
    
    const orderRestaurantId = existingOrder.restaurant._id
        ? existingOrder.restaurant._id.toString()
        : existingOrder.restaurant.toString()
    
    if (orderRestaurantId !== restaurantId) throw ApiError.notFound("Order not found")

    // Only pending orders can be updated
    if (existingOrder.status !== "PENDING") throw ApiError.conflict("Only pending orders can be updated")
    
    const updateData = {}
    
    // update Table
    const finalTable = table ?? existingOrder.table 

    if (finalTable !== undefined) {
        const restaurantTable = await findTableById(finalTable)
        if (!restaurantTable) throw ApiError.notFound("Table not found")
        
        const tableRestaurantId = restaurantTable.restaurant._id 
            ? restaurantTable.restaurant._id.toString()
            : restaurantTable.restaurant.toString()
        
        if (tableRestaurantId !== restaurantId) throw ApiError.notFound("Table not found")
        if (restaurantTable.status === "INACTIVE") throw ApiError.conflict("Cannot move order to an inactive table")

        updateData.table = finalTable
    }
    // Update notes
    if (notes !== undefined) {
        updateData.notes = notes
    }

    const session = await mongoose.startSession()

    try {
        let updatedOrder

        await session.withTransaction(async () => {
            // Update items
            if (items !== undefined) {
                const orderItems = []
                let runningTotalRaw = 0

                for (const item of items) {
                    const menuItem = await findMenuItemById(item.menuItem, session)

                    if (!menuItem) throw ApiError.notFound(`Menu item ${item.menuItem} not found`)
                    if (menuItem.restaurant.toString() !== restaurantId) throw ApiError.notFound("Menu item not found")
                    if (!menuItem.isAvailable) throw ApiError.conflict(`"${menuItem.name}" is currently unavailable`)
                    
                    const subtotalRaw = menuItem.price * item.quantity
                    const subtotal = Math.round(subtotalRaw * 100) / 100

                    orderItems.push({
                        menuItem: menuItem._id,
                        name: menuItem.name,
                        price: menuItem.price,
                        quantity: item.quantity,
                        subtotal
                    })

                    runningTotalRaw += subtotal
                }

                updateData.items = orderItems
                updateData.totalAmount = Math.round(runningTotalRaw * 100) / 100
            }

            if (Object.keys(updateData).length === 0) {
                updatedOrder = existingOrder
                return
            }

            updatedOrder = await updateOrderById(orderId, updateData, session)
        })

        return updatedOrder

    } catch (error) {
        if (error instanceof ApiError) throw error
        throw ApiError.internal(
            "Failed to update order due to a database error", 
            error
        )
    } finally {
        await session.endSession()
    }
}

// 5. Cancel Order

/**
 * Enterprise Finite State Machine (FSM) for Order Lifecycle Transitions.
 * Defines strictly which states are allowed to transition into another state.
 */
const ORDER_CANCEL_TRANSITIONS = {
    PENDING:   { allowable: true },
    CONFIRMED: { allowable: true },
    PREPARING: { allowable: false, reason: "The kitchen has already started cooking this order" },
    READY:     { allowable: false, reason: "The food is prepared and ready for pickup" },
    SERVED:    { allowable: false, reason: "The order has already been served to the table" },
    COMPLETED: { allowable: false, reason: "The order is already finalized and settled" },
    CANCELLED: { allowable: false, reason: "The order is already cancelled" },
}
/**
 * Cancels a restaurant order securely across isolated tenants.
 * 
 * @param {Object} params - The service inputs
 * @param {string} params.restaurantId - Multi-tenant isolation boundary identifier
 * @param {string} params.orderId - Unique tracking target reference
 * @returns {Promise<Object>} The updated order object model payload mapping
 */
export async function cancelOrderService ({ restaurantId, orderId }) {
    const existingOrder = await findOrderById(orderId)
    if (!existingOrder) throw ApiError.notFound("Order not found")

    const orderRestaurantId = existingOrder.restaurant?._id?.toString() ?? existingOrder.restaurant?.toString()
    if (orderRestaurantId !== restaurantId) throw ApiError.notFound("Order not found")

    // Declarative State Transition Validation (Finite State Machine verification)
    const stateRule = ORDER_CANCEL_TRANSITIONS[existingOrder.status]

    if (!stateRule) throw ApiError.internal(`Encountered unknown order lifecycle state: "${existingOrder.status}"`)
    if (!stateRule.allowable) {
        const errorDetail = stateRule.reason ?? `Order cannot be cancelled when status is ${existingOrder.status}`
        throw ApiError.conflict(errorDetail)
    }

    try {
        return await updateOrderById(orderId, { status: "CANCELLED" })
    } catch (error) {
        if (error instanceof ApiError) throw error
        throw ApiError.internal(
            "Database system failure during order cancellation execution step", 
            error
        )
    } 
}

// 6. Confirm Order
const ORDER_CONFIRM_TRANSITIONS = {
    PENDING:   { allowable: true },
    CONFIRMED: { allowable: false, reason: "The order is already confirmed" },
    PREPARING: { allowable: false, reason: "The order is already being prepared" },
    READY:     { allowable: false, reason: "The order is already ready" },
    SERVED:    { allowable: false, reason: "The order has already been served" },
    COMPLETED: { allowable: false, reason: "The order is already completed" },
    CANCELLED: { allowable: false, reason: "Cancelled order cannot be confirmed" },
}

export async function confirmOrderService({ restaurantId, orderId }) {
    const existingOrder = await findOrderById(orderId)
    if (!existingOrder) throw ApiError.notFound("Order not found")
    
    const orderRestaurantId = existingOrder.restaurant?._id?.toString() ?? existingOrder.restaurant?.toString()
    if (orderRestaurantId !== restaurantId) throw ApiError.notFound("Order not found")

    // Validate state transition
    const stateRule = ORDER_CONFIRM_TRANSITIONS[existingOrder.status]

    if (!stateRule) throw ApiError.internal(`Encountered unknown order lifecycle state: "${existingOrder.status}"`)
    if (!stateRule.allowable) {
        throw ApiError.conflict(
            stateRule.reason ?? `Order cannot be confirmed when status is ${existingOrder.status}`
        )
    }

    try {
        const confirmedOrder = await updateOrderById(orderId, { status: "CONFIRMED" })
        return confirmedOrder
    } catch (error) {
        if (error instanceof ApiError) throw error
        throw ApiError.internal(
            "Database system failure during order confirmation", 
            error
        )
    }
}

// 7. Prepare Order
const ORDER_PREPARE_TRANSITIONS = {
    PENDING:   { allowable: false, reason: "Pending order must be confirmed before preparation" },
    CONFIRMED: { allowable: true },
    PREPARING: { allowable: false, reason: "The order is already being prepared" },
    READY:     { allowable: false, reason: "The order is already ready" },
    SERVED:    { allowable: false, reason: "The order has already been served" },
    COMPLETED: { allowable: false, reason: "The order is already completed" },
    CANCELLED: { allowable: false, reason: "Cancelled order cannot be prepared" },
}

export async function prepareOrderService({ restaurantId, orderId }) {
    const existingOrder = await findOrderById(orderId)
    if (!existingOrder) throw ApiError.notFound("Order not found")

    const orderRestaurantId = existingOrder.restaurant?._id?.toString() ?? existingOrder.restaurant?.toString()
    if (orderRestaurantId !== restaurantId) throw ApiError.notFound("Order not found")

    // Validate state transition
    const stateRule = ORDER_PREPARE_TRANSITIONS[existingOrder.status]

    if (!stateRule) throw ApiError.internal(`Encountered unknown order lifecycle state: "${existingOrder.status}"`)
    if (!stateRule.allowable) {
        throw ApiError.conflict(
            stateRule.reason ?? `Order cannot be prepared when status is ${existingOrder.status}`
        )
    }

    try {
        return await updateOrderById(orderId, { status: "PREPARING" })

    } catch (error) {
        if (error instanceof ApiError) throw error
        throw ApiError.internal(
            "Database system failure during order preparation", 
            error
        )
    }
}

// 8. Ready Order
const ORDER_READY_TRANSITIONS = {
    PENDING:   { allowable: false, reason: "Pending order cannot be marked as ready" },
    CONFIRMED: { allowable: false, reason: "Order must be prepared before it can be marked as ready" },
    PREPARING: { allowable: true },
    READY:     { allowable: false, reason: "The order is already ready" },
    SERVED:    { allowable: false, reason: "The order has already been served" },
    COMPLETED: { allowable: false, reason: "The order is already completed" },
    CANCELLED: { allowable: false, reason: "Cancelled order cannot be marked as ready" },
}

export async function readyOrderService({ restaurantId, orderId }) {
    const existingOrder = await findOrderById(orderId)
    if (!existingOrder) throw ApiError.notFound("Order not found")

    const orderRestaurantId = existingOrder.restaurant?._id?.toString() ?? existingOrder.restaurant?.toString()
    if (orderRestaurantId !== restaurantId) throw ApiError.notFound("Order not found")

    // Validate state transition
    const stateRule = ORDER_READY_TRANSITIONS[existingOrder.status]

    if (!stateRule) throw ApiError.internal(`Encountered unknown order lifecycle state: "${existingOrder.status}"`)
    if (!stateRule.allowable) {
        throw ApiError.conflict(
            stateRule.reason ?? `Order cannot be marked as ready when status is ${existingOrder.status}`
        )
    }

    try {
        return await updateOrderById(orderId, { status: "READY" })

    } catch (error) {
        if (error instanceof ApiError) throw error
        throw ApiError.internal(
            "Database system failure during order preparation completion",
            error
        )
    }
}

// 9. Served Order
const ORDER_SERVE_TRANSITIONS = {
    PENDING:   { allowable: false, reason: "Pending order cannot be served" },
    CONFIRMED: { allowable: false, reason: "Confirmed order must be prepared and ready before it can be served" },
    PREPARING: { allowable: false, reason: "Order is still being prepared" },
    READY:     { allowable: true },
    SERVED:    { allowable: false, reason: "The order has already been served" },
    COMPLETED: { allowable: false, reason: "The order is already completed" },
    CANCELLED: { allowable: false, reason: "Cancelled order cannot be served" },
}

export async function serveOrderService({ restaurantId, orderId }) {
    const existingOrder = await findOrderById(orderId)
    if (!existingOrder) throw ApiError.notFound("Order not found")
    
    const orderRestaurantId = existingOrder.restaurant?._id?.toString() ?? existingOrder.restaurant?.toString()
    if (orderRestaurantId !== restaurantId) throw ApiError.notFound("Order not found")
    
    const stateRule = ORDER_SERVE_TRANSITIONS[existingOrder.status]
    
    if (!stateRule) throw ApiError.conflict(`Encountered unknown order lifecycle state: "${existingOrder.status}"`)
    if (!stateRule.allowable) {
        throw ApiError.conflict(
            stateRule.reason ?? `Order cannot be served when status is ${existingOrder.status}`
        )
    }
    
    try {
        return await updateOrderById(orderId, { status: "SERVED" })

    } catch (error) {
        if (error instanceof ApiError) throw error
        throw ApiError.internal(
            "Database system failure during order serving",
            error
        )
    }
}

// 10. Complete Order
const ORDER_COMPLETE_TRANSITIONS = {
    PENDING:   { allowable: false, reason: "Pending order cannot be completed" },
    CONFIRMED: { allowable: false, reason: "Confirmed order cannot be completed before being served" },
    PREPARING: { allowable: false, reason: "Order is still being prepared" },
    READY:     { allowable: false, reason: "Ready order must be served before it can be completed"},
    SERVED:    { allowable: true },
    COMPLETED: { allowable: false, reason: "The order is already completed" },
    CANCELLED: { allowable: false, reason: "Cancelled order cannot be completed" },
}

export async function completeOrderService({ restaurantId, orderId }) {
    const existingOrder = await findOrderById(orderId)
    if (!existingOrder) throw ApiError.notFound("Order not found")

    const orderRestaurantId = existingOrder.restaurant?._id?.toString() ?? existingOrder.restaurant?.toString()
    if (orderRestaurantId !== restaurantId) throw ApiError.notFound("Order not found")
    
    const stateRule = ORDER_COMPLETE_TRANSITIONS[existingOrder.status]

    if (!stateRule) throw ApiError.conflict(`Encountered unknown order lifecycle state: "${existingOrder.status}"`)
    if (!stateRule.allowable) {
        throw ApiError.conflict(
            stateRule.reason ?? `Order cannot be completed when status is ${existingOrder.status}`
        )
    }

    try {
        return await updateOrderById(orderId, { status: "COMPLETED" })

    } catch (error) {
        if (error instanceof ApiError) throw error
        throw ApiError.internal(
            "Database system failure during order completion",
            error
        )
    }
}

// 11. Mark Order as Paid
const ORDER_PAYMENT_TRANSITIONS = {
    PENDING:  { allowable: true },
    PAID:     { allowable: false, reason: "Order payment is already completed" },
    FAILED:   { allowable: true },
    REFUNDED: { allowable: false, reason: "Refunded payment cannot be marked as paid" },
}

export async function markOrderAsPaidService({ restaurantId, orderId }) {
    const existingOrder = await findOrderById(orderId)
    if (!existingOrder) throw ApiError.notFound("Order not found")

    const orderRestaurantId = existingOrder.restaurant?._id?.toString() ?? existingOrder.restaurant?.toString()
    if (orderRestaurantId !== restaurantId) throw ApiError.notFound("Order not found")
    
    const stateRule = ORDER_PAYMENT_TRANSITIONS[existingOrder.paymentStatus]

    if (!stateRule) throw ApiError.conflict(`Encountered unknown payment lifecycle state: "${existingOrder.paymentStatus}"`)
    if (!stateRule.allowable) {
        throw ApiError.conflict(
            stateRule.reason ?? `Order payment cannot be marked as paid when status is ${existingOrder.paymentStatus}`
        )
    }

    try {
        return await updateOrderById(orderId, { paymentStatus: "PAID" })

    } catch (error) {
        if (error instanceof ApiError) throw error
        throw ApiError.internal(
            "Database system failure during order payment update",
            error
        )
    }
}

// 12. Mark Order Payment as Failed
const ORDER_PAYMENT_FAILED_TRANSITIONS = {
    PENDING:  { allowable: true },
    PAID:     { allowable: false, reason: "Paid order payment cannot be marked as failed" },
    FAILED:   { allowable: false, reason: "Order payment has already failed" },
    REFUNDED: { allowable: false, reason: "Refunded payment cannot be marked as failed" },
}

export async function markOrderPaymentAsFailedService({ restaurantId, orderId }) {
    const existingOrder = await findOrderById(orderId)
    if (!existingOrder) throw ApiError.notFound("Order not found")

    const orderRestaurantId = existingOrder.restaurant?._id?.toString() ?? existingOrder.restaurant?.toString()
    if (orderRestaurantId !== restaurantId) throw ApiError.notFound("Order not found")

    const stateRule = ORDER_PAYMENT_FAILED_TRANSITIONS[existingOrder.paymentStatus]

    if (!stateRule) throw ApiError.conflict(`Encountered unknown payment lifecycle state: "${existingOrder.paymentStatus}"`)
    if (!stateRule.allowable) {
        throw ApiError.conflict(
            stateRule.reason ?? `Order payment cannot be marked as failed when status is ${existingOrder.paymentStatus}`
        )
    }

    try {
        return await updateOrderById(orderId, { paymentStatus: "FAILED" })

    } catch (error) {
        if (error instanceof ApiError) throw error
        throw ApiError.internal(
            "Database system failure during order payment failure update",
            error
        )
    }
}

// 13. Refund Order Payment
const ORDER_PAYMENT_REFUND_TRANSITIONS = {
    PENDING:  { allowable: false, reason: "Pending payment cannot be refunded" },
    PAID:     { allowable: true },
    FAILED:   { allowable: false, reason: "Failed payment cannot be refunded" },
    REFUNDED: { allowable: false, reason: "Order payment has already been refunded" },
}

export async function refundOrderPaymentService({ restaurantId, orderId }) {
    const existingOrder = await findOrderById(orderId)
    if (!existingOrder) throw ApiError.notFound("Order not found")

    const orderRestaurantId = existingOrder.restaurant?._id?.toString() ?? existingOrder.restaurant?.toString()
    if (orderRestaurantId !== restaurantId) throw ApiError.notFound("Order not found")

    // Validate state transitions
    const stateRule = ORDER_PAYMENT_REFUND_TRANSITIONS[existingOrder.paymentStatus]

    if (!stateRule) throw ApiError.conflict(`Encountered unknown payment lifecycle state: "${existingOrder.paymentStatus}"`)
    if (!stateRule.allowable) {
        throw ApiError.conflict(
            stateRule.reason ?? `Order payment cannot be refunded when status is ${existingOrder.paymentStatus}`
        )
    }
    
    try {
        return await updateOrderById(orderId, { paymentStatus: "REFUNDED" })

    } catch (error) {
        if (error instanceof ApiError) throw error
        throw ApiError.internal(
            "Database system failure during order payment refund",
            error
        )
    }

}