import mongoose from 'mongoose'

const refreshTokenSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        token: {
            type: String,
            required: true,
            unique: true,
        },
        expiresAt: {
            type: Date,
            required: true,
        },
    },
    {
        timestamps: true
    }
)

// Automatically delete the document from MongoDB the exact millisecond it expires!
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
refreshTokenSchema.index({ user: 1 })

export const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema)
