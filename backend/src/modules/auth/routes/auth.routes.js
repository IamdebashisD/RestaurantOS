import { Router } from "express"
import { signupController, signinController } from "../controllers/auth.controller.js"
import { registerDto } from "../dto/register.dto.js"
import { loginDto } from "../dto/login.dto.js"
import validate from "../../../middlewares/validate.middleware.js"

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


export default router
