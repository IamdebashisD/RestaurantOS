import crypto from "crypto"
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
import { 
    saveVerificationToken, 
    findVerificationToken,
    deleteVerificationTokenByToken,
} from "../repositories/email-verification.repository.js"

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

    // Generate a cryptographically secure 32-byte hex token string
    const verificationToken = crypto.randomBytes(32).toString("hex")
    const fifteenMinutesInMS = 1000 * 60 * 15
    const expiresAt = new Date(Date.now() + fifteenMinutesInMS)

    // Persist verification token string down to the database ledger
    await saveVerificationToken({ 
        userId: user._id, 
        token: verificationToken, 
        expiresAt 
    })

    // TODO: 📧 PLATFORM LOGISTICS PLUG: Send verification email here
    // try {
        
    // } catch (error) {
    //     console.error("Email sending failed:", err)
    // }

    console.log(
        `✉️ [Email Verification Generated] Link: 
        http://localhost:9000/api/v1/auth/verify-email?token=${verificationToken}`
    )

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

/**
 * Validates verification tokens and upgrades target user verification states
 * @param {Object} params
 * @param {string} params.token
 * @returns {Promise<void>}
 */
export async function verifyEmailService({ token }) {
    if (!token) throw ApiError.badRequest("Verification token is required")
    
    const verificationDoc = await findVerificationToken(token)
    if (!verificationDoc) 
        throw ApiError.badRequest("Invalid or expired verification token link")

    const user = verificationDoc.user
    if (!user) throw ApiError.notFound("User associated with this token no longer exists")
    if (user.isEmailVerified) {
        await deleteVerificationTokenByToken(token)
        return
    }
    // Atomic Toggle: Shift the boolean status state flag directly on the User document
    user.isEmailVerified = true
    await user.save({ validateModifiedOnly: true })

    // Invalidate the token immediately so it can never be intercepted or reused
    await deleteVerificationTokenByToken(token)
}

/**
 * Generates a brand new 15-minute verification token mapping for an unverified logged-in user
 * @param {Object} params
 * @param {string} params.userId - Extracted user identifier string
 * @returns {Promise<void>}
 */
export async function resendVerificationEmailService({ userId }) {
    const user = await findUserById(userId)
    if (!user) throw ApiError.notFound("User account no longer exists")
    if (user.isEmailVerified) throw ApiError.badRequest("Your email address is already verified")
    
    const freshVerificationToken = crypto.randomBytes(32).toString("hex")
    const fifteenMinutesInMs = 1000 * 60 * 15
    const expiresAt = new Date(Date.now() + fifteenMinutesInMs)

    // Overwrite the old expired token document cleanly via your Upsert repository function
    await saveVerificationToken({
        userId: user._id,
        token: freshVerificationToken,
        expiresAt
    })
    console.log(
        `✉️ [FRESH Email Verification Link Dispatched]: 
        http://localhost:9000/api/v1/auth/verify-email?token=${freshVerificationToken}`
    )
}
