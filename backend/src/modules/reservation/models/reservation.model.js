import mongoose from "mongoose"

const reservationSchema = new mongoose.Schema(
    {
        restaurant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Restaurant",
            required: true
        },
        table: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "RestaurantTable",
            required: true
        },
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        date: {
            type: Date,
            required: true,
            trim: true
        },
        startTime: {
            type: String,
            required: true,
            trim: true
        },
        endTime: {
            type: String,
            required: true
        },
        guests: {
            type: Number,
            required: true,
            min: 1
        },
        status: {
            type: String,
            enum: [
                "PENDING",
                "CONFIRMED",
                "CANCELLED",
                "COMPLETED"
            ],
            default: "PENDING"
        },
    },
    {
        timestamps: true
    }
)

reservationSchema.index({ restaurant: 1, table: 1, date: 1 })

export const Reservation = mongoose.model("Reservation", reservationSchema)