import { Reservation } from "../models/reservation.model.js"

// Create reservation
export async function createReservation(reservationData, session) {
    return Reservation
        .create([reservationData], { session })
        .then(([reservation]) => reservation)
}

// Find reservation by ID
export async function findReservationById(reservationId, session) {
    const query = Reservation.findById(reservationId)
    if (session) query.session(session)
    return query.exec()
}

// Find reservations for a table on a specific date
export async function findReservationsByTableAndDate(tableId, date, session) {
    const query = Reservation.find({ table: tableId, date })
    if (session) query.session(session)
    return query
}

// Find all reservations for a restaurant
export async function findReservationsByRestaurant(restaurantId, session) {
    const query = Reservation
        .find({ restaurant: restaurantId })
        .sort({ date: 1, startTime: 1 })
    
    if (session) query.session(session)
    return query
}

// Update reservation
export async function updateReservationById(reservationId, updateData, session) {
    const query = Reservation.findByIdAndUpdate(
        reservationId,
        { $set: updateData }, 
        { returnDocument: "after", runValidators: true }
    )

    if (session) query.session(session)
    return query
}