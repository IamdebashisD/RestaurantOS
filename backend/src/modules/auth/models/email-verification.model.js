import mongoose from "mongoose"

const emailVerificationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true, // Guarantees a user can only have one active verification link at a time
        },
        token: {
            type: String,
            required: true,
            unique: true,
        },
        expiresAt: {
            type: Date,
            required: true,
        }
    },
    { timestamps: true }
)

// ⚡ Principal Move: Automatically purges expired token documents from the DB instantly!
emailVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const EmailVerification = mongoose.model(
    "EmailVerification", 
    emailVerificationSchema
)
