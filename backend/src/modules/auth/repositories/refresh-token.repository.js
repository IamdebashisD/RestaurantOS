import { RefreshToken } from "../models/refresh-token.model.js"

export async function saveRefreshToken({ userId, token, expiresAt }) {
    return RefreshToken.create({ user: userId, token, expiresAt })
}

export async function findRefreshToken(token) {
    return RefreshToken.findOne({ token }).populate("user").exec()
}

export async function deleteRefreshTokenByToken(token) {
    return RefreshToken.deleteOne({ token }).exec()
}

export async function deleteAllRefreshTokensForUser(userId) {
    return RefreshToken.deleteMany({ user: userId }).exec()
}