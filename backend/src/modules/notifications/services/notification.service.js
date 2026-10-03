import ApiError from "../../../utils/api-error.js"
import { findRestaurantById } from "../../restaurants/repositories/restaurant.repository.js"

import {
    createNotification,
    findNotificationById,
    findNotificationsByRecipient,
    countNotificationsByRecipient,
    markNotificationAsReadById,
    markAllNotificationsAsRead,
} from "../repositories/notification.repository.js"


/**
 * Creates and persists a notification for a restaurant user.
 *
 * @param {Object} params
 * @param {string} params.restaurantId
 * @param {string} params.recipientId
 * @param {string} params.type
 * @param {string} params.title
 * @param {string} params.message
 * @param {Object|null} [params.data]
 * @param {import("mongoose").ClientSession} [session]
 * @returns {Promise<Object>} The created notification
 */
export async function createNotificationService({
    restaurantId,
    recipientId,
    type,
    title,
    message,
    data = null
}, session) {
    
    const notificationData = {
        restaurant: restaurantId,
        recipient: recipientId,
        type,
        title: title.trim(),
        message: message.trim(),
        data
    }

    return createNotification(notificationData, session)
}

/**
 * Retrieves a paginated list of notifications for a user along with comprehensive unread metrics
 * @param {Object} params
 * @param {string} params.restaurantId
 * @param {string} params.recipientId
 * @param {number|string} [params.page]
 * @param {number|string} [params.limit]
 * @param {boolean} [params.isRead]
 * @param {string} [params.type]
 * @returns {Promise<Object>} Mapped dataset array and pagination state headers
 */

export async function getRecipientNotificationsService({
    restaurantId,
    recipientId,
    page = 1,
    limit = 10,
    isRead,
    type
}) {
    const restaurant = await findRestaurantById(restaurantId)
    if (!restaurant) throw ApiError.notFound("Restaurant not found")
    
    let normalizedIsRead
    if (isRead !== undefined) {
        if (isRead === true  || isRead === "true")  normalizedIsRead = true
        if (isRead === false || isRead === "false") normalizedIsRead = false
    }

    const filters = { isRead: normalizedIsRead, type }
    
    if (page === undefined && limit === undefined) {
        const notifications = await findNotificationsByRecipient(
            restaurantId, 
            recipientId, 
            filters
        )
        return { 
            notifications, 
            pagination: null 
        }
    }

    const rawPage  = typeof page  === "string" ? parseInt(page, 10)  : page
    const rawLimit = typeof limit === "string" ? parseInt(limit, 10) : limit

    const safePage = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1
    const safeLimit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 100) : 10
    const skip = (safePage - 1) * safeLimit
    
    const options = { skip, limit: safeLimit }

    // Query data arrays, filtered totals, and aggregate alert counters concurrently
    const [
        notifications, 
        totalItems, 
        totalUnread
    ] = await Promise.all([
        findNotificationsByRecipient(restaurantId, recipientId, filters, options),
        countNotificationsByRecipient(restaurantId, recipientId, filters),
        countNotificationsByRecipient(restaurantId, recipientId, { isRead : false })
    ])

    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / safeLimit)

    return {
        notifications,
        pagination: {
            page: safePage,
            limit: safeLimit,
            totalItems,
            totalPages,
            totalUnread,
            hasNextPage: safePage < totalPages,
            hasPrevPage: safePage > 1
        }
    }
}

/**
 * Validates, checks ownership, and transitions a single notification record to read
 * @param {Object} params
 * @param {string} params.restaurantId
 * @param {string} params.notificationId
 * @param {string} params.recipientId
 * @returns {Promise<Object>} Updated notification document object
 */
export async function markNotificationAsReadService({ restaurantId, notificationId, recipientId }) {
    const notification = await findNotificationById(notificationId, restaurantId, recipientId)
    if (!notification) {
        throw ApiError.notFound("Notification not found")
    }
    // Early return if already read
    if (notification.isRead) return notification
    // Atomically mutate state flags using Compare-And-Swap mechanics
    const updatedNotification = await markNotificationAsReadById(
        notificationId, 
        restaurantId, 
        recipientId
    )
    if (!updatedNotification ) {
        throw ApiError.conflict(
            "Failed to mark notification as read. The state was modified by another request."
        )
    }
    
    return updatedNotification
}

/**
 * Triggers a multi-document patch write operation to batch-clear unread notification lines
 * @param {Object} params
 * @param {string} params.restaurantId
 * @param {string} params.recipientId
 * @returns {Promise<Object>} Execution diagnostics metrics state metadata report
 */
export async function markAllNotificationsAsReadService({ restaurantId, recipientId }) {
    const restaurant = await findRestaurantById(restaurantId)
    if (!restaurant) throw ApiError.notFound("Restaurant not found")

    try {
        return await markAllNotificationsAsRead(restaurantId, recipientId)
    } catch (error) {
        if (error instanceof ApiError) throw error
        throw ApiError.internal(
            "Database system failure during mark all notification as read",
            error
        )
    }
}
