import mongoose from "mongoose";

import ApiError from "../../../utils/api-error.js"

import {
    findRestaurantById,
} from "../../restaurants/repositories/restaurant.repository.js"

import {
    createMenuItem,
    findMenuItemsByRestaurant,
    findMenuItemById,
    updateMenuItemById,
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

// 3. Get a single menu item
export async function getMenuItemService({ restaurantId, menuItemId }) {
    const menuItem = await findMenuItemById(menuItemId)
    if (!menuItem) throw ApiError.notFound("Menu item not found")
    if (menuItem.restaurant.toString() !== restaurantId) throw ApiError.notFound("Menu item not found")
    return menuItem
}

// 4. Update Menu Item Service
export async function updateMenuItemService({ 
    restaurantId,
    menuItemId,
    name,
    description,
    price,
    category,
    image,
    isAvailable
}) {
    const existingMenuItem = await findMenuItemById(menuItemId)
    if (!existingMenuItem) throw ApiError.notFound("Menu item not found")
    if (existingMenuItem.restaurant.toString() !== restaurantId) throw ApiError.notFound("Menu item not found")
    
    const updateData = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (price !== undefined) updateData.price = price
    if (category !== undefined) updateData.category = category
    if (image !== undefined) updateData.image = image
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable

    if (Object.keys(updateData).length === 0) return existingMenuItem

    const updatedMenuItem = await updateMenuItemById(menuItemId, updateData)

    return updatedMenuItem
}

// 5. Disable Menu Item
export async function deleteMenuItemService({ restaurantId, menuItemId }) {
    const existingMenuItem = await findMenuItemById(menuItemId)
    if (!existingMenuItem) throw ApiError.notFound("Menu item not found")
    if (existingMenuItem.restaurant.toString() !== restaurantId) throw ApiError.notFound("Menu item not found")
    if (!existingMenuItem.isAvailable) throw ApiError.notFound("Menu item not found")

    const deleteMenuItem = await updateMenuItemById(menuItemId, { isAvailable: false })

    return deleteMenuItem
}