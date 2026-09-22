import mongoose from "mongoose"

const supplierSchema = new mongoose.Schema(
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
            minLength: [2, "Supplier name must be at least 2 characters"],
            maxLength: [150, "Supplier name cannot exceed 150 characters"],
        },

        contactPerson: {
            type: String,
            trim: true,
            maxLength: [
                100,
                "Contact person name cannot exceed 100 characters"
            ],
            default: "",
        },

        phone: {
            type: String,
            trim: true,
            maxLength: [20, "Phone number cannot exceed 20 characters"],
            default: "",
        },

        email: {
            type: String,
            lowercase: true,
            trim: true,
            maxLength: [150, "Email cannot exceed 150 characters"],
            default: "",
        },

        address: {
            type: String,
            trim: true,
            maxLength: [300, "Supplier address cannot exceed 300 characters"],
            default: "",
        },

        notes: {
            type: String,
            trim: true,
            maxLength: [500, "Supplier notes cannot exceed 500 characters"],
            default: "",
        },
        
        status: {
            type: String,
            enum: ["ACTIVE", "INACTIVE"],
            default: "ACTIVE",
            required: true,
        }
    },
    {
        timestamps: true
    }
)
// Prevent duplicate supplier names within the exact same restaurant context
supplierSchema.index({ restaurant: 1, name: 1 }, { unique: true })
// Optimize filtered list lookup strategies for status matching
supplierSchema.index({ restaurant: 1, status: 1 })

export const Supplier = mongoose.model("Supplier", supplierSchema)
