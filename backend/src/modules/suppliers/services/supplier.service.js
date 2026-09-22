import ApiError from "../../../utils/api-error.js"
import { findRestaurantById } from "../../restaurants/repositories/restaurant.repository.js"

import {
    createSupplier,
    findSupplierByName,
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
