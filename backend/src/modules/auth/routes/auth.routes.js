import { Router } from "express"

import { 
    signupController, 
    signinController, 
    signoutController,
    refreshSessionController, 
} from "../controllers/auth.controller.js"

import { registerDto } from "../dto/register.dto.js"
import { loginDto } from "../dto/login.dto.js"
import validate from "../../../middlewares/validate.middleware.js"
import { authenticate } from "../../../middlewares/auth.middleware.js"


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


export default router
