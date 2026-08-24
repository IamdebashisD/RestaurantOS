import mongoose from "mongoose";

import ApiError from "../../../utils/api-error.js"

import {
    findRestaurantById,
} from "../../restaurants/repositories/restaurant.repository.js"

import {
    createMenuItem,
    findMenuItemsByRestaurant,
} from "../repositories/menu-item.repository.js"

// 1. Create Menu Item
export async function createMenuItemService({
    restaurantId,
    name,
    description,
    price,
    category,
    image,
    isAvailable
}) {
    const restaurant = await findRestaurantById(restaurantId)
    if (!restaurant) throw ApiError.notFound("Restaurant not found")

    const session = await mongoose.startSession()

    try {
        let menuItem
        await session.withTransaction(async () => {
            const itemData = {
                restaurant: restaurantId,
                name,
                description,
                price,
                category,
                image,
                isAvailable
            }

            const result = await createMenuItem(itemData, session)
            menuItem = Array.isArray(result) ? result[0] : result
        })
        return menuItem
    } catch (error) {
        if (error instanceof ApiError) throw error
        throw ApiError.internal("Failed to create menu item due to a database error", error)
    } finally {
        await session.endSession()
    }
}

// 2. Get All Menu Items
export async function getRestaurantMenuItemsService(restaurantId) {
    const restaurant = findRestaurantById(restaurantId)
    if (!restaurant) throw ApiError.notFound("Restaurant not found")

    const menuItems = await findMenuItemsByRestaurant(restaurantId)
    
    return menuItems
}


