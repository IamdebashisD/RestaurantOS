import { Order } from "../models/order.model.js";

// Create Order
export async function createOrder(orderData, session) {
    return Order
        .create([orderData], { session })
        .then(([order]) => order)
}

// Find Order by ID
export async function findOrderById(orderId, session) {
    const query = Order.findById(orderId)
    if (session) query.session(session)
    return query
}

// Find all Orders for a Restaurant
export async function findOrdersByRestaurant(restaurantId, session) {
    const query = Order.find({ restaurant: restaurantId }).sort({ createdAt: -1 })
    if (session) query.session(session)
    return query
}

// Find all Orders for a Table
export async function findOrdersByTable(tableId, session) {
    const query = Order.find({ table: tableId }).sort({ createdAt: -1 })
    if (session) query.session(session)
    return query
}

// Find all Orders for a Customer
export async function findOrdersByCustomer(customerId, session) {
    const query = Order.find({ customer: customerId }).sort({ createAt: -1 })
    if (session) query.session(session)
    return query
}

// Update Order
export async function updateOrderById(orderId, updateData,  session) {
    const query = Order.findByIdAndUpdate(
        orderId,
        {
            $set: updateData
        },
        {
            returnDocument: "after",
            runValidators: true
        }
    )
    if (session) query.session(session)
    return query
}


