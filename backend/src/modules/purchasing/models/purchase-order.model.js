import mongoose from "mongoose"

const purchaseOrderItemSchema = new mongoose.Schema(
    {
        inventory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Inventory",
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        unit: {
            type: String,
            enum: ["KG", "G", "L", "ML", "PCS"],
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: [
                0.01,
                "Purchase quantity must be greater than zero"
            ],
        },
        receivedQuantity: {
            type: Number,
            required: true,
            min: [
                0,
                "Received quantity cannot be negative"
            ],
            default: 0,
        },
        costPerUnit: {
            type: Number,
            required: true,
            min: [
                0,
                "Cost per unit cannot be negative"
            ],
        },
        subtotal: {
            type: Number,
            required: true,
            min: [
                0,
                "Item subtotal cannot be negative"
            ],
        },
    },
    {
        _id: false
    }
)

const purchaseOrderSchema = new mongoose.Schema(
    {
        restaurant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Restaurant",
            required: true,
        },
        supplier: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Supplier",
            required: true,
        },
        purchaseOrderNumber: {
            type: String,
            required: true,
            trim: true,
        },
        items: {
            type: [purchaseOrderItemSchema],
            required: true,
            validate: {
                validator: (items) => 
                    Array.isArray(items) && items.length > 0,
                message: "Purchase order must contain at least one item" 
            }
        },
        subtotal: {
            type: Number,
            required: true,
            min: [
                0,
                "Purchase order subtotal cannot be negative"
            ],
        },
        tax: {
            type: Number,
            required: true,
            min: [
                0,
                "Purchase order tax cannot be negative"
            ],
            default: 0,
        },
        totalAmount: {
            type: Number,
            required: true,
            min: [
                0,
                "Purchase order total cannot be negative"
            ],
        },
        status: {
            type: String,
            enum: [
                "DRAFT",
                "ORDERED",
                "PARTIALLY_RECEIVED",
                "RECEIVED",
                "CANCELLED",
            ],
            required: true,
            default: "DRAFT",
        },
        expectedDeliveryDate: {
            type: Date,
            default: null,
        },
        orderedAt: {
            type: Date,
            default: null,
        },
        receivedAt: {
            type: Date,
            default: null,
        },
        notes: {
            type: String,
            trim: true,
            maxLength: [
                500,
                "Purchase order notes cannot exceed 500 characters"
            ],
            default: "",
        }
    },
    { 
        timestamps: true 
    }
)

purchaseOrderSchema.index(
    { restaurant: 1, purchaseOrderNumber: 1 }, 
    { unique: true }
)
purchaseOrderSchema.index(
    { restaurant: 1, status: 1, createdAt: -1 }
)
purchaseOrderSchema.index(
    { supplier: 1, createdAt: -1 }
)

export const PurchaseOrder = mongoose.model(
    "PurchaseOrder", 
    purchaseOrderSchema
)
