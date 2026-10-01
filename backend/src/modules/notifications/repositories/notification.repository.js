import { Notification } from "../models/notification.model"


/**
 * Persists a new notification document instance into the datastore
 * @param {Object} notificationData 
 * @param {import('mongoose').ClientSession} [session]
 * @returns {Promise<Object>}
 */
export async function createNotification(notificationData, session) {
    return Notification
        .create([notificationData], { session })
        .then(([notification]) => notification)
}

/**
 * Retrieves a filtered, paginated list of notifications for a specific recipient employee
 * @param {string} restaurantId 
 * @param {string} recipientId 
 * @param {Object} [filters={}] 
 * @param {Object} [options={}] 
 * @returns {Promise<Array<Object>>}
 */
export async function findNotificationsByRecipient(
    restaurantId, 
    recipientId, 
    filters = {}, 
    options = {},
    session
) {
    const query = { 
        restaurant: restaurantId, 
        recipient: recipientId 
    }

    if (filters.isRead !== undefined) query.isRead = filters.isRead
    if (filters.type) query.type = filters.type

    const mongooseQuery = Notification.find(query).sort({ createdAt: -1 })

    if (options.skip !== undefined) mongooseQuery.skip(options.skip)
    if (options.limit !== undefined) mongooseQuery.limit(options.limit)
    if (session) mongooseQuery.session(session)

    return mongooseQuery.exec()
}

/**
 * Quantifies the matching total documents to aid paginated pagination calculation matrices
 * @param {string} restaurantId 
 * @param {string} recipientId 
 * @param {Object} [filters={}] 
 * @returns {Promise<number>}
 */
export async function countNotificationsByRecipient(restaurantId, recipientId, filters = {}) {
    const query = { 
        restaurant: restaurantId, 
        recipient: recipientId 
    }
    if (filters.isRead !== undefined) query.isRead = filters.isRead
    if (filters.type) query.type = filters.type

    return Notification.countDocuments(query).exec()
}

/**
 * Locates an isolated notification record by identifier bound within tenant parameters
 * @param {string} restaurantId 
 * @param {string} notificationId 
 * @param {string} recipientId 
 * @returns {Promise<Object|null>}
 */
export async function findNotificationById(notificationId, restaurantId, recipientId) {
    return Notification.findOne({
        _id: notificationId,
        restaurant: restaurantId,
        recipient: recipientId
    }).exec()
}

/**
 * Atomically marks one or an individual notification as read with a timestamp check
 * @param {string} restaurantId 
 * @param {string} notificationId 
 * @param {string} recipientId 
 * @returns {Promise<Object|null>}
 */
export async function markNotificationAsReadById(notificationId, restaurantId, recipientId) {
    return Notification.findOneAndUpdate(
        {
            _id: notificationId,
            restaurant: restaurantId,
            recipient: recipientId,
            isRead: false
        },
        { $set: { isRead: true, readAt: new Date() } },
        { returnDocument: "after" }
    ).exec()
}

/**
 * Executes a bulk multi-update write command to clear out all unread logs for a recipient
 * @param {string} restaurantId 
 * @param {string} recipientId 
 * @returns {Promise<Object>} Mongoose modification count report status metadata
 */
export async function markAllNotificationsAsRead(restaurantId, recipientId) {
    return Notification.updateMany(
        {
            restaurant: restaurantId,
            recipient: recipientId,
            isRead: false
        },
        { $set: { isRead: true, readAt: new Date() } },
        { returnDocument: "after" }
    ).exec()
}
