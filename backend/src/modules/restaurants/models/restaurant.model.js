import mongoose from "mongoose";

const restaurantSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minLength: 2,
            maxLength: 150,
        },

        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            minLength: 2,
            maxLength: 150,
        },

        description: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: "",
        },

        phone: {
            type: String,
            trim: true,
            maxlength: 20,
            default: "",
        },

        email: {
            type: String,
            lowercase: true,
            trim: true,
            default: "",
        },

        address: {
            street: {
                type: String,
                trim: true,
                maxlength: 200,
                default: "",
            },
            city: {
                type: String,
                trim: true,
                maxlength: 100,
                default: "",
            },
            state: {
                type: String,
                trim: true,
                maxlength: 100,
                default: "",
            },
            postalCode: {
                type: String,
                trim: true,
                maxlength: 20,
                default: "",
            },
            country: {
                type: String,
                trim: true,
                maxlength: 100,
                default: "India",
            }
        },

        status: {
            type: String,
            enum: ["ACTIVE", "INACTIVE", "SUSPENDED"],
            default: "ACTIVE",
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        }
    },
    {
        timestamps: true
    }
)

export const Restaurant = mongoose.model("Restaurant", restaurantSchema)