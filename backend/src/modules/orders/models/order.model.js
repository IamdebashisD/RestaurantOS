import mongoose from "mongoose"

const orderItemSchema = new mongoose.Schema(
    {
        menuItem: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "MenuItem",
            required: true,
        },

        name: {
            type: String,
            required: true,
            trim: true,
        },

        price: {
            type: Number,
            required: true,
            min: [0, "Item price cannot be negative"],
        },

        quantity: {
            type: Number,
            required: true,
            min: [1, "Quantity must be at least 1"],
            validate: {
                validator: Number.isInteger,
                message: "Quantity must be a whole number",
            }

        },

        subtotal: {
            type: Number,
            required: true,
            min: [0, "Subtotal cannot be negative"],
        },
    },
    { _id: false }
)

const orderSchema = new mongoose.Schema(
    {
        restaurant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Restaurant",
            required: true,
        },

        table: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "RestaurantTable",
            required: true,
        },

        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        items: {
            type: [orderItemSchema],
            required: true,
            validate: {
                validator: (items) => Array.isArray(items) && items.length > 0,
                message: "Order must contain at least one item",
            },
        },

        totalAmount: {
            type: Number,
            required: true,
            min: [0, "Total amount cannot be negative"],
        },

        paymentStatus: {
            type: String,
            enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
            default: "PENDING",
            required: true,
        },

        status: {
            type: String,
            enum: [
                "PENDING",
                "CONFIRMED",
                "PREPARING",
                "READY",
                "SERVED",
                "COMPLETED",
                "CANCELLED",
            ],
            default: "PENDING",
            required: true,
        },

        notes: {
            type: String,
            trim: true,
            maxLength: [500, "Notes cannot exceed 500 characters"],
            default: "",
        },
    },
    {
        timestamps: true
    }
)

orderSchema.index({ restaurant: 1, createdAt: -1 })
orderSchema.index({ table: 1, status: 1 })
orderSchema.index({ customer: 1, createdAt: -1 })

export const Order = mongoose.model("Order", orderSchema)
