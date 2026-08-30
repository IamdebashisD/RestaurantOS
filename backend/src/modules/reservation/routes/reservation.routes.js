import { Router } from "express"

import { authenticate } from "../../../middlewares/auth.middleware.js"
import { requireRestaurantAccess } from "../../../middlewares/restaurant-access.middleware.js"
import { requiredRole } from "../../../middlewares/role.middleware.js"

import validate from "../../../middlewares/validate.middleware.js"
import { createReservationDto } from "../dto/create-reservation.dto.js"
import { updateReservationDto } from "../dto/update-reservation.dto.js"

import {
    createReservationController,
    getRestaurantReservationsController,
    getReservationController,
    updateReservationController,
    cancelReservationController,
} from "../controllers/reservation.controller.js"


const router = Router()


/**
 * @route POST /api/v1/restaurants/:restaurantId/reservations
 * @desc  Create a reservation
 * @access Private - OWNER / MANAGER
 */
router.post(
    "/:restaurantId/reservations",
    authenticate,
    requireRestaurantAccess,
    requiredRole("OWNER", "MANAGER"),
    validate(createReservationDto),
    createReservationController
)

/**
 * @route GET /api/v1/restaurants/:restaurantId/reservations
 * @desc  Get all reservations for a restaurant
 * @access Private - OWNER / MANAGER
 */
router.get(
    "/:restaurantId/reservations",
    authenticate,
    requireRestaurantAccess,
    requiredRole("OWNER", "MANAGER"),
    getRestaurantReservationsController
)

/**
 * @route GET /api/v1/restaurants/:restaurantId/reservations/:reservationId
 * @desc  Get a single reservation
 * @access Private - OWNER / MANAGER
 */
router.get(
    "/:restaurantId/reservations/:reservationId",
    authenticate,
    requireRestaurantAccess,
    requiredRole("OWNER", "MANAGER"),
    getReservationController
)

/**
 * @route PATCH /api/v1/restaurants/:restaurantId/reservations/:reservationId
 * @desc  Update a reservation
 * @access Private - OWNER / MANAGER
 */
router.patch(
    "/:restaurantId/reservations/:reservationId",
    authenticate,
    requireRestaurantAccess,
    requiredRole("OWNER", "MANAGER"),
    validate(updateReservationDto),
    updateReservationController
)

/**
 * @route PATCH /api/v1/restaurants/:restaurantId/reservations/:reservationId/cancel
 * @desc  Cancel a reservation
 * @access Private - OWNER / MANAGER
 */
router.patch(
    "/:restaurantId/reservations/:reservationId/cancel",
    authenticate,
    requireRestaurantAccess, 
    requiredRole("OWNER", "MANAGER"),
    cancelReservationController
)

export default router
