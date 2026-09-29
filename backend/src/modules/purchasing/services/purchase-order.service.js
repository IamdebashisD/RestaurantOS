import mongoose from "mongoose"
import ApiError from "../../../utils/api-error.js"

import { findRestaurantById } from "../../restaurants/repositories/restaurant.repository.js"
import { findSupplierById } from "../../suppliers/repositories/supplier.repository.js"
import { findInventoryItemById, updateInventoryItemById } from "../../inventory/repositories/inventory.repository.js"
import { createInventoryTransaction } from "../../inventory/repositories/inventory-transaction.repository.js" 

import {
    createPurchaseOrder,
    findPurchaseOrderByNumber,
    findPurchaseOrdersByRestaurant,
    countPurchaseOrdersByRestaurant,
    findPurchaseOrderById,
    updatePurchaseOrderById,
    transitionDraftToOrdered,
} from "../repositories/purchase-order.repository.js"


/**
 * Helper function for - generatePurchaseOrderNumber
 * Generates a unique, non-colliding purchase order reference tracking number string
 * @param {string} restaurantId
 * @param {import('mongoose').ClientSession} [session]
 * @returns {Promise<string>} The unique generated reference string
 */
async function generatePurchaseOrderNumber(restaurantId, session) {
    const prefix = "PO"
    let purchaseOrderNumber
    let exists = true
    let attempt = 0
    const MAX_ATTEMPTS = 5

    while(exists && attempt < MAX_ATTEMPTS) {
        attempt++
        const randomNumber = Math.floor(100000 + Math.random() * 900000)
        purchaseOrderNumber = `${prefix}-${randomNumber}`

        const existingPurchaseOrder = 
            await findPurchaseOrderByNumber(restaurantId, purchaseOrderNumber, session)

        exists = Boolean(existingPurchaseOrder)
    }

    if (attempt >= MAX_ATTEMPTS && exists) {
        throw ApiError.internal(
            "System failed to generate a unique purchase order number. Please try again."
        )
    }

    return purchaseOrderNumber
}

/**
 * 1. Create New Purchase Order
 * Provisions a new Purchase Order document in a DRAFT state within an atomic transaction
 * @param {Object} params
 * @param {string} params.restaurantId
 * @param {string} params.supplierId
 * @param {Array<Object>} params.items
 * @param {number} [params.tax]
 * @param {string|Date} [params.expectedDeliveryDate]
 * @param {string} [params.notes]
 * @returns {Promise<Object>} The created purchase order document object
 */
export async function createPurchaseOrderService({
    restaurantId,
    supplierId,
    items,
    tax = 0,
    expectedDeliveryDate,
    notes
}) {
    const restaurant = await findRestaurantById(restaurantId)
    if (!restaurant) throw ApiError.notFound("Restaurant not found")
    const supplier = await findSupplierById(supplierId)
    if (!supplier) throw ApiError.notFound("Supplier not found")

    const supplierRestaurantId = supplier.restaurant?._id?.toString() ?? supplier.restaurant?.toString()
    if (supplierRestaurantId !== restaurantId) throw ApiError.notFound("Supplier not found")
    
    if (supplier.status !== "ACTIVE") 
        throw ApiError.conflict("Cannot create a purchase order for an inactive supplier")

    const session = await mongoose.startSession()

    try {
        let createdPurchaseOrder
        await session.withTransaction(async () => {
            const purchaseOrderItems = []

            for (const itemData of items) {
                const inventoryItem = await findInventoryItemById(itemData.inventoryId, session)
                if (!inventoryItem) throw ApiError.notFound(`Inventory item ${itemData.inventoryId} not found`)

                const inventoryRestaurantId = 
                    inventoryItem.restaurant?._id?.toString() ?? 
                    inventoryItem.restaurant?.toString()

                if (inventoryRestaurantId !== restaurantId)
                    throw ApiError.notFound(`Inventory item ${itemData.inventoryId} not found`)

                if (inventoryItem.status !== "ACTIVE")
                    throw ApiError.conflict(`Inventory item "${inventoryItem.name}" is inactive`)
                

                const rawSubtotal = itemData.quantity * itemData.costPerUnit
                const subtotal = Math.round(rawSubtotal * 100) / 100

                purchaseOrderItems.push({
                    inventory: inventoryItem._id,
                    name: inventoryItem.name,
                    unit: inventoryItem.unit,
                    quantity: itemData.quantity,
                    receivedQuantity: 0,
                    costPerUnit: itemData.costPerUnit,
                    subtotal
                })
            }

            const subtotal = purchaseOrderItems.reduce((sum, item) => sum + item.subtotal, 0)
            const roundedSubtotal = Math.round(subtotal * 100) / 100
            const rawTotal = roundedSubtotal + tax
            const totalAmount = Math.round(rawTotal * 100) / 100

            const purchaseOrderNumber = await generatePurchaseOrderNumber(restaurantId, session)
        
            const purchaseOrderData =  {
                restaurant: restaurantId,
                supplier: supplierId,
                purchaseOrderNumber,
                items: purchaseOrderItems,
                subtotal: roundedSubtotal,
                tax,
                totalAmount,
                status: "DRAFT",
                expectedDeliveryDate: expectedDeliveryDate ?? null,
                orderedAt: null,
                receivedAt: null,
                notes: notes?.trim() || ""
            }

            const result = await createPurchaseOrder(purchaseOrderData, session)
            createdPurchaseOrder = Array.isArray(result) ? result[0] : result
        })
        
        return createdPurchaseOrder

    } catch (error) {
        if (error instanceof ApiError) throw error
        if (error.code === 11000) {
            throw ApiError.conflict("Purchase order number already exists")
        }
        throw ApiError.internal("Failed to create purchase order due to a database error", error)
    } finally {
        await session.endSession()
    }
}

/**
 * 2. Get All Purchase Orders
 * Retrieves a paginated list of purchase orders for a restaurant based on filter criteria
 * @param {Object} params
 * @param {string} params.restaurantId
 * @param {number|string} [params.page]
 * @param {number|string} [params.limit]
 * @param {string} [params.status]
 * @param {string} [params.supplier]
 * @param {string} [params.search]
 * @returns {Promise<Object>} The purchase orders list and pagination metadata
 */
export async function getRestaurantPurchaseOrdersService({
    restaurantId,
    page = 1,
    limit = 10,
    status,
    supplier,
    search 
}) {
    const restaurant = await findRestaurantById(restaurantId)
    if (!restaurant) throw ApiError.notFound("Restaurant not found")

    const rawPage  = typeof page  === "string" ? parseInt(page, 10)  : page
    const rawLimit = typeof limit === "string" ? parseInt(limit, 10) : limit
    const safePage = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1
    const safeLimit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 100) : 10
    const skip = (safePage - 1) * safeLimit

    const filters = {
        status,
        supplier,
        search: typeof search === "string" ? search.trim() : ""
    }
    const options = { skip, limit: safeLimit }

    const [purchaseOrders, totalItems] = await Promise.all([
        findPurchaseOrdersByRestaurant(restaurantId, filters, options),
        countPurchaseOrdersByRestaurant(restaurantId, filters)
    ])

    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / safeLimit)

    return {
        purchaseOrders,
        pagination: {
            page: safePage,
            limit: safeLimit,
            totalItems,
            totalPages,
            hasNextPage: safePage < totalPages,
            hasPrevPage: safePage > 1
        }
    }
}

/**
 * 3. Get Purchase Order by ID
 * Retrieves a single purchase order by its identifier after verifying tenant isolation
 * @param {Object} params
 * @param {string} params.restaurantId
 * @param {string} params.purchaseOrderId
 * @returns {Promise<Object>} The verified purchase order document
 */
export async function getPurchaseOrderByIdService({ restaurantId, purchaseOrderId }) {
    const purchaseOrder = await findPurchaseOrderById(purchaseOrderId)
    if (!purchaseOrder) throw ApiError.notFound("Purchase order not found")

    const orderRestaurantId = 
        purchaseOrder.restaurant?._id?.toString() ?? 
        purchaseOrder.restaurant?.toString()

    if (orderRestaurantId !== restaurantId) throw ApiError.notFound("Purchase order not found")

    return purchaseOrder
}

/**
 * Updates a purchase order record while in DRAFT status within an atomic transaction
 * @param {Object} params
 * @param {string} params.restaurantId
 * @param {string} params.purchaseOrderId
 * @param {Object} params.updateData
 * @returns {Promise<Object>} The updated purchase order document object
 */
export async function updatePurchaseOrderService({ restaurantId, purchaseOrderId, updateData }) {
    // 1. Verify existence of the core restaurant tenant boundary
    const restaurant = await findRestaurantById(restaurantId)
    if (!restaurant) throw ApiError.notFound("Restaurant not found")

    // 2. Fetch target purchase order and enforce tenant isolation
    const purchaseOrder = await findPurchaseOrderById(purchaseOrderId)
    if (!purchaseOrder) throw ApiError.notFound("Purchase order not found")

    const orderRestaurantId = 
        purchaseOrder.restaurant?._id?.toString() ?? 
        purchaseOrder.restaurant?.toString()
    if (orderRestaurantId !== restaurantId) throw ApiError.notFound("Purchase order not found")

    // 3. Enforce business state locking invariant rules
    if (purchaseOrder.status !== "DRAFT") {
        throw ApiError.conflict(`Cannot modify a purchase order that is already in ${purchaseOrder.status} status`)
    }

    // 4. Strip out undefined parameters early to check for empty payload vectors
    const normalizedUpdateData = {}
    
    for (const [key, value] of Object.entries(updateData)) {
        if (value !== undefined) {
            normalizedUpdateData[key] = typeof value === "string" ? value.trim() : value
        }
    }

    if (Object.keys(normalizedUpdateData).length === 0) return purchaseOrder

    const session = await mongoose.startSession()
    try {
        let updatedPurchaseOrder

        await session.withTransaction(async () => {
            const finalUpdatePayload = {}
            if (normalizedUpdateData.notes !== undefined) {
                finalUpdatePayload.notes = normalizedUpdateData.notes
            }
            if (normalizedUpdateData.expectedDeliveryDate !== undefined) {
                finalUpdatePayload.expectedDeliveryDate = normalizedUpdateData.expectedDeliveryDate
            }

            // 5. Evaluate and handle Supplier updates if requested
            if (normalizedUpdateData.supplierId && 
                normalizedUpdateData.supplierId !== purchaseOrder.supplier?.toString()
            ) {
                const supplier = await findSupplierById(normalizedUpdateData.supplierId)
                if (!supplier) throw ApiError.notFound("Supplier not found")

                const supplierRestaurantId = supplier.restaurant?._id?.toString() ?? supplier.restaurant?.toString()
                if (supplierRestaurantId !== restaurantId) throw ApiError.notFound("Supplier not found")

                if (supplier.status !== "ACTIVE") {
                    throw ApiError.conflict("Cannot assign an inactive supplier to this purchase order")
                }

                finalUpdatePayload.supplier = normalizedUpdateData.supplierId
            }

            // 6. Recalculate items, tax bounds, and subtotal matrices if structural array updates arrive
            let currentItems = purchaseOrder.items
            let currentTax = normalizedUpdateData.tax !== undefined 
                ? normalizedUpdateData.tax 
                : purchaseOrder.tax

            if (normalizedUpdateData.items) {
                const purchaseOrderItems = []

                for (const itemData of normalizedUpdateData.items) {
                    const inventoryItem = await findInventoryItemById(itemData.inventoryId, session)
                    if (!inventoryItem) throw ApiError.notFound(`Inventory item ${itemData.inventoryId} not found`)

                    const inventoryRestaurantId = 
                        inventoryItem.restaurant?._id?.toString() ?? 
                        inventoryItem.restaurant?.toString()

                    if (inventoryRestaurantId !== restaurantId) {
                        throw ApiError.notFound(`Inventory item ${itemData.inventoryId} not found`)
                    }
                    if (inventoryItem.status !== "ACTIVE") {
                        throw ApiError.conflict(`Inventory item "${inventoryItem.name}" is inactive`)
                    }

                    const rawSubtotal = itemData.quantity * itemData.costPerUnit
                    const subtotal = Math.round(rawSubtotal * 100) / 100

                    purchaseOrderItems.push({
                        inventory: inventoryItem._id,
                        name: inventoryItem.name,
                        unit: inventoryItem.unit,
                        quantity: itemData.quantity,
                        receivedQuantity: 0,
                        costPerUnit: itemData.costPerUnit,
                        subtotal
                    })
                }
                currentItems = purchaseOrderItems
                finalUpdatePayload.items = purchaseOrderItems
            }

            // 7. Re-evaluate overall aggregate costs if modifications happened to items or taxes
            if (normalizedUpdateData.items || normalizedUpdateData.tax !== undefined) {
                const subtotal = currentItems.reduce((sum, item) => sum + item.subtotal, 0)
                const roundedSubtotal = Math.round(subtotal * 100) / 100
                const rawTotal = roundedSubtotal + currentTax

                finalUpdatePayload.subtotal = roundedSubtotal
                finalUpdatePayload.tax = currentTax
                finalUpdatePayload.totalAmount = Math.round(rawTotal * 100) / 100
            }
            // 8. Commit atomic changes to the database
            const result = await updatePurchaseOrderById(purchaseOrderId, finalUpdatePayload, session)
            updatedPurchaseOrder = Array.isArray(result) ? result[0] : result
        })

        return updatedPurchaseOrder

    } catch (error) {
        if (error instanceof ApiError) throw error
        if (error.code === 11000) throw ApiError.conflict("Purchase order number already exists")
        throw ApiError.internal("Failed to update purchase order data due to a database error", error)
    } finally {
        await session.endSession()
    }
}

/**
 * 4. Order / Confirm Purchase Order
 * Transitions a purchase order status from DRAFT to ORDERED
 * @param {Object} params
 * @param {string} params.restaurantId
 * @param {string} params.purchaseOrderId
 * @returns {Promise<Object>} The ordered purchase order document
 */
export async function orderPurchaseOrderService({ restaurantId, purchaseOrderId }) {
    const purchaseOrder = await findPurchaseOrderById(purchaseOrderId)
    if (!purchaseOrder) throw ApiError.notFound("Purchase order not found")
    
    const orderRestaurantId = purchaseOrder.restaurant?._id?.toString() ?? purchaseOrder.restaurant?.toString()
    if (orderRestaurantId !== restaurantId) throw ApiError.notFound("Purchase order not found")

    if (purchaseOrder.status !== "DRAFT") {
        throw ApiError.conflict(
            `Purchase order cannot be ordered when its current status is "${purchaseOrder.status}"`
        )
    }
    if (!purchaseOrder.items || purchaseOrder.items.length === 0) {
        throw ApiError.badRequest("Cannot place an empty purchase order")
    }
    // Dynamic payload properties for the state advancement lifecycle step
    const updateData = {
        status: "ORDERED",
        orderedAt: new Date()
    }
    const updatedPurchaseOrder = await transitionDraftToOrdered(purchaseOrderId, restaurantId, updateData)
    if (!updatedPurchaseOrder) {
        throw ApiError.conflict(
            "Purchase order could not be placed because its state changed. Please refresh and try again."
        )
    }
    return updatedPurchaseOrder
}

/**
 * 5. Receive Purchase Order
 *
 * Receives stock against an ORDERED or PARTIALLY_RECEIVED
 * purchase order and atomically updates:
 *
 * 1. Purchase order received quantities/status
 * 2. Inventory current quantities
 * 3. Inventory transaction ledger
 *
 * @param {Object} params
 * @param {string} params.restaurantId
 * @param {string} params.purchaseOrderId
 * @param {Array<Object>} params.items
 * @returns {Promise<Object>} Updated purchase order
 */
export async function receivePurchaseOrderService({ 
    restaurantId, 
    purchaseOrderId, 
    items,
    performedBy 
}) {
    const purchaseOrder = await findPurchaseOrderById(purchaseOrderId)
    if (!purchaseOrder) throw ApiError.notFound("Purchase order not found")
    
    const orderRestaurantId =
        purchaseOrder.restaurant?._id?.toString() ??
        purchaseOrder.restaurant?.toString()
    if (orderRestaurantId !== restaurantId) throw ApiError.notFound("Purchase order not found")
    
    /*
     * Stock can only be received after the PO
     * has been formally ordered.
     */
    if (purchaseOrder.status !== "ORDERED" && purchaseOrder.status !== "PARTIALLY_RECEIVED") {
        throw ApiError.conflict(
            `Cannot receive purchase order when its current status is "${purchaseOrder.status}"`
        )
    }

    const session = await mongoose.startSession()

    try {
        let updatedPurchaseOrder

        await session.withTransaction(async () => {
            /*
             * Re-read the PO inside the transaction.
             *
             * This protects against another request modifying
             * the PO between the initial validation and this
             * receiving operation.
             */
            const currentPurchaseOrder = await findPurchaseOrderById(purchaseOrderId, session)
            if (!currentPurchaseOrder) throw ApiError.notFound("Purchase order not found")
            if (currentPurchaseOrder.status !== "ORDERED" && 
                currentPurchaseOrder.status !== "PARTIALLY_RECEIVED"
            ) {
                throw ApiError.conflict(
                    `Cannot receive purchase order when its current status is "${currentPurchaseOrder.status}"`
                )
            }

            /*
             * Prevent receiving the same inventory item
             * more than once in the same request.
             */
            const inventoryIDs = items.map((item) => item.inventoryId)
            const uniqueInventoryIds = new Set(inventoryIDs)

            if (uniqueInventoryIds.size !== inventoryIDs.length) {
                throw ApiError.badRequest(
                    "Duplicate inventory items are not allowed in a single receiving operation"
                )
            }

            /*
             * Process every received item.
             */
            for (const receivedItem of items) {
                const purchaseOrderItem = currentPurchaseOrder.items.find(
                    (item) => item.inventory.toString() === receivedItem.inventoryId
                )

                if (!purchaseOrderItem) {
                    throw ApiError.badRequest(
                        `Inventory item ${receivedItem.inventoryId} does not belong to this purchase order`
                    )
                }
                /*
                 * How much of this item has already been received?
                 * And how much was originally ordered
                 */
                const alreadyReceived = purchaseOrderItem.receivedQuantity || 0
                const orderedQuantity = purchaseOrderItem.quantity
                const remainingQuantity = orderedQuantity - alreadyReceived

                if (receivedItem.receivedQuantity > remainingQuantity) {
                    throw ApiError.badRequest(
                        `Cannot receive ${receivedItem.receivedQuantity} ${purchaseOrderItem.unit} of "${purchaseOrderItem.name}". Only ${remainingQuantity} ${purchaseOrderItem.unit} remains on the purchase order.`
                    )
                } 

                // Get the inventory document using the transaction session.
                const inventoryItem = await findInventoryItemById(receivedItem.inventoryId, session)
                if (!inventoryItem) throw ApiError.notFound(`Inventory item ${receivedItem.inventoryId} not found`)
                const inventoryRestaurantId =
                    inventoryItem.restaurant?._id?.toString() ??
                    inventoryItem.restaurant?.toString()

                if (inventoryRestaurantId !== restaurantId) 
                    throw ApiError.notFound("Inventory item not found")
                if (inventoryItem.status !== "ACTIVE") 
                    throw ApiError.conflict(`Inventory item "${inventoryItem.name}" is inactive`)

                // Inventory ledger calculation. || Compute floating-point safe mathematical sums
                const previousQuantity = inventoryItem.currentQuantity || 0
                const rawResultingQuantity = previousQuantity + receivedItem.receivedQuantity
                const resultingQuantity = Math.round(rawResultingQuantity * 100) / 100

                // Update inventory || Commit balanced ledger counts down to inventory collections
                await updateInventoryItemById(
                    receivedItem.inventoryId,
                    { currentQuantity: resultingQuantity },
                    session
                )

                /*
                 * Create immutable inventory ledger entry.
                 *
                 * We use the cost stored on the PO,
                 * because that represents the agreed
                 * purchase cost for this stock.
                 */
                await createInventoryTransaction(
                    {
                        restaurant: restaurantId,
                        inventory: receivedItem.inventoryId,
                        type: "STOCK_IN",
                        quantity: receivedItem.receivedQuantity,
                        previousQuantity,
                        resultingQuantity,
                        costPerUnit: purchaseOrderItem.costPerUnit,
                        reason: `Stock received against purchase order ${currentPurchaseOrder.purchaseOrderNumber}`,
                        performedBy
                    },
                    session
                )

                // Update the PO item's cumulative received quantity
                purchaseOrderItem.receivedQuantity = alreadyReceived + receivedItem.receivedQuantity
            }
            // Determine resulting purchase order terminal state transition targets
            const allItemsReceived = currentPurchaseOrder.items.every(
                (item) => item.receivedQuantity >= item.quantity
            )
            const newStatus = allItemsReceived ? "RECEIVED" : "PARTIALLY_RECEIVED"

            const updateData = {
                items: currentPurchaseOrder.items,
                status: newStatus
            }
            if (newStatus === "RECEIVED") updateData.receivedAt = new Date()
            
            const result = await updatePurchaseOrderById(purchaseOrderId, updateData, session)
            updatedPurchaseOrder = Array.isArray(result) ? result[0] : result
            if (!updatedPurchaseOrder) throw ApiError.notFound("Purchase order not found")
        })

        return updatedPurchaseOrder
    } catch (error) {
        if (error instanceof ApiError) throw error
        throw ApiError.internal("Failed to receive purchase order due to a database error", error)
    } finally {
        await session.endSession()
    }
}
