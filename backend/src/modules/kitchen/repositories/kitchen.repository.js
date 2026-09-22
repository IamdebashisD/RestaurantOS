import { Order } from "../../orders/models/order.model.js"

// 1. Get orders currently in the kitchen workflow
export async function findKitchenOrders(restaurantId, options = {}, session) {
    console.log(restaurantId)
    const query = Order.find({ 
        restaurant: restaurantId,
        status: {
            $in: [
                "CONFIRMED",
                "PREPARING",
            ]
        } 
    })
    .sort({ 
        createdAt: 1 
    })

    if (options.skip !== undefined) query.skip(options.skip)
    if (options.limit !== undefined) query.limit(options.limit)
    if (session) query.session(session)
        
    return query.exec()
}
// 2. Count orders currently in the kitchen workflow
export async function countKitchenOrders(restaurantId) {
    return Order.countDocuments({ 
        restaurant: restaurantId,
        status: {
            $in: [
                "CONFIRMED",
                "PREPARING",
            ]
        } 
    }).exec()
}
// 3. Find a specific order belonging to a restaurant
export async function findKitchenOrderById(restaurantId, orderId, session) {
    const query = Order.findOne({
        _id: orderId,
        restaurant: restaurantId
    })

    if (session) query.session(session)
    return query.exec()
}
// 4. Update kitchen status atomically
export async function updateKitchenOrderStatus(
    restaurantId,
    orderId,
    currentStatus,
    updateData,
    session
) {
    const query = Order.findOneAndUpdate(
        {
            _id: orderId,
            restaurant: restaurantId,
            status: currentStatus
        },
        {
            $set: updateData
        },
        {
            returnDocument: "after",
            runValidators: true
        }
    )

    if (session) query.session(session)
    return query.exec()
}
