import { RestaurantTable } from "../models/restaurant-table.model.js"

export async function createRestaurantTable(tableData, session) {
    return RestaurantTable.create([tableData], { session }).then(([table]) => table)
}

export async function findTableById(tableId, session) {
    const query = RestaurantTable.findById(tableId)
    if (session) query.session(session)
    return query
}

export async function findTableByRestaurantAndNumber(restaurantId, tableNumber, session) {
    const query = RestaurantTable.findOne({
        restaurant: restaurantId,
        tableNumber
    })
    if (session) query.session(session)
    return query
}

export async function findTablesByRestaurant(restaurantId, session) {
    const query = RestaurantTable.find({ restaurant: restaurantId }).sort({ tableNumber: 1 })
    if (session) query.session(session)
    return query
}