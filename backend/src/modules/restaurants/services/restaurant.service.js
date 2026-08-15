import mongoose from "mongoose"
import {
    createRestaurant, 
    findRestaurantBySlug,
    findRestaurantById,
    updateRestaurantById,
    deactivateRestaurantById
} from "../repositories/restaurant.repository.js"

import { createRestaurantMembership } from "../../restaurant-staff/repositories/restaurant-staff.repository.js"
import ApiError from "../../../utils/api-error.js"


export async function createRestaurantService({
    userId,
    name,
    slug,
    description,
    phone,
    email,
    address,
}) {
    const session = await mongoose.startSession()

    try {
        let restaurant

        await session.withTransaction(async () => {
            const existingRestaurant = await findRestaurantBySlug(slug, session)
            if (existingRestaurant) throw ApiError.conflict("A restaurant with this slug already exists")

            restaurant = await createRestaurant(
                { name, slug, description, phone, email, address, createdBy: userId }, 
                session
            )

            await createRestaurantMembership(
                {
                    user: userId,
                    restaurant: restaurant._id,
                    role: "OWNER"
                },
                session
            )
        })

        return restaurant 

    } catch (error) {
        console.error("Failed to create restaurant:", error)
        throw error
    } finally {
        await session.endSession()
    }
}

export async function getRestaurantByIdService(restaurantId) {
    const restaurant = await findRestaurantById(restaurantId)
    if (!restaurant) throw ApiError.notFound("Restaurant not found")

    return restaurant
}

export async function updateRestaurantService(restaurantId, updateData) {
    const restaurant = await updateRestaurantById(restaurantId, updateData)
    if (!restaurant) throw ApiError.notFound("Restaurant not found")
        
    return restaurant
}

export async function deactivateRestaurantService(restaurantId) {
    const restaurant = await deactivateRestaurantById(restaurantId)
    if (!restaurant) throw ApiError.notFound("Restaurant not found")

    return restaurant
}