import mongoose from "mongoose"

const notificationSchema = new mongoose.Schema(
    {
        restaurant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Restaurant",
            required: true,
        },

        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        type: {
            type: String,
            enum: [
                "LOW_STOCK",
                "ORDER_STATUS_CHANGED",
                "RESERVATION_CREATED",
                "RESERVATION_CANCELLED",
                "PAYMENT_COMPLETED",
                "PAYMENT_FAILED",
                "PURCHASE_ORDER_ORDERED",
                "PURCHASE_ORDER_RECEIVED",
                "PURCHASE_ORDER_CANCELLED",
            ],
            required: true,
        },

        title: {
            type: String,
            required: true,
            trim: true,
            maxLength: 150,
        },

        message: {
            type: String,
            required: true,
            trim: true,
            maxLength: 500,
        },

        isRead: {
            type: Boolean,
            default: false,
        },
        
        readAt: {
            type: Date,
            default: null,
        },
        
        data: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },
    },
    {
        timestamps: true
    }
)

notificationSchema.index({
    restaurant: 1,
    recipient: 1,
    isRead: 1,
    createdAt: -1,
})

notificationSchema.index({
    restaurant: 1,
    createdAt: -1,
})

export const Notification = mongoose.model("Notification", notificationSchema)
