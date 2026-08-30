import mongoose from "mongoose"

import ApiError from "../../../utils/api-error.js"

import { 
    findRestaurantById 
} from "../../restaurants/repositories/restaurant.repository.js"

import { 
    findTableById 
} from "../../restaurant-tables/repositories/restaurant-table.repository.js"

import {
    createReservation,
    findReservationsByTableAndDate,
    findReservationsByRestaurant,
    findReservationById,
    updateReservationById,
} from "../repositories/reservation.repository.js"


// 1. Create Reservation
export async function createReservationService({ 
    restaurantId, 
    table, 
    customer, 
    date, 
    startTime, 
    endTime, 
    guests 
}) {
    // Check Restaurant exists
    const restaurant = await findRestaurantById(restaurantId)
    if (!restaurant) throw ApiError.notFound("Restaurant not found")
    // Check table exists
    const restaurantTable = await findTableById(table)
    if (!restaurantTable) throw ApiError.notFound("Table not found")

    // Check table belongs to restaurant
    const tableRestaurantId = restaurantTable.restaurant._id 
        ? restaurantTable.restaurant._id.toString() 
        : restaurantTable.restaurant.toString()

    if (tableRestaurantId !== restaurantId) throw ApiError.notFound("Table not found")
    
    // Checking table is active
    if (restaurantTable.status === "INACTIVE") throw ApiError.conflict("Cannot create reservation for an inactive table")
    // Check guests capacity
    if (guests > restaurantTable.capacity) {
        throw ApiError.conflict(`Table capacity is ${restaurantTable.capacity} guests`)
    }
    
    // Validate reservation time
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) 
        throw ApiError.badRequest("Invalid time format. Use HH:mm format")

    if (startTime >= endTime) throw ApiError.badRequest("Start time must be earlier than end time")

    const session = await mongoose.startSession()

    try {
        let reservation

        await session.withTransaction(async () => {
            // Find reservations for this table and date
            const existingReservations = await findReservationsByTableAndDate(table, date, session)

            // check overlapping reservation
            const hasConflict = existingReservations.some((existing) => {
                if (existing.status === "CANCELLED") return false
                return startTime < existing.endTime && endTime > existing.startTime
            })

            if (hasConflict) throw ApiError.conflict("Table is already reserved for the selected time")

            // Final Reservation Payload or Object
            const reservationData = {
                restaurant: restaurantId,
                table,
                customer,
                date,
                startTime,
                endTime,
                guests,
                status: "CONFIRMED"
            }

            reservation = await createReservation(reservationData, session)
        })

        return reservation

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

// 2. Get All Reservations for Restaurant
export async function getRestaurantReservationsService(restaurantId) {
    // Check restaurant exists
    const restaurant = await findRestaurantById(restaurantId)
    if (!restaurant) throw ApiError.notFound("Restaurant not found")
    // Get all reservations belonging to this restaurant
    const reservations = await findReservationsByRestaurant(restaurantId)
    return reservations
}

// 3. Get Single Reservation
export async function getReservationService({ restaurantId, reservationId }) {
    const reservation = await findReservationById(reservationId)
    if (!reservation) throw ApiError.notFound("Reservation not found")
    
    const reservationRestaurantId = reservation.restaurant._id 
        ? reservation.restaurant._id.toString()
        : reservation.restaurant.toString()
    
    if (reservationRestaurantId !== restaurantId) throw ApiError.notFound("Reservation not found")
    
    return reservation
}

// 4. Update reservation
export async function updateReservationService({
    restaurantId,
    reservationId, 
    table, 
    date, 
    startTime, 
    endTime, 
    guests 
}) {
    // Find existing reservation
    const existingReservation = await findReservationById(reservationId)
    if (!existingReservation) throw ApiError.notFound("Reservation not found")

    // Check reservation belongs to restaurant
    const reservationRestaurantId = existingReservation.restaurant._id 
        ? existingReservation.restaurant._id.toString()
        : existingReservation.restaurant.toString()

    if (reservationRestaurantId !== restaurantId) throw ApiError.notFound("Reservation not found")

    const updateData = {}
    if (table !== undefined) updateData.table = table
    if (date !== undefined) updateData.date = date
    if (startTime !== undefined) updateData.startTime = startTime
    if (endTime !== undefined) updateData.endTime = endTime
    if (guests !== undefined) updateData.guests = guests

    if (Object.keys(updateData).length === 0) return existingReservation

    /*
     * The final values after applying the update.
     * If a field wasn't provided, keep the existing value.
     */
    const finalTable = table !== undefined ? table : existingReservation.table.toString()
    const finalDate = date !== undefined ? date : existingReservation.date
    const finalStartTime = startTime !== undefined ? startTime : existingReservation.startTime
    const finalEndTime = endTime !== undefined ? endTime : existingReservation.endTime
    const finalGuests = guests !== undefined ? guests : existingReservation.guests
    
    /*
     * Need to validate reservation time again, there is having a small code redundancy, 
     * but its okay for now, I'll change it later. ⬇
     */
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeRegex.test(finalStartTime) || !timeRegex.test(finalEndTime)) {
        throw ApiError.badRequest("Invalid time format. Use HH:mm format")
    }
    if (finalStartTime >= finalEndTime) throw ApiError.badRequest("Start time must be earlier than end time")
    
    const restarantTable = await findTableById(finalTable)
    if (!restarantTable) throw ApiError.notFound("Table not found")
    
    // Checking table belong to restaurant
    const tableRestaurantId = restarantTable.restaurant._id 
        ? restarantTable.restaurant._id.toString() 
        : restarantTable.restaurant.toString()
    if (tableRestaurantId !== restaurantId) throw ApiError.notFound("Table not found")

    // checking table is active or not
    if (restarantTable.status === "INACTIVE") throw ApiError.conflict("Cannot update reservation to an inactive table")
    // checking guest capacity 
    if (finalGuests > restarantTable.capacity) throw ApiError.conflict(`Table capacity is ${restarantTable.capacity} guests`)

    // Transactions are mandatory here to prevent double-booking race conditions during time shifts
    const session = await mongoose.startSession()
    try {
        let updatedReservation

        await session.withTransaction(async () => {
            /*
             * Check reservation conflicts.
             *
             * We only need to do this when the table/date/time
             * could have changed.
             */
            const existingReservations = await findReservationsByTableAndDate(finalTable, finalDate, session)

            const hasConflict = existingReservations.some((existing) => {
                if (existing._id.toString() === reservationId) return false
                if (existing.status === "CANCELLED") return false
                return finalStartTime < existing.endTime && finalEndTime > existing.startTime
            })

            if (hasConflict) throw ApiError.conflict("Table is already reserved for the selected time")

            updatedReservation = await updateReservationById(reservationId, updateData, session)
        })

        return updatedReservation 
        
    } catch (error) {
        if (error instanceof ApiError) throw error
        throw ApiError.internal(
            "Failed to update reservation due to a database error", 
            error
        )
    } finally {
        await session.endSession()
    }
}

// 5. Cancel Reservation
export async function cancelReservationService({ restaurantId, reservationId }) {
    // find reservation
    const existingReservation = await findReservationById(reservationId)
    if (!existingReservation) throw ApiError.notFound("Reservation not found")
    
    // Check reservation belongs to restaurant
    const reservationRestaurantId = existingReservation.restaurant._id 
        ? existingReservation.restaurant._id.toString()
        : existingReservation.restaurant.toString()
        
    if (reservationRestaurantId !== restaurantId) throw ApiError.notFound("Reservation not found")

    // Already cancelled
    if (existingReservation.status === "CANCELLED") throw ApiError.conflict("Reservation is already cancelled")
    // Completed reservation cannot be cancelled    
    if (existingReservation.status === "COMPLETED") throw ApiError.conflict("Completed reservation cannot be cancelled")
        
    try {
        return await updateReservationById(reservationId, { status: "CANCELLED" })
    } catch (error) {
        if (error instanceof ApiError) throw error
        throw ApiError.internal("Database error", error)
    }
}