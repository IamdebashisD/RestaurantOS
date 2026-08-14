import ApiError from "../utils/api-error.js";

export function requiredRole(...allowedRoles) {
    return function(req, res, next) {
        try {
            const membership = req.restaurantMembership
            if (!membership) throw ApiError.forbidden("Restaurant membership is required")
            
            if (!allowedRoles.includes(membership.role)) 
                throw ApiError.forbidden("You do not have permission to perform this action")

            next()
        } catch (error) {
            next(error)
        }
    } 
}