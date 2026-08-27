import mongoose from "mongoose";

const menuCategorySchema = new mongoose.Schema(
    {
        restaurant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Restaurant",
            required: true
        },

        name: {
            type: String,
            required: true,
            trim: true,
            minLength: 2,
            maxLength: 100
        },

        description: {
            type: String,
            trim: true,
            maxLength: 500,
            default: ""
        },

        displayOrder: {
            type: Number,
            min: 0,
            default: 0
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
)


menuCategorySchema.index({ restaurant: 1, name: 1 }, { unique: true })
export const MenuCategory = mongoose.model("MenuCategory", menuCategorySchema)
