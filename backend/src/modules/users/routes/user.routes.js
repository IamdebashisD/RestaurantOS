import { Router } from "express"
import { authenticate } from "../../../middlewares/auth.middleware.js"
import { getProfileController } from "../controllers/user.controller.js"


const router = Router()

/**
 * @route   GET /api/v1/users/profile
 * @desc    Retrieve the currently authenticated user's profile data
 * @access  Private (Requires valid JWT Access Token)
 */
router.get("/profile", authenticate, getProfileController)

export default router