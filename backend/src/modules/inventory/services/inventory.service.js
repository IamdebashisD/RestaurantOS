import mongoose from "mongoose"
import ApiError from "../../../utils/api-error.js"

import { findRestaurantById } from "../../restaurants/repositories/restaurant.repository.js"

import {
    createInventory, 
    findInventoryItemByName,
    findInventoryByRestaurant,
    countInventoryByRestaurant,
    findInventoryItemById,
    updateInventoryItemById,
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

/**
 * 3. Get Inventory Item by ID
 * Retrieves a single inventory item belonging to a specific restaurant.
 */
export async function getInventoryItemByIdService({ restaurantId, itemId }) {
    const inventoryItem = await findInventoryItemById(itemId)
    if (!inventoryItem) throw ApiError.notFound("Inventory item not found")
    const inventoryRestaurantId = inventoryItem.restaurant?._id?.toString() ?? inventoryItem.restaurant?.toString()
    if (inventoryRestaurantId !== restaurantId) throw ApiError.notFound("Inventory item not found")
    return inventoryItem
}

/**
 * 4. Update Inventory Item
 * Updates inventory metadata without directly modifying stock quantity.
 */
export async function updateInventoryItemService({
    restaurantId,
    itemId, 
    name, 
    minimumQuantity, 
    costPerUnit, 
    status 
}) {
    const existingItem = await findInventoryItemById(itemId)
    if (!existingItem) throw ApiError.notFound("Inventory item not found")
    const inventoryRestaurantId = existingItem.restaurant?._id?.toString() ?? existingItem.restaurant?.toString()
    if (inventoryRestaurantId !== restaurantId) throw ApiError.notFound("Inventory item not found")

    // Build partial patch dictionary
    const normalizedUpdateData = {}
    if (name !== undefined) normalizedUpdateData.name = name.trim()
    if (minimumQuantity !== undefined) normalizedUpdateData.minimumQuantity = minimumQuantity
    if (costPerUnit !== undefined) normalizedUpdateData.costPerUnit = costPerUnit
    if (status !== undefined) normalizedUpdateData.status = status
    if (Object.keys(normalizedUpdateData).length === 0) return existingItem

    const session = await mongoose.startSession()

    try {
        let updatedItem

        await session.withTransaction(async () => {
            if (
                normalizedUpdateData.name &&
                normalizedUpdateData.name !== existingItem.name
            ) {
                const duplicateItem = await findInventoryItemByName(
                    restaurantId, 
                    normalizedUpdateData.name, 
                    session
                )
                if (duplicateItem) {
                    throw ApiError.conflict(`An inventory item named "${normalizedUpdateData.name}" already exists`)    
                }
            }

            updatedItem = await updateInventoryItemById(itemId, normalizedUpdateData, session)
        })

        return updatedItem

    } catch (error) {
        if (error instanceof ApiError) throw error
        throw ApiError.internal(
            "Failed to update inventory details due to a database error", 
            error
        )
    } finally {
        await session.endSession()
    }
    
}
