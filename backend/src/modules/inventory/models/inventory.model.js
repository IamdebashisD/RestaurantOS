import mongoose from "mongoose"

const inventorySchema = new mongoose.Schema(
    {
        restaurant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Restaurant",
            required: true,
        },

        name: {
            type: String,
            required: true,
            trim: true,
            minLength: [2, "Item name must be at least 2 characters"],
            maxLength: [150, "Item name cannot exceed 150 characters"],
        },

        unit: {
            type: String,
            enum: {
                values: ["KG", "G", "L", "ML", "PCS",],
                message: "{VALUE} is not a supported inventory unit type"
            },
            required: true,
        },

        currentQuantity: {
            type: Number,
            required: true,
            min: [0, "Inventory quantity cannot be negative"],
            default: 0,
        },

        minimumQuantity: {
            type: Number,
            required: true,
            min: [0, "Minimum quantity cannot be negative"],
            default: 0,
        },

        costPerUnit: {
            type: Number,
            required: true,
            min: [0, "Cost per unit cannot be negative"],
            default: 0,
        },

        status: {
            type: String,
            enum: ["ACTIVE", "INACTIVE"],
            default: "ACTIVE",
            required: true,
        },
    },
    {
        timestamps: true,
    }
)

inventorySchema.index({ restaurant: 1, name: 1, }, { unique: true, })

inventorySchema.index({ restaurant: 1, status: 1, currentQuantity: 1 })

export const Inventory = mongoose.model("Inventory", inventorySchema)
