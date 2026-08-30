import ApiResponse from "../../../utils/api-response.js"

import { catchAsync } from "../../../utils/catchAsync.js"
import { Reservation } from "../models/reservation.model.js"

import * as ReservationService from "../services/reservation.service.js"

// 1. Create Reservation Controller
export const createReservationController = catchAsync(async (req, res) => {
    const { restaurantId } = req.params
    
    const isStaff = ["OWNER", "MANAGER"].includes(req.user.role)
    const customerId = isStaff ? req.body.customer : req.user.id

    const reservation = await ReservationService.createReservationService({
        restaurantId,
        customer: customerId,
        ...req.body
    })

    return ApiResponse.created(res, {
        message: "Reservation created successfully",
        data: {
            reservation
        }
    })
})

// 2. Get All Reservations Controller
export const getRestaurantReservationsController = catchAsync(async (req, res) => {
    const { restaurantId } = req.params

    const reservations = await ReservationService.getRestaurantReservationsService(restaurantId)

    return ApiResponse.success(res, {
        message: "Reservations fetched successfully",
        data: {
            reservations
        }
    })
})

// 3. Get Single Reservation Controller
export const getReservationController = catchAsync(async (req, res) => {
    const { restaurantId, reservationId } = req.params

    const reservation = await ReservationService.getReservationService({ restaurantId, reservationId })

    return ApiResponse.success(res, {
        message: "Reservation fetched successfully",
        data: {
            reservation
        }
    })
})

// 4. Update Reservation Controller
export const updateReservationController = catchAsync(async (req, res) => {
    const { restaurantId, reservationId } = req.params
    const reservation = await ReservationService.updateReservationService({
        restaurantId,
        reservationId,
        ...req.body
    })

    return ApiResponse.success(res, {
        message: "Reservation updated successfully",
        data: {
            reservation
        }
    })
})

// 5. Cancel Reservation Controller
export const cancelReservationController = catchAsync(async (req, res) => {
    const { restaurantId, reservationId } = req.params

    const reservation = await ReservationService.cancelReservationService({
        restaurantId,
        reservationId
    })

    return ApiResponse.success(res, {
        message: "Reservation cancelled successfully",
        data: {
            reservation
        }
    })
})