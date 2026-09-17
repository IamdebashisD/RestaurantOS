import mongoose from 'mongoose'

const inventoryTransactionSchema  = new mongoose.Schema(
    {
        restaurant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Restaurant",
            required: true,
        },

        inventory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Inventory",
            required: true,
        },

        type: {
            type: String,
            enum: [
                "STOCK_IN",
                "STOCK_OUT",
                "WASTAGE",
                "ADJUSTMENT",
            ],
            required: true,
        },

        quantity:  {
            type: Number,
            required: true,
            min: [0, "Transaction quantity cannot be negative"],
        },

        previousQuantity: {
            type: Number,
            required: true,
            min: [0, "Previous quantity cannot be negative"],
        },

        resultingQuantity: {
            type: Number,
            required: true,
            min: [0, "Resulting quantity cannot be negative"],
        },

        costPerUnit: {
            type: Number,
            required: true,
            min: [0, "Cost per unit cannot be negative"],
        },

        reason: {
            type: String,
            trim: true,
            maxLength: [
                500,
                "Transaction reason cannot exceed 500 characters"
            ],
            default: null
        },

        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true
    }
)

inventoryTransactionSchema.index({
    restaurant: 1,
    inventory: 1,
    createdAt: -1
})

inventoryTransactionSchema.index({
    restaurant: 1,
    type: 1,
    createdAt: -1
})

export const InventoryTransaction = mongoose.model("InventoryTransaction", inventoryTransactionSchema)
