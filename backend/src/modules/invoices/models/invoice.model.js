import mongoose from "mongoose"

const invoiceItemSchema = new mongoose.Schema(
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
            },

        },

        subtotal: {
            type: Number,
            required: true,
            min: [0, "Item Subtotal cannot be negative"],
        },
    },
    { _id: false }
)

const invoiceSchema = new mongoose.Schema(
    {
        invoiceNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        restaurant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Restaurant",
            required: true,
        },

        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            required: true,
            unique: true
        },

        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        table: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "RestaurantTable",
            required: true,
        },

        items: {
            type: [invoiceItemSchema],
            required: true,
            validate: {
                validator: (items) => Array.isArray(items) && items.length > 0,
                message: "Invoice must contain at least one item",
            },
        },

        subtotal: {
            type: Number,
            required: true,
            min: [0, "Subtotal cannot be negative"],
        },

        discount: {
            type: Number,
            required: true,
            min: [0, "Discount cannot be negative"],
            default: 0,
        },

        tax: {
            type: Number,
            required: true,
            min: [0, "Tax cannot be negative"],
            default: 0,
        },

        serviceCharge: {
            type: Number,
            required: true,
            min: [0, "Service charge cannot be negative"],
            default: 0,
        },

        totalAmount: {
            type: Number,
            required: true,
            min: [0, "Total amount cannot be negative"],
        },

        status: {
            type: String,
            enum: [
                "ISSUED",
                "PAID",
                "CANCELLED",
                "REFUNDED",
            ],
            default: "ISSUED",
            required: true,
        },

        issuedAt: {
            type: Date,
            default: Date.now,
        },

        paidAt: {
            type: Date,
            default: null,
        },
    },

    { 
        timestamps: true 
    }
)

// One invoice per order
invoiceSchema.index({ restaurant: 1, order: 1 }, { unique: true })
// Restaurant invoice history
invoiceSchema.index({ restaurant: 1, createdAt: -1 })
// Customer invoice history
invoiceSchema.index({ customer: 1, createdAt: -1 })


export const Invoice = mongoose.model("Invoice", invoiceSchema)