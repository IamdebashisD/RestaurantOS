import { PurchaseOrder } from "../models/purchase-order.model.js"


// 1. Create a new purchase order
export async function createPurchaseOrder(purchaseOrderData, session) {
    return PurchaseOrder
        .create([purchaseOrderData], { session })
        .then(([purchaseOrder]) =>  purchaseOrder)
}
// 2. Find a purchase order by ID
export async function findPurchaseOrderById(purchaseOrderId, session) {
    const query = PurchaseOrder.findById(purchaseOrderId)
    if (session) query.session(session)
    return query.exec()
}
// 3. Find a purchase order by its business number
export async function findPurchaseOrderByNumber(
    restaurantId, 
    purchaseOrderNumber, 
    session
) {
    const query = PurchaseOrder.findOne({
        restaurant: restaurantId,
        purchaseOrderNumber
    })

    if (session) query.session(session)
    return query.exec()
}
// 4. Get purchase orders for a restaurant
export async function findPurchaseOrdersByRestaurant(
    restaurantId,
    filters = {},
    options = {},
    session
) {
    const query = {
        restaurant: restaurantId
    }
    if (filters.status) query.status = filters.status
    if (filters.supplier) query.supplier = filters.supplier
    if (filters.search) {
        query.purchaseOrderNumber = { 
            $regex: filters.search, 
            $options: "i" 
        }
    }

    const mongooseQuery = PurchaseOrder.find(query).sort({ createdAt: -1 })

    if (options.skip !== undefined) mongooseQuery.skip(options.skip)
    if (options.limit !== undefined) mongooseQuery.limit(options.limit)
    if (session) mongooseQuery.session(session)

    return mongooseQuery.exec()
}

// 5. Count purchase orders for a restaurant
export async function countPurchaseOrdersByRestaurant(restaurantId, filters = {}) {
    const query = { restaurant: restaurantId }

    if (filters.status) {
        query.status = filters.status
    }
    if (filters.supplier) {
        query.supplier = filters.supplier
    }
    if (filters.search) {
        query.purchaseOrderNumber = { 
            $regex: filters.search, 
            $options: "i" 
        }
    }

    return PurchaseOrder.countDocuments(query).exec()
}
// 6. Update a purchase order by ID
export async function updatePurchaseOrderById(purchaseOrderId, updateData, session) {
    const query = PurchaseOrder.findByIdAndUpdate(
        purchaseOrderId,
        { $set: updateData },
        { returnDocument: "after", runValidators: true }
    )
    if (session) query.session(session)
    return query.exec()
}

// 7. Atomically transitions a purchase order status from DRAFT to ORDERED
export async function transitionDraftToOrdered(purchaseOrderId, restaurantId, updateData) {
    return PurchaseOrder.findOneAndUpdate(
        {
            _id: purchaseOrderId,
            restaurant: restaurantId,
            status: "DRAFT" // ⚡ The guard: The update fails instantly if the database state is no longer DRAFT
        },
        { $set: updateData },
        { returnDocument: "after", runValidators: true }
    ).exec()
}

// 8. Atomically transitions a purchase order to CANCELLED
export async function transitionToCancelled(purchaseOrderId, restaurantId, updateData) {
    return PurchaseOrder.findByIdAndUpdate(
        {
            _id: purchaseOrderId,
            restaurant: restaurantId,
            status: { $in: ['DRAFT', 'ORDERED'] } // 🛡️ Safety Guard: Blocks cancellations if stock has arrived
        },
        { $set: updateData },
        { returnDocument: "after", runValidators: true }
    ).exec()
}
