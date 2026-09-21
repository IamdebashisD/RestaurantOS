import { Inventory } from "../models/inventory.model.js"

// 1. Create a new inventory item
export async function createInventory(itemData, session) {
    return Inventory.create([itemData], { session }).then(([item]) => item) 
}

// 2. Find an inventory item by its unique ID
export async function findInventoryItemById(itemId, session) {
    const query = Inventory.findById(itemId)
    if (session) query.session(session)
    return query.exec() 
}

// 3. Find an item in a specific restaurant by its exact name
export async function findInventoryItemByName(restaurantId, name, session) {
    const query = Inventory.findOne({ restaurant: restaurantId, name: name })
    if (session) query.session(session)
    return query.exec() 
}

// 4. Get all inventory items for a restaurant with pagination limits
export async function findInventoryByRestaurant(restaurantId, options = {}, session) {
    const query = Inventory.find({ restaurant: restaurantId }).sort({ name: 1 })

    if (options.skip !== undefined) query.skip(options.skip)
    if (options.limit !== undefined) query.limit(options.limit)
    if (session) query.session(session)

    return query.exec() 
}

// 5. Count total inventory items for a restaurant (for pagination meta)
export async function countInventoryByRestaurant(restaurantId) {
    return Inventory.countDocuments({ restaurant: restaurantId }).exec()
}

// 6. Update an inventory item by its unique ID
export async function updateInventoryItemById(itemId, updateData, session) {
    const query = Inventory.findByIdAndUpdate(
        itemId,
        { $set: updateData },
        {
            returnDocument: "after",
            runValidators: true
        }
    )
    
    if (session) query.session(session)
    return query.exec()
}

// 7. Find active low-stock inventory items for a restaurant
export async function findLowStockInventoryByRestaurant(restaurantId, options = {}, session) {
    const query = Inventory.find({ 
        restaurant: restaurantId,
        status: "ACTIVE",
        $expr: {
            $lte: ["$currentQuantity", "$minimumQuantity"]
        }
    })
    .sort({ currentQuantity: 1, name: 1 })

    if (options.skip !== undefined) query.skip(options.skip)
    if (options.limit !== undefined) query.limit(options.limit)
    if (session) query.session(session)
        
    return query.exec()
}

// 8. Count active low-stock inventory items for a restaurant
export async function countLowStockInventoryByRestaurant(restaurantId) {
    return Inventory.countDocuments({
        restaurant: restaurantId,
        status: "ACTIVE",
        $expr: {
            $lte: ["$currentQuantity", "$minimumQuantity"]
        }
    }).exec()
}
