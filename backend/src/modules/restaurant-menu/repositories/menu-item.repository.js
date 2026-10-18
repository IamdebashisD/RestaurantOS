import mongoose from "mongoose"
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
    const pipeline = [
        // 1. Initial match on the tanent restaurant ID
        { $match: { restaurant: new mongoose.Types.ObjectId(restaurantId) } },
    ]

    // 2. Optional direct availibility filtering
    if (filters.isAvailable !== undefined) {
        pipeline.push({ $match: { isAvailable: filters.isAvailable } })
    }

    // 3. Optional full-text search againts the item name
    if (filters.search?.trim()) {
        pipeline.push({ $match: { name: { $regex: filters.search.trim(), $options: "i" } } })
    }

    // 4. THE MAGIC JOIN: Join with the menu-categories collection
    pipeline.push({
        $lookup: {
            from: "menucategories",
            localField: "category",
            foreignField: "_id",
            as: "category"
        }
    })

    // 6. Unbox the join array into a single object wrapper
    pipeline.push({ $unwind: "$category" })

    if (filters.category?.trim()) {
        pipeline.push({
            $match: {
                "category.name": { $regex: `^${filters.category.trim()}$`, $options: "i" }
            }
        })
    }

    // 7. Sort configurations
    pipeline.push({ $sort: { "category.name": 1, name: 1  } })

    if (options.skip) pipeline.push({ $skip: options.skip })
    if (options.limit) pipeline.push({ $limit: options.limit })
    
    const queryExec = MenuItem.aggregate(pipeline)
    if (session) queryExec.session(session)

    return queryExec.exec()
}

export async function updateMenuItemById(itemId, updateData, session) {
    const query = MenuItem.findByIdAndUpdate(itemId, { $set: updateData }, { returnDocument: "after", runValidators: true })
    if (session) query.session(session)
    return query.exec()
}

/**
 * Quantifies total matching menu item documents based on tenant filtration criteria
 * @param {string} restaurantId 
 * @param {Object} [filters={}] 
 * @param {import('mongoose').ClientSession} [session]
 * @returns {Promise<number>}
 */
export async function countMenuItemsByRestaurant(restaurantId, filters = {}, session) {
    const pipeline = [
        {
            $match: {
                restaurant: new mongoose.Types.ObjectId(restaurantId),
            },
        },
    ]

    // 1. Filter by availability
    if (filters.isAvailable !== undefined) {
        pipeline.push({
            $match: {
                isAvailable: filters.isAvailable,
            },
        })
    }

    // 2. Search by menu item name
    if (filters.search?.trim()) {
        pipeline.push({
            $match: {
                name: {
                    $regex: filters.search.trim(),
                    $options: "i",
                },
            },
        })
    }

    // 3. Join the category collection
    pipeline.push({
        $lookup: {
            from: "menucategories",
            localField: "category",
            foreignField: "_id",
            as: "category",
        },
    })

    // 4. Convert the category array into an object
    pipeline.push({ $unwind: "$category", })

    // 5. Apply the selected category filter
    if (filters.category?.trim()) {
        pipeline.push({
            $match: {
                "category.name": {
                    $regex: `^${filters.category.trim()}$`,
                    $options: "i",
                },
            },
        })
    }

    // 6. Count the filtered documents
    pipeline.push({ $count: "total", })

    const queryExec = MenuItem.aggregate(pipeline)

    if (session) queryExec.session(session)

    const result = await queryExec.exec()

    return result.length > 0 ? result[0].total : 0
}
