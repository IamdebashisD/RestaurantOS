import mongoose from "mongoose"
import ApiError from "../../../utils/api-error.js"

import { findRestaurantById } from "../../restaurants/repositories/restaurant.repository.js"
import { findSupplierById } from "../../suppliers/repositories/supplier.repository.js"
import { findInventoryItemById } from "../../inventory/repositories/inventory.repository.js"

import {
    createPurchaseOrder,
    findPurchaseOrderByNumber,
    findPurchaseOrdersByRestaurant,
    countPurchaseOrdersByRestaurant,
    findPurchaseOrderById,
    updatePurchaseOrderById,
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
