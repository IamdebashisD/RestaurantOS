import { PasswordReset } from "../models/password-reset.model.js"

export async function saveResetToken({ userId, token, expiresAt }) {
    return PasswordReset.findOneAndUpdate(
        { user: userId },
        { token, expiresAt },
        { returnDocument: "after", upsert: true }
    ).exec()
}

export async function findResetToken(token) {
    return PasswordReset.findOne({ token }).populate("user").exec()
}

export async function deleteResetTokenByToken(token) {
    return PasswordReset.deleteOne({ token }).exec()
}
