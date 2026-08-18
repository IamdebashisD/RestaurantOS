import { Router } from "express"

import { authenticate } from "../../../middlewares/auth.middleware.js"
import {requireRestaurantAccess } from "../../../middlewares/restaurant-access.middleware.js"
import { requiredRole } from "../../../middlewares/role.middleware.js"

import validate from "../../../middlewares/validate.middleware.js"
import { addStaffDto } from "../dto/add-staff.dto.js"
import { updateStaffDto } from "../dto/update-staff.dto.js"

import {
    addRestaurantStaffController, 
    getRestaurantStaffController, 
    getRestaurantStaffByIdController, 
    updateRestaurantStaffController,
    removeRestaurantStaffController,
} from "../controllers/restaurant-staff.controller.js"


const router = Router()


/**
 * @route GET /api/v1/restaurants/:restaurantId/staff
 * @desc  Get all staff members of a restaurant
 * @access Private - Restaurant members
 */
router.get(
    "/:restaurantId/staff",
    authenticate,
    requireRestaurantAccess,
    getRestaurantStaffController
)


/**
 * @route POST /api/v1/restaurants/:restaurantId/staff
 * @desc  Add an existing user as restaurant staff
 * @access Private - OWNER only
 */
router.post(
    "/:restaurantId/staff",
    authenticate,
    requireRestaurantAccess,
    requiredRole("OWNER"),
    validate(addStaffDto),
    addRestaurantStaffController
)


/**
 * @route PATCH /api/v1/restaurants/:restaurantId/staff/:staffId
 * @desc  Update a restaurant staff membership
 * @access Private - OWNER only
 */
router.patch(
    "/:restaurantId/staff/:staffId",
    authenticate,
    requireRestaurantAccess,
    requiredRole("OWNER"),
    validate(updateStaffDto),
    updateRestaurantStaffController
)


/**
 * @route GET /api/v1/restaurants/:restaurantId/staff/:staffId
 * @desc  Get a specific restaurant staff member
 * @access Private - Restaurant members
 */
router.get(
    "/:restaurantId/staff/:staffId",
    authenticate,
    requireRestaurantAccess,
    getRestaurantStaffByIdController
)


/**
 * @route DELETE /api/v1/restaurants/:restaurantId/staff/:staffId
 * @desc  Remove a staff member from a restaurant
 * @access Private - OWNER only
 */
router.delete(
    "/:restaurantId/staff/:staffId",
    authenticate,
    requireRestaurantAccess,
    requiredRole("OWNER"),
    removeRestaurantStaffController
)


export default router