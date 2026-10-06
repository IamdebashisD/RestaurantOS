import ApiError from '../../../utils/api-error.js'
import { signToken } from '../../../utils/token.js'
import { 
    createUser, 
    findUserByEmail, 
    findUserById,
    findUserByEmailWithPassword,  
} from '../../users/repositories/user.repositories.js'

import { 
    generateAccessToken, 
    generateRefreshToken, 
    verifyRefreshToken 
} from '../../../utils/token.js'
import { findRefreshToken } from "../repositories/refresh-token.repository.js"

// Strips formatting logs out of active user schema structures for client consumption
function toPublishUser(user) {
    return {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
    }
}

export async function signupService({ name, email, password }) {
    const existingUser = await findUserByEmail(email)
    if (existingUser) throw ApiError.conflict("An account with this email already exists")

    const user = await createUser({ name, email, password })

    const token = signToken({ id: user._id })
    return { user: toPublishUser(user), token }
}

export async function signinService({ email, password }) {
    const user = await findUserByEmailWithPassword(email)

    if (!user) throw ApiError.unauthorized("Invalid email or password")
    if (!user.isActive) throw ApiError.unauthorized("Account is inactive")

    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) throw ApiError.unauthorized("Invalid email or password")

    user.lastLoginAt = new Date()
    await user.save({ validateModifiedOnly: true })

    // Token generation
    const accessToken = generateAccessToken({ id: user._id })
    const refreshToken = generateRefreshToken({ id: user._id })

    return { 
        user: toPublishUser(user), 
        token: accessToken, 
        refreshToken
    }
}

// export async function getProfileService(userId) {
//     const user = await findUserById(userId)
//     if (!user) throw ApiError.notFound("User not found")

//     return { user: toPublishUser(user) }
// }

/**
 * 🔄 Silent Refresh Service
 * Evaluates raw refresh token signatures and returns a brand new 1-hour access token path.
 * 
 * @param {Object} params
 * @param {string} params.refreshToken - Outbound long-lived token context signature mapping
 * @returns {Promise<Object>} Cleaned identity metadata records and fresh access token string keys
 */
export async function handleSilentRefreshService({ refreshToken }) {
    if (!refreshToken) throw ApiError.unauthorized("Refresh token missing")
    
    let payload
    try {
        payload = verifyRefreshToken(refreshToken)
    } catch (error) {
        throw ApiError.unauthorized("Invalid or expired refresh session")
    }

    // Query the datastore token collection ledger to prevent revoked session use cases
    const savedTokenDoc = await findRefreshToken(refreshToken)
    if (!savedTokenDoc || !savedTokenDoc.user) {
        throw ApiError.unauthorized("Session has been revoked or expired")
    }
    if (!savedTokenDoc.user.isActive) {
        throw ApiError.unauthorized("User account associated with this session is inactive")
    }

    // Mint a fresh short-lived 1-hour Access Token string signature safely
    const newAccessToken = generateAccessToken({ id: savedTokenDoc.user._id })

    return {
        newAccessToken,
        user: toPublishUser(savedTokenDoc.user)
    }
}
