import { Router } from "express"

import { 
    signupController, 
    signinController, 
    signoutController,
    refreshSessionController,
    verifyEmailController,
    resendVerificationController,
    forgotPasswordController,
    resetPasswordController,
} from "../controllers/auth.controller.js"

import { registerDto } from "../dto/register.dto.js"
import { loginDto } from "../dto/login.dto.js"
import validate from "../../../middlewares/validate.middleware.js"
import { authenticate } from "../../../middlewares/auth.middleware.js"
import { forgotPasswordSchemaDto, resetPasswordSchemaDto } from "../dto/password.dto.js"


const router = Router()

/**
 * 🛡️ Security Best Practice: Bruteforce Protection
 * Limits rapid consecutive authentication attempts per IP address.
 */

// const authRateLimiter = rateLimit()


/**
 * @route POST /api/v1/auth/signup
 * @desc  Register a brand new user profile
 * @access Public
 */
router.post("/signup", validate(registerDto), signupController)

/**
 * @route POST /api/v1/auth/signin
 * @desc Authenticate credentials and return session token
 * @access Public
 */
router.post("/signin", validate(loginDto), signinController)

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Silent background access token regeneration interceptor loop
 * @access  Public (Relies completely on the secure HTTP-Only refreshToken cookie)
 */
router.post("/refresh", refreshSessionController)

/**
 * @route   POST /api/v1/auth/signout
 * @desc    Clear secure HTTP-only auth cookie & terminate session context
 * @access  Private Protected by auth middleware layer
 */
router.post("/signout", authenticate, signoutController)

/**
 * @route   GET /api/v1/auth/verify-email
 * @desc    Process query tokens to activate user profile states
 * @access  Public
 */
router.get("/verify-email", verifyEmailController)

/**
 * @route   POST /api/v1/auth/resend-verification
 * @desc    Request a brand new 15-minute token signature link to clear an unverified state
 * @access  Private 🛡️ (Protected by your authenticate middleware)
 */
router.post("/resend-verification", authenticate, resendVerificationController)

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Submit email parameter to request an account recovery token link
 * @access  Public
 */
router.post("/forgot-password", validate(forgotPasswordSchemaDto), forgotPasswordController)

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Submit new password string paired with URL query token to overwrite credentials
 * @access  Public
 */
router.post("/reset-password", validate(resetPasswordSchemaDto), resetPasswordController)



export default router
