import ApiError from "../../../utils/api-error.js"
import { findUserById } from "../repositories/user.repositories.js"
import { RestaurantStaff } from "../../restaurant-staff/models/restaurant-staff.model.js"
import { findMembershipById } from "../../restaurant-staff/repositories/restaurant-staff.repository.js"


export async function getUserProfileService({ userId }) {
    const user = await findUserById(userId)
    if (!user) throw ApiError.notFound("User identity record not found")

    const staffMembership = await RestaurantStaff.findOne({ user: userId, status: "ACTIVE" }).populate("restaurant")
    
    return {
        id: user._id,
        name: user.name,
        email: user.email,
        role: staffMembership ? staffMembership.role : null,
        restaurantId: staffMembership ? staffMembership.restaurant._id : null,
        restaurantName: staffMembership ? staffMembership.restaurant.name : null
    }
}

