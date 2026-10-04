import { Router } from "express"

import { authenticate } from "../../../middlewares/auth.middleware.js"
import { requireRestaurantAccess } from "../../../middlewares/restaurant-access.middleware.js"
import { requiredRole } from "../../../middlewares/role.middleware.js"

import validate from "../../../middlewares/validate.middleware.js"
import { getDashboardSummaryQueryDto } from "../dto/report.dto.js"
import { getDashboardSummaryController } from "../controllers/report.controller.js"


const router = Router()


/**
 * @route   GET /api/v1/restaurants/:restaurantId/reports/dashboard
 * @desc    Fetch a consolidated restaurant dashboard report including sales, payment methods, procurement spend, and inventory valuation
 * @access  Private - OWNER / MANAGER
 */
router.get(
    "/:restaurantId/reports/dashboard",
    authenticate,
    requireRestaurantAccess,
    requiredRole("OWNER", "MANAGER"),
    validate(getDashboardSummaryQueryDto),
    getDashboardSummaryController
)


export default router
