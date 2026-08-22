import mongoose from "mongoose";

import ApiError from "../../../utils/api-error.js"

import { findRestaurantById } from "../../restaurants/repositories/restaurant.repository.js"

import { 
    createRestaurantTable, 
    findTableByRestaurantAndNumber,
    findTablesByRestaurant 
} from "../repositories/restaurant-table.repository.js"


// Create Restaurant Table
export async function createRestaurantTableService({ restaurantId, tableNumber, capacity, status }) {
    const session = await mongoose.startSession()
    try {
        let table

        await session.withTransaction(async () => {
            // Check whether the restauramt exists
            const restaurant = await findRestaurantById(restaurantId, session)
            if (!restaurant) throw ApiError.notFound("Restaurant not found")

            // Check duplicate table number
            const existingTable = await findTableByRestaurantAndNumber(restaurantId, tableNumber, session)
            if (existingTable) throw ApiError.conflict(`Table ${tableNumber} already exists in this restaurant`)
            console.log({
                restaurantId,
                tableNumber,
                existingTable
            })
            const tableData = {
                restaurant: restaurantId,
                tableNumber,
                capacity,
                status
            }

            table = await createRestaurantTable(tableData, session)
        })

        return table
    } catch (error) {
        if (error?.code === 11000) {
            throw ApiError.conflict("A table with this number already exists in this restaurant")
        }
        throw error
    } finally {
        await session.endSession()
    }
}

// Get Restaurant all Tables
export async function getRestaurantTablesService(restaurantId) {
    const restaurant = await findRestaurantById(restaurantId)
    if (!restaurant) throw ApiError.notFound("Restaurant not found")
    const tables = await findTablesByRestaurant(restaurantId)
    return tables
}