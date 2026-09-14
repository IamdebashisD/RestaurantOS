import mongoose from "mongoose"
import ApiError from "../../../utils/api-error.js"

import { findRestaurantById } from "../../restaurants/repositories/restaurant.repository.js"

import {
    createInventory, 
    findInventoryItemByName,
    findInventoryByRestaurant,
    countInventoryByRestaurant,
} from "../repositories/inventory.repository.js"


/**
 * 1. Create New Inventory Item
 * Establishes a brand new ingredient or stock asset for a specific restaurant.
 */
export async function createInventoryService({
    restaurantId,
    name,
    unit,
    minimumQuantity = 0,
    costPerUnit = 0
}) {
    const restaurant = await findRestaurantById(restaurantId)
    if (!restaurant) throw ApiError.notFound("Restaurant not found")
    
    const session = await mongoose.startSession()

    try {
        let createdItem

        await session.withTransaction(async () => {
            const normalizedName = name.trim()
            const existingItem = await findInventoryItemByName(restaurantId, normalizedName, session)
            if (existingItem) {
                throw ApiError.conflict(
                    `An inventory item with the name "${normalizedName}" already exists in this restaurant`
                )
            }

            const itemData = {
                restaurant: restaurantId,
                name: normalizedName,
                unit,
                currentQuantity: 0,
                minimumQuantity,
                costPerUnit,
                status: "ACTIVE"
            }

            createdItem = await createInventory(itemData, session)
        })

        return createdItem

    } catch (error) {
        if (error instanceof ApiError) throw error
        throw ApiError.internal(
            "Failed to create inventory item due to a database error", 
            error
        )
    } finally {
        await session.endSession()
    }
}

/**
 * 2. Get All Inventory Items
 * Retrieves an alphabetically sorted, paginated list of all ingredients in stock.
 */
export async function getRestaurantInventoryService({ restaurantId, page = 1 , limit = 10 }) {
    const restaurant = await findRestaurantById(restaurantId)
    if (!restaurant) throw ApiError.notFound("Restaurant not found")
    
    const parsedPage = Math.max(1, parseInt(page, 10))
    const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10)))
    const skip = (parsedPage - 1) * parsedLimit

    const [inventoryItems, totalItems] = await Promise.all([
        findInventoryByRestaurant(restaurantId, { skip, limit: parsedLimit }),
        countInventoryByRestaurant(restaurantId)
    ])
    
    const totalPages = Math.ceil(totalItems / parsedLimit)

    return {
        inventoryItems,
        pagination: {
            page: parsedPage,
            limit: parsedLimit,
            totalItems,
            totalPages,
            hasNextPage: parsedPage < totalPages,
            hasPrevPage: parsedPage > 1
        }
    }
}
