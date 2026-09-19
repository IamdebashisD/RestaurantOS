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
import {
    createInventoryTransaction,
} from "../repositories/inventory-transaction.repository.js"


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

/**
 * 5. Stock In
 * Adds new stock to an inventory item and records the movement
 * as an inventory transaction.
 */
export async function stockInInventoryService({
    restaurantId,
    itemId,
    quantity,
    costPerUnit,
    reason,
    performedBy
}) {
    const existingItem = await findInventoryItemById(itemId)
    if (!existingItem) throw ApiError.notFound("Inventory Item not found")
    
    const itemRestaurantId = existingItem.restaurant?._id?.toString() ?? existingItem.restaurant?.toString()
    if (itemRestaurantId !== restaurantId) throw ApiError.notFound("Inventory Item not found")
    if (existingItem.status !== "ACTIVE") throw ApiError.conflict("Cannot add stock to an inactive inventory item")
    
    const session = await mongoose.startSession()
    try {
        let updatedInventory

        await session.withTransaction(async () => {
            const item = await findInventoryItemById(itemId, session)
            if (!item || item.status !== "ACTIVE") {
                throw ApiError.conflict("Inventory item state changed during processing window")
            }

            //Step 2: Establish the Ledger Mathematical Bounds
            const previousQuantity = item.currentQuantity
            const rawResultingQuantity = previousQuantity + quantity
            const resultingQuantity = Math.round(rawResultingQuantity * 100) / 100
            
            const currentCost = costPerUnit !== undefined ? costPerUnit : item.costPerUnit

            let finalNewCostPerUnit = item.costPerUnit
            if (costPerUnit !== undefined && costPerUnit !== item.costPerUnit) {
                const totalCurrentValue = previousQuantity * item.costPerUnit
                const totalIncomingValue = quantity * costPerUnit
                const totalCombineValue = totalCurrentValue + totalIncomingValue

                // Avoid division by zero if total quantities are empty
                if (resultingQuantity > 0) {
                    const rawAverage = totalCombineValue / resultingQuantity
                    finalNewCostPerUnit = Math.round(rawAverage * 100) / 100
                }
            }

            // Update the Parent Inventory Document
            updatedInventory = await updateInventoryItemById(
                itemId,
                {
                    currentQuantity: resultingQuantity,
                    costPerUnit: finalNewCostPerUnit

                },
                session
            )
            // Create the Immutable Ledger Log Entry
            await createInventoryTransaction(
                {
                    restaurant: restaurantId,
                    inventory: itemId,
                    type: "STOCK_IN",
                    quantity,
                    previousQuantity,
                    resultingQuantity,
                    costPerUnit: currentCost,
                    reason: reason?.trim() || "Regular stock replenishment",
                    performedBy
                },
                session
            )
        })

        return updatedInventory

    } catch (error) {
        if (error instanceof ApiError) throw error
        throw ApiError.internal(
            "Critical failure executing atomic stock replenishment pipeline", 
            error
        )
    } finally {
        await session.endSession()
    }
}

/**
 * 6. Stock Out
 *
 * Removes stock from an inventory item and records the movement
 * as an inventory transaction.
 *
 * The operation is atomic:
 * - Inventory quantity is reduced.
 * - Inventory transaction is created.
 *
 * If either operation fails, the entire transaction is rolled back.
 */
export async function stockOutInventoryService({
    restaurantId,
    itemId,
    quantity,
    reason,
    performedBy
}) {
    const existingItem = await findInventoryItemById(itemId)
    if (!existingItem) throw ApiError.notFound("Inventory Item not found")
    
    const itemRestaurantId = existingItem.restaurant?._id?.toString() ?? existingItem.restaurant?.toString()
    if (itemRestaurantId !== restaurantId) throw ApiError.notFound("Inventory Item not found")
    
    if (existingItem.status !== "ACTIVE") 
        throw ApiError.conflict("Cannot remove stock from an inactive inventory item")

    const session = await mongoose.startSession()
    try {
        let updatedInventory

        await session.withTransaction(async () => {
            const item = await findInventoryItemById(itemId, session)
            if (!item) throw  ApiError.notFound("Inventory item was not found during stock-out processing")
            if (item.status !== "ACTIVE") throw ApiError.conflict("Cannot remove stock from an inactive inventory item")
            if (item.currentQuantity < quantity) {
                throw ApiError.conflict(`Insufficient stock. Available quantity is ${item.currentQuantity} ${item.unit}`)
            }

            // Calculate resulting quantity
            const previousQuantity = item.currentQuantity
            const rawResultingQuantity = previousQuantity - quantity
            const resultingQuantity = Math.round(rawResultingQuantity * 100) / 100
            // Spanshot current inventory cost
            const costPerUnit = item.costPerUnit

            //Update inventory quantity
            updatedInventory = await updateInventoryItemById(
                itemId,
                { currentQuantity: resultingQuantity },
                session
            )
            if (!updatedInventory) throw ApiError.notFound("Inventory item could not be updated")
            
            // Create inventory movement ledger
            await createInventoryTransaction(
                {
                    restaurant: restaurantId,
                    inventory: itemId,
                    type: "STOCK_OUT",
                    quantity,
                    previousQuantity,
                    resultingQuantity,
                    costPerUnit,
                    reason: reason?.trim() || "Regular kitchen stock depletion",
                    performedBy
                },
                session
            )
        })

        return updatedInventory
        
    } catch (error) {
        if (error instanceof ApiError) throw error
        throw ApiError.internal("Critical failure executing atomic stock-out pipeline", error)
    } finally {
        await session.endSession()
    }
}

/**
 * 7. Stock Adjustment
 *
 * Corrects the system inventory quantity so that it matches
 * the physically counted quantity.
 *
 * The operation is atomic:
 * - Inventory quantity is updated.
 * - Adjustment is recorded in the inventory transaction ledger.
 */
export async function stockAdjustmentInventoryService({
    restaurantId,
    itemId,
    actualQuantity,
    reason,
    performedBy
}) {
    const existingItem = await findInventoryItemById(itemId)
    if (!existingItem) throw ApiError.notFound("Inventory Item not found")
    
    const itemRestaurantId = existingItem.restaurant?._id?.toString() ?? existingItem.restaurant?.toString()
    if (itemRestaurantId !== restaurantId) throw ApiError.notFound("Inventory Item not found")
    
    if (existingItem.status !== "ACTIVE") throw ApiError.conflict("Cannot adjust an inactive inventory item")
    // Prevent unnecessary adjustment
    if (existingItem.currentQuantity === actualQuantity) {
        throw ApiError.conflict("Inventory quantity already matches the physical quantity")
    }

    const session = await mongoose.startSession()

    try {
        let updatedInventory

        await session.withTransaction(async () => {
            const item = await findInventoryItemById(itemId, session)
            if (!item) throw ApiError.notFound("Inventory item was not found during adjustment processing")
            if (item.status !== "ACTIVE") throw ApiError.conflict("Cannot adjust an inactive inventory item")
            
            const previousQuantity = item.currentQuantity
            const rawDifference = actualQuantity - previousQuantity
            const difference = Math.round(rawDifference * 100) / 100
            if (difference === 0) throw ApiError.conflict("Inventory quantity already matches the physical quantity")
            const costPerUnit = item.costPerUnit

            // Update inventory quantity
            updatedInventory = await updateInventoryItemById(
                itemId,
                { currentQuantity: actualQuantity },
                session
            )
            if (!updatedInventory) throw ApiError.notFound("Inventory item could not be updated")

            // Create adjustment ledger entry
            const ledgerEntry = {
                restaurant: restaurantId,
                inventory: itemId,
                type: "ADJUSTMENT",
                quantity: Math.abs(difference),
                previousQuantity,
                resultingQuantity: actualQuantity,
                costPerUnit,
                reason: reason?.trim() || "Physical inventory adjustment",
                performedBy
            }
            await createInventoryTransaction(ledgerEntry, session)
        })

        return updatedInventory

    } catch (error) {
        if (error instanceof ApiError) throw error
        throw ApiError.internal("Critical failure executing atomic inventory adjustment pipeline", error)
    } finally {
        await session.endSession()
    }
}
