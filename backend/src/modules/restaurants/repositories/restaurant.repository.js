import { Restaurant } from "../models/restaurant.model.js";

export async function createRestaurant(restaurantData, session) {
    return Restaurant.create([restaurantData], { session }).then(([restaurant]) => restaurant)
}

export async function findRestaurantById(restaurantId, session = null) {
    const query = Restaurant.findById(restaurantId)
    if (session) query.session(session)

    return query
}

export async function findRestaurantBySlug(slug, session = null) {
    const query = Restaurant.findOne({ slug })
    if (session) query.session(session)

    return query
}

export async function updateRestaurantById(restaurantId, updateData) {
    return Restaurant.findByIdAndUpdate(
        restaurantId, 
        updateData, 
        { 
            returnDocument: "after", 
            runValidators: true 
        }
    )
}

export async function deactivateRestaurantById(restaurantId) {
    return Restaurant.findByIdAndUpdate(
        restaurantId, 
        { 
            $set: { 
                status: "INACTIVE" 
            } 
        }, 
        { 
            returnDocument: "after", 
            runValidators: true 
        } 
    )
}