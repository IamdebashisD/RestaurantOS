import * as authService from "../services/auth.service.js"
import ApiResponse from '../../../utils/api-response.js'
import { catchAsync } from "../../../utils/catchAsync.js"
import { isProd } from "../../../config/env.js"
import { saveRefreshToken, deleteRefreshTokenByToken } from "../repositories/refresh-token.repository.js"


export const signupController = catchAsync(async (req, res, next) => {
    const registeredUser = await authService.signupService(req.body)

    return ApiResponse.created(res, {
        message: "Account created successfully",
        data: registeredUser
    })

})

export const signinController = catchAsync(async (req, res, next) => {
    const result = await authService.signinService(req.body)

    // Compute explicit expiration date for the database ledger tracking
    const sevenDaysInMs = 1000 * 60 * 60 * 24 * 7
    const refreshTokenExpiry = new Date(Date.now() + sevenDaysInMs)

    // 1. Persist the refresh token signature to the database
    await saveRefreshToken({
        userId: result.user.id,
        token: result.refreshToken,
        expiresAt: refreshTokenExpiry
    })

    // 2. Drop the short-lived 1-hour Access Token Cookie
    res.cookie("accessToken", result.token, {
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
        maxAge: 1000 * 60 * 60, // 1 hour
    })

    // 3. Drop the long-lived 7-day Refresh Token Cookie
    res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
        maxAge: sevenDaysInMs, // 7 days
    })

    return ApiResponse.success(res, {
        message: "Login successful",
        data: {
            user: result.user,
            token: result.token
        }
    })
})

/**
 * Express controller to safely clear out HTTP-only auth cookies during user sign-out
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
export const signoutController = catchAsync(async (req, res, next) => {
    const incomingRefreshToken = req.cookies?.refreshToken
    if (incomingRefreshToken) {
        await deleteRefreshTokenByToken(incomingRefreshToken)
    }

    //  Wipe both cookie containers instantly out of the browser's active headers
    res.clearCookie("accessToken", {
        httpOnly: true,
        secure: isProd,
        sameSite: "lax"
    })

    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: isProd,
        sameSite: "lax"
    })

    return ApiResponse.success(res, {
        message: "Logged out successfully"
    })
})

/**
 * Express controller to handle silent background access token regeneration loops
 * Automatically catches the 7-day cookie, re-verifies parameters, and drops a fresh 1-hour cookie
 */
export const refreshSessionController = catchAsync(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken
    const { newAccessToken } = await authService.handleSilentRefreshService({ 
        refreshToken: incomingRefreshToken 
    })

    // Re-issue a brand new 1-hour Access Token cookie container back to the browser interface
    res.cookie("accessToken", newAccessToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
        maxAge: 1000 * 60 * 60, // 1 hour
    })

    return ApiResponse.success(res, {
        message: "Session token refreshed silently successfully",
        data: {
            accessToken: newAccessToken
        }
    })
})

// Express controller to process email verification requests via URL query parameters
export const verifyEmailController = catchAsync(async (req, res) => {
    // Smart Extraction: Grabs the token out of the URL query string (req.query)
    const { token } = req.query

    await authService.verifyEmailService({ token })

    return ApiResponse.success(res, {
        message: "Email verified successfully! Your account is now fully activated."
    })
})

// Express controller to handle user requests for generating a new verification email
export const resendVerificationController = catchAsync(async (req, res) => {
    // Safely pull the ID out of the req.user object attached by your authenticate middleware
    const userId = req.user.id

    await authService.resendVerificationEmailService({ userId })

    return ApiResponse.success(res, {
        message: 
            "A fresh email verification link has been successfully dispatched to your inbox. It will expire in 15 minutes."
    })
})

/**
 * Express controller to trigger forgot-password request email links
 */
export const forgotPasswordController = catchAsync(async (req, res) => {
    const { email } = req.body
    await authService.forgotPasswordService({ email })
    return ApiResponse.success(res, {
        message: 
            "If an account matching that email address exists, a secure reset link has been dispatched to your inbox."
    })
})

/**
 * Express controller to commit user password resets using URL query string tokens
 */
export const resetPasswordController = catchAsync(async (req, res) => {
    const { token } = req.query
    const { newPassword } = req.body
    await authService.resetPasswordService({ token , newPassword })
    return ApiResponse.success(res, {
        message: 
            "Password reset successfully! You can now log into your account using your new credentials."
    })
})
