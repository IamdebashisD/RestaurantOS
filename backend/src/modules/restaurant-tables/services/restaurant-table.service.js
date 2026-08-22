import mongoose from "mongoose";

import ApiError from "../../../utils/api-error.js"

import { findRestaurantById } from "../../restaurants/repositories/restaurant.repository.js"

import { 
    createRestaurantTable, 
    findTableByRestaurantAndNumber,
    findTablesByRestaurant,
    findTableById,
    updateTableById
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

// Get Restaurant Table by ID
export async function getRestaurantTableByIdService({ restaurantId, tableId }) { 
    const table = await findTableById(tableId)
    if (!table) throw ApiError.notFound("Table not found")

    if (table.restaurant.toString() !== restaurantId) 
        throw ApiError.notFound("Restaurant table not found")

    return table
}

// Update Restaurant Table by ID
export async function updateRestaurantTableService({ restaurantId, tableId, tableNumber, capacity, status }) {
    const existingTable = await findTableById(tableId)
    if (!existingTable ) throw ApiError.notFound("Table not found")
    if (existingTable.restaurant.toString() !== restaurantId) throw ApiError.notFound("Table not found")

    if (tableNumber !== undefined && tableNumber !== existingTable.tableNumber) {
        const duplicateTable = await findTableByRestaurantAndNumber(restaurantId, tableNumber)
        if (duplicateTable) throw ApiError.conflict(`Table ${tableNumber} already exists in this restaurant`)
    }

    const updateData = {}
    if (tableNumber !== undefined) updateData.tableNumber = tableNumber
    if (capacity !== undefined) updateData.capacity = capacity
    if (status !== undefined) updateData.status = status

    if (Object.keys(updateData).length === 0) return existingTable

    const table = await updateTableById(tableId, updateData)

    return table
}