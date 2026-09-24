import ApiError from "../../../utils/api-error.js"
import { findRestaurantById } from "../../restaurants/repositories/restaurant.repository.js"

import {
    createSupplier,
    findSupplierByName,
    findSuppliersByRestaurant,
    countSuppliersByRestaurant,
    findSupplierById,
    updateSupplierById,
} from "../repositories/supplier.repository.js"


/**
 * 1. Create a new supplier
 * Provisions a new Supplier record under a specific restaurant boundary
 * @param {Object} params
 * @param {string} params.restaurantId
 * @param {string} params.name
 * @param {string} [params.contactPerson]
 * @param {string} [params.phone]
 * @param {string} [params.email]
 * @param {string} [params.address]
 * @param {string} [params.notes]
 * @returns {Promise<Object>} The created supplier document
 */
export async function createSupplierService({ 
    restaurantId,
    name,
    contactPerson,
    phone,
    email,
    address,
    notes
}) {
    const restaurant = await findRestaurantById(restaurantId)
    if (!restaurant) throw ApiError.notFound("Restaurant not found")
    
    const normalizedName = name.trim()
    const existingSupplier = await findSupplierByName(restaurantId, normalizedName)
    if (existingSupplier) {
        throw ApiError.conflict(
            `A supplier with the name "${normalizedName}" already exists in this restaurant`
        )
    }

    // supplier data
    const supplierData = {
        restaurant: restaurantId,
        name: normalizedName,
        contactPerson: contactPerson?.trim() || "",
        phone: phone?.trim() || "",
        email: email?.trim().toLowerCase() || "",
        address: address?.trim() || "",
        notes: notes?.trim() || "",
        status: "ACTIVE"
    }
    try {

        return await createSupplier(supplierData)

    } catch (error) {
        if (error instanceof ApiError) throw error
        if (error.code === 11000) {
            throw ApiError.conflict(
                `A supplier with the name "${normalizedName}" already exists in this restaurant`
            )
        }
        throw ApiError.internal(
            "Failed to create supplier due to a database error",
            error
        )
    }
}

/**
 * 2. Get all suppliers for a restaurant
 * Retrieves a paginated list of suppliers for a specific restaurant
 * @param {Object} params
 * @param {string} params.restaurantId
 * @param {number|string} [params.page]
 * @param {number|string} [params.limit]
 * @param {string} [params.status]
 * @param {string} [params.search]
 * @returns {Promise<Object>} The suppliers list and pagination metadata
 */
export async function getRestaurantSuppliersService({ 
    restaurantId, 
    page = 1 , 
    limit = 10, 
    status, 
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
        search: search?.trim() || ""
    }
    const options = { skip, limit: safeLimit } 

    const [suppliers, totalItems] = await Promise.all([
        findSuppliersByRestaurant(restaurantId, filters, options),
        countSuppliersByRestaurant(restaurantId, filters)
    ])

    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / safeLimit)

    return {
        suppliers,
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
 * 3. Get supplier by ID
 * Retrieves a single supplier by its identifier after verifying tenant isolation
 * @param {Object} params
 * @param {string} params.restaurantId
 * @param {string} params.supplierId
 * @returns {Promise<Object>} The verified supplier document
 */
export async function getSupplierByIdService({ restaurantId, supplierId }) {
    const supplier = await findSupplierById(supplierId)
    if (!supplier) throw ApiError.notFound("Supplier not found")
    const supplierRestaurantId = supplier.restaurant?._id?.toString() ?? supplier.restaurant?.toString()
    if (supplierRestaurantId !== restaurantId) throw ApiError.notFound("Supplier not found")
    return supplier
}

/**
 * Updates a single supplier record after validating tenant isolation and name collisions
 * @param {Object} params
 * @param {string} params.restaurantId
 * @param {string} params.supplierId
 * @param {Object} params.updateData
 * @returns {Promise<Object>} The updated supplier document
 */
export async function updateSupplierService({ restaurantId, supplierId, updateData }) {
    const supplier = await findSupplierById(supplierId)
    if (!supplier) throw ApiError.notFound("Supplier not found")

    const supplierRestaurantId = supplier.restaurant?._id?.toString() ?? supplier.restaurant?.toString()
    if (supplierRestaurantId !== restaurantId) throw ApiError.notFound("Supplier not found")
    
    const normalizedUpdateData = {}
    for (const [key, value] of Object.entries(updateData)) {
        if (value !== undefined) {
            normalizedUpdateData[key] = typeof value === "string" ? value.trim() : value
        }
    }
    
    if (normalizedUpdateData.email) {
        normalizedUpdateData.email = normalizedUpdateData.email.toLowerCase()
    }

    if (Object.keys(normalizedUpdateData).length === 0) {
        return supplier
    }

    if (
        normalizedUpdateData.name !== undefined &&
        normalizedUpdateData.name !== supplier.name
    ) {
        const existingSupplier = await findSupplierByName(restaurantId, normalizedUpdateData.name.trim())
        if (existingSupplier) {
            throw ApiError.conflict(
                `A supplier with the name "${normalizedUpdateData.name}" already exists in this restaurant`
            )
        }
    }
    try {
        const updatedSupplier = await updateSupplierById(supplierId, normalizedUpdateData)
        if (!updatedSupplier) throw ApiError.notFound("Supplier not found")
        return updatedSupplier
    } catch (error) {
        if (error instanceof ApiError) throw error
        if (error.code === 11000) {
            throw ApiError.conflict(
                `A supplier with the name ${normalizedUpdateData.name} already exists in the restaurant`
            )
        }
        throw ApiError.internal(
            "Failed to update supplier data due to database error",
            error
        )
    }
}
