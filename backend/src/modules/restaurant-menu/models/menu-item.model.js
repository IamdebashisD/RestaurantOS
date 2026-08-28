import mongoose from "mongoose"

const menuItemSchema = new mongoose.Schema(
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
            minLength: 2,
            maxLength: 150,
        },

        description: {
            type: String,
            trim: true,
            maxLength: 1000,
            default: "",
        },

        price: {
            type: Number,
            required: true,
            min: 0,
        },

        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "MenuCategory",
            required: true,
        },

        image: {
            type: String,
            trim: true,
            default: "",
        },

        isAvailable: {
            type: Boolean,
            default: true,
        },

    },
    { timestamps: true }
)

menuItemSchema.index({ restaurant: 1, name: 1 })

export const MenuItem = mongoose.model("MenuItem", menuItemSchema)
