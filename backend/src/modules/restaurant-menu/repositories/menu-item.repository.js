import { MenuItem } from "../models/menu-item.model.js";

// Create Menu Item
export async function createMenuItem(itemData, session) {
    return MenuItem.create([itemData], { session }).then(([item]) => item)
}

// Get a Menu item by it's ID 
export async function findMenuItemById(itemId, session) {
    const query = MenuItem.findById(itemId).populate("category", "name description displayOrder")
    if (session) query.session(session)
    return query.exec()
}

/**
 * Retrieves a filtered, sorted, and paginated list of menu items for a specific restaurant
 * @param {string} restaurantId 
 * @param {Object} [filters={}] 
 * @param {Object} [options={}] 
 * @param {import('mongoose').ClientSession} [session]
 * @returns {Promise<Array<Object>>}
 */
export async function findMenuItemsByRestaurant(restaurantId, filters = {}, options = {}, session) {
    const query = { restaurant: restaurantId }

    if (filters.category) {
        query.category = filters.category
    }
    if (filters.isAvailable !== undefined) {
        query.isAvailable = filters.isAvailable
    }
    if (filters.search) {
        query.name = { $regex: filters.search, $options: "i" }
    }

    const mongooseQuery = MenuItem
        .find(query)
        .populate("category", "name description displayOrder")
        .sort({ category: 1, name: 1})

    if (options.skip) mongooseQuery.skip(options.skip)
    if (options.limit) mongooseQuery.limit(options.limit)
    if (session) mongooseQuery.session(session)

    return mongooseQuery.exec()
}

export async function updateMenuItemById(itemId, updateData, session) {
    const query = MenuItem.findByIdAndUpdate(itemId, { $set: updateData }, { returnDocument: "after", runValidators: true })
    if (session) query.session(session)
    return query
}

/**
 * Quantifies total matching menu item documents based on tenant filtration criteria
 * @param {string} restaurantId 
 * @param {Object} [filters={}] 
 * @param {import('mongoose').ClientSession} [session]
 * @returns {Promise<number>}
 */
export async function countMenuItemsByRestaurant(restaurantId, filters = {}, session) {
    const query = { restaurant: restaurantId }

    if (filters.category) query.category = filters.category
    if (filters.isAvailable !== undefined) query.isAvailable = filters.isAvailable
    if (filters.search) query.name = { $regex: filters.search, $options: "i"}

    const mongooseQuery = MenuItem.countDocuments(query)
    if (session) mongooseQuery.session(session)
        
    return mongooseQuery.exec()
}
