import ApiError from "../utils/api-error.js"
import { findMembershipByUserAndRestaurant } from "../modules/restaurant-staff/repositories/restaurant-staff.repository.js"


export async function requireRestaurantAccess(req, res, next) {
    try {
        const userId = req.user.id
        const restaurantId = req.params.restaurantId

        if (!restaurantId) throw ApiError.badRequest("Restaurant ID is required")

        const membership = await findMembershipByUserAndRestaurant(userId, restaurantId)
        if (!membership) throw ApiError.forbidden("You do not have access to this restaurant")
        
        req.restaurantMembership = membership
        next()
    } catch (error) {
        next(error)
    }
}