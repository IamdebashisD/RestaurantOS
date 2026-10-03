import { Router } from "express"

import { authenticate } from "../../../middlewares/auth.middleware.js"
import { requireRestaurantAccess } from "../../../middlewares/restaurant-access.middleware.js"
import { requiredRole } from "../../../middlewares/role.middleware.js"

import {
    getRecipientNotificationsController,
    markNotificationAsReadController,
    markAllNotificationsAsReadController,
} from "../controllers/notification.controller.js"


const router = Router()

/**
 * @route   GET /api/v1/restaurants/:restaurantId/notifications
 * @desc    Fetch notifications for the authenticated restaurant user with optional pagination, read-status, and type filters
 * @access  Private - OWNER / MANAGER
 */
router.get(
    "/:restaurantId/notifications",
    authenticate,
    requireRestaurantAccess,
    requiredRole("OWNER", "MANAGER"),
    getRecipientNotificationsController
)

/**
 * @route   PATCH /api/v1/restaurants/:restaurantId/notifications/:notificationId/read
 * @desc    Mark a single notification as read for the authenticated restaurant user
 * @access  Private - OWNER / MANAGER
 */
router.patch(
    "/:restaurantId/notifications/:notificationId/read",
    authenticate,
    requireRestaurantAccess,
    requiredRole("OWNER", "MANAGER"),
    markNotificationAsReadController
)

/**
 * @route   PATCH /api/v1/restaurants/:restaurantId/notifications/read-all
 * @desc    Mark all notifications as read for the authenticated restaurant user
 * @access  Private - OWNER / MANAGER
 */
router.patch(
    "/:restaurantId/notifications/read-all",
    authenticate,
    requireRestaurantAccess,
    requiredRole("OWNER", "MANAGER"),
    markAllNotificationsAsReadController
)


export default router
