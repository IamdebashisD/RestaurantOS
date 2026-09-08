import mongoose from "mongoose"

const paymentSchema = new mongoose.Schema(
    {
        paymentNumber: {
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

        invoice: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Invoice",
            required: true,
        },

        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            required: true,
        },

        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        amount: {
            type: Number,
            required: true,
            min: [0, "Payment amount cannot be negative"],
        },

        method: {
            type: String,
            enum: [
                "CASH",
                "CARD",
                "UPI",
                "NET_BANKING",
                "WALLET",
                "OTHER",
            ],
            required: true,
        },

        status: {
            type: String,
            enum: [
                "PENDING",
                "COMPLETED",
                "FAILED",
                "REFUNDED",
            ],
            default: "PENDING",
            required: true,
        },

        transactionId: {
            type: String,
            trim: true,
            default: null,
        },

        paidAt: {
            type: Date,
            default: null,
        },

        refundedAt: {
            type: Date,
            default: null,
        },

        gatewayMetadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        }
    },
    {
        timestamps: true
    }
)

// Restaurant payment history
paymentSchema.index({ restaurant: 1, createdAt: -1 })
// Invoice payment lookup
paymentSchema.index({ invoice: 1, createdAt: -1 })
// Order payment lookup
paymentSchema.index({ order: 1, createdAt: -1 })
// Customer payment history
paymentSchema.index({ customer: 1, createdAt: -1 })
// Allow lookups by external provider tracking ids
paymentSchema.index(
    { transactionId: 1 }, 
    { unique: true, sparse: true }
)

export const Payment = mongoose.model("Payment", paymentSchema)
