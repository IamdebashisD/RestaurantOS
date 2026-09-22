import ApiError from "../../../utils/api-error.js"

import { findRestaurantById } from "../../restaurants/repositories/restaurant.repository.js"

import {
    findKitchenOrders,
    countKitchenOrders,
    findKitchenOrderById,
    updateKitchenOrderStatus,
} from "../repositories/kitchen.repository.js"

/**
 * Retrieves a paginated list of active kitchen orders (CONFIRMED or PREPARING) for a restaurant.
 * Validates the restaurant's existence and ensures numeric sanitization of input pagination parameters.
 *
 * @param {Object} params - The parameter object.
 * @param {string} params.restaurantId - The unique identifier of the target restaurant.
 * @param {number|string} [params.page=1] - The requested page number (supports string parsing).
 * @param {number|string} [params.limit=10] - The maximum number of records per page (supports string parsing).
 * 
 * @returns {Promise<{
 *   orders: Array<Object>,
 *   pagination: {
 *     page: number,
 *     limit: number,
 *     totalItems: number,
 *     totalPages: number,
 *     hasNextPage: boolean,
 *     hasPrevPage: boolean
 *   }
 * }>} Resolved object containing the array of active kitchen orders and structured pagination metadata.
 * 
 * @throws {ApiError} Throws a 404 NotFound error if the specified restaurant does not exist.
 */
export async function getKitchenOrdersService({ restaurantId, page = 1, limit = 10 }) {
    const restaurant = await findRestaurantById(restaurantId)
    if (!restaurant) throw ApiError.notFound("Restaurant not found")

    const rawPage  = typeof page  === "string" ? parseInt(page, 10)  : page
    const rawLimit = typeof limit === "string" ? parseInt(limit, 10) : limit
    const safePage = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1
    const safeLimit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 100) : 10
    const skip = (safePage - 1) * safeLimit
    // 5. Query active orders and count parallel records concurrently
    const [orders, totalItems] = await Promise.all([
        findKitchenOrders(
            restaurantId, 
            { 
                skip, 
                limit: safeLimit 
            }
        ),
        countKitchenOrders(restaurantId)      
    ])
    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / safeLimit)

    return {
        orders,
        pagination: {
            page: safePage,
            limit: safeLimit,
            totalItems,
            totalPages,
            hasNextPage: safePage < totalPages,
            hasPrevPage: safePage > 1
        }
    }
}

/**
 * Transitions an order status from CONFIRMED to PREPARING within a restaurant's kitchen workflow.
 * Implements defensive checks for pre-existing state invariants and utilizes an atomic compare-and-swap
 * update operation to mitigate multi-user concurrency race conditions.
 *
 * @param {Object} params - The parameter object.
 * @param {string} params.restaurantId - The unique identifier of the target restaurant.
 * @param {string} params.orderId - The unique identifier of the order to transition.
 * 
 * @returns {Promise<Object>} Resolved object containing the fully updated database order document.
 * 
 * @throws {ApiError} Throws a 404 NotFound error if the order does not exist or tenant context mismatches.
 * @throws {ApiError} Throws a 400 BadRequest error if the order is already in a PREPARING state.
 * @throws {ApiError} Throws a 400 BadRequest error if the order is not currently in a CONFIRMED state.
 * @throws {ApiError} Throws a 409 Conflict error if the atomic compare-and-swap update query fails to match.
 */
export async function startPreparationService({ restaurantId, orderId }) {
    const order = await findKitchenOrderById(restaurantId, orderId)
    if (!order) {
        throw ApiError.notFound("Order not found in this restaurant")
    }
    if (order.status === "PREPARING") {
        throw ApiError.badRequest("Order is already being prepared")
    }
    if (order.status !== "CONFIRMED") {
        throw ApiError.badRequest(`Cannot start preparation. Order is currently ${order.status}`)
    }

    const updateData = {
        status: "PREPARING",
        preparationStartedAt: new Date()
    };
    const updatedOrder = await updateKitchenOrderStatus(
        restaurantId,
        orderId,
        "CONFIRMED",
        updateData
    )
    if (!updatedOrder) {
        throw ApiError.conflict("Failed to start preparation. The order status may have changed.")
    }

    return updatedOrder
}

/**
 * Transitions an order status from PREPARING to READY within a restaurant's kitchen workflow.
 * Validates that the order is actively being prepared and applies an atomic write to accurately 
 * log completion timestamps and prevent dual-mutation race conditions.
 *
 * @param {Object} params - The parameter object.
 * @param {string} params.restaurantId - The unique identifier of the target restaurant.
 * @param {string} params.orderId - The unique identifier of the order to transition.
 * 
 * @returns {Promise<Object>} Resolved object containing the fully updated database order document.
 * 
 * @throws {ApiError} Throws a 404 NotFound error if the order does not exist or tenant context mismatches.
 * @throws {ApiError} Throws a 409 Conflict error if the order is not currently in a PREPARING state.
 * @throws {ApiError} Throws a 409 Conflict error if the atomic compare-and-swap update query fails to match.
 */
export async function markKitchenOrderReadyService({ restaurantId, orderId }) {
    const order = await findKitchenOrderById(restaurantId, orderId)
    if (!order) throw ApiError.notFound("Order not found")
    if (order.status !== "PREPARING") {
        throw ApiError.conflict(
            `Order cannot be marked ready from ${order.status} status`
        )
    }
    const updatedOrder = await updateKitchenOrderStatus(
        restaurantId,
        orderId,
        "PREPARING",
        {
            status: "READY",
            readyAt: new Date()
        }
    )
    if (!updatedOrder) throw ApiError.conflict("Order status changed before it could be marked ready")

    return updatedOrder
}
