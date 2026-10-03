import ApiResponse from "../../../utils/api-response.js"
import { catchAsync } from "../../../utils/catchAsync.js"

import * as NotificationService from "../services/notification.service.js"


/**
 * Express controller to handle HTTP requests for fetching a recipient's notifications
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
export const getRecipientNotificationsController = catchAsync(async (req, res) => {
    const { restaurantId } = req.params
    const { page, limit, isRead, type } = req.query
    const recipientId = req.user.id

    const result = await NotificationService
        .getRecipientNotificationsService({
            restaurantId,
            recipientId,
            page,
            limit,
            isRead,
            type
        })

    return ApiResponse.success(res, {
        message: "Notifications fetched successfully",
        data: {
            notifications: result.notifications,
            meta: result.pagination
        }
    })
})

/**
 * Express controller to handle shifting an isolated alert document status line to read
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
export const markNotificationAsReadController = catchAsync(async (req, res) => {
    const { restaurantId, notificationId } = req.params
    const recipientId = req.user.id

    const notification = await NotificationService
        .markNotificationAsReadService({ restaurantId, notificationId, recipientId })

    return ApiResponse.success(res,  {
        message: "Notification marked as read successfully",
        data: {
            notification
        }
    })
})

/**
 * Express controller to clear out the entire unread notification ledger stack context bulk operations
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
export const markAllNotificationsAsReadController = catchAsync(async (req, res) => {
    const { restaurantId } = req.params
    const recipientId = req.user.id

    await NotificationService.markAllNotificationsAsReadService({ restaurantId, recipientId })

    return ApiResponse.success(res, {
        message: "All notifications marked as read successfully"
    })
})
