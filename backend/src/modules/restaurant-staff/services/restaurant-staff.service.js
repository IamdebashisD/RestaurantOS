import mongoose from "mongoose";

import ApiError from "../../../utils/api-error.js";

import { findUserByEmail } from "../../users/repositories/user.repositories.js"
import { 
    findMembershipByUserAndRestaurant,
    createRestaurantMembership,
    findMembershipsByRestaurant,
    findMembershipById,
    updateMembershipById
} from "../repositories/restaurant-staff.repository.js"


export async function addRestaurantStaffService({ restaurantId, email, role }) {
    const session = await mongoose.startSession()

    try {
        let membership

        await session.withTransaction(async () => {
            // Find the existing user
            const user = await findUserByEmail(email)
            if (!user) throw ApiError.notFound("No user account exists with this email")

            // Check whether the user is already a member
            const existingMembership = await findMembershipByUserAndRestaurant( restaurantId, user._id, session )
            if (existingMembership) throw ApiError.conflict("User is already a member of this restaurant")

            // Create restaurant membership
            const staffData = {
                user: user._id,
                restaurant: restaurantId,
                role
            }
            membership = await createRestaurantMembership(staffData, session)
        })

        return membership

    } catch(error) {
        if (error?.code === 11000) {
            throw ApiError.conflict("User is already a member of this restaurant")
        }
        throw error
        
    } finally {
        await session.endSession()
    }
}

export async function getRestaurantStaffService(restaurantId) {
    return findMembershipsByRestaurant(restaurantId)
}

import { countActiveOwnersByRestaurant } from "../repositories/restaurant-staff.repository.js";
export async function updateRestaurantStaffService({ restaurantId, staffId, role, status }) {
    const membership = await findMembershipById(staffId)

    if (!membership) throw ApiError.notFound("Staff membership not found")
    if (membership.restaurant.toString() !== restaurantId) throw ApiError.notFound("Staff membership not found")
    
    if (
        membership.role === "OWNER" &&
        membership.status === "ACTIVE" && 
        role !== undefined && 
        role !== "OWNER" &&
        status !== undefined &&
        status === "INACTIVE"
    ) {
        const ownerCount = await countActiveOwnersByRestaurant(restaurantId)
        if(ownerCount <= 1) throw ApiError.conflict("Restaurant must have at least one active owner")
    }

    const updateData = {}

    if (role !== undefined) updateData.role = role
    if (status !== undefined) updateData.status = status

    const updatedMembership = await updateMembershipById(staffId, updateData)

    return updatedMembership
}

export async function getRestaurantStaffByIdService({ restaurantId, staffId }) {
    const membership = await findMembershipById(staffId)
    if (!membership) throw ApiError.notFound("Staff membership not found")
        
    if (membership.restaurant.toString() !== restaurantId) 
        throw ApiError.notFound("Staff memebership not found")

    return membership
}

export async function removeRestaurantStaffService({ restaurantId, staffId }) {
    const membership = await findMembershipById(staffId)

    if (!membership) throw ApiError.notFound("Staff membership not found")
    if (membership.restaurant.toString() !== restaurantId) throw ApiError.notFound("Staff membership not found")
    
    if (membership.role === "OWNER" && membership.status === "ACTIVE") {
        const countOwner = await countActiveOwnersByRestaurant(restaurantId)
        if (countOwner <= 1) throw ApiError.conflict("Restaurant must have at least one active owner")
    }

    const updateMembership = await updateMembershipById(staffId, { status: "INACTIVE" })
    return updateMembership
}

