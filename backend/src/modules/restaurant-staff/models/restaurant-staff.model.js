import mongoose, { mongo } from "mongoose";

const restaurantStaffSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        restaurant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Restaurant",
            required: true,
        },
        
        role: {
            type: String,
            enum: [
                "OWNER",
                "MANAGER",
                "CASHIER",
                "KITCHEN_STAFF",
                "WAITER",
            ],
            required: true
        },

        status: {
            type: String,
            enum: ["ACTIVE", "INACTIVE"],
            default: "ACTIVE"
        }
    },
    {
        timestamps: true
    }
)

/**
 * ============================================================================================
 * | Why the compound unique index?                                                           |
 * |                                                                                          |
 * | prevents the same user from accidentally having two memberships in the same restaurant.  |
 * |                                                                                          |
 * | So this is allowed:                                                                      |
 * |  User A → Restaurant 1                                                                   |
 * |  User A → Restaurant 2                                                                   |
 * |------------------------------                                                            |
 * | but this is not:                                                                         |
 * |  User A → Restaurant 1                                                                   |
 * |  User A → Restaurant 1 ❌                                                                |
 * ============================================================================================
 */

restaurantStaffSchema.index(
    { user: 1, restaurant: 1 },
    { unique: true }
)

export const RestaurantStaff = mongoose.model("RestaurantStaff", restaurantStaffSchema)