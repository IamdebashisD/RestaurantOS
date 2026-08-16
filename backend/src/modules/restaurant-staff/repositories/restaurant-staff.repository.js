import { RestaurantStaff } from "../models/restaurant-staff.model.js";

export async function createRestaurantMembership(staffData, session) {
    return RestaurantStaff.create([staffData], { session }).then(([staffData]) => staffData)
}

export async function findMembershipByUserAndRestaurant(userId, restaurantId, session) {
    const query = RestaurantStaff.findOne({
        user: userId,
        restaurant: restaurantId
    })
    if (session) query.session(session)

    return query
}

export async function findMembershipById(staffId, session) {
    const query = RestaurantStaff.findById(staffId).populate("user", "name email")
    if (session) query.session(session)

    return query
}

export async function findMembershipsByRestaurant(restaurantId, session) {
    const query = RestaurantStaff
        .find({ restaurant: restaurantId })
        .populate("user", "name email")
        .populate("restaurant", "name slug description status")
        .sort({ createdAt: -1 })

    if (session) query.session(session)

    return query
}

export async function updateMembershipById(staffId, updateData, session) {
    const updateStaff = RestaurantStaff.findByIdAndUpdate(
        staffId, 
        updateData, 
        { 
            returnDocument: "after", 
            runValidators: true 
        }
    )
    if (session) updateStaff.session(session)
        
    return updateStaff
}

export async function countActiveOwnersByRestaurant(restaurantId, session) {
    const query = RestaurantStaff.countDocuments({ restaurant: restaurantId, role: "OWNER", status: "ACTIVE" })
    if (session) query.session(session)
    return query
}