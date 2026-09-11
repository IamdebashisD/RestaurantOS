import { Router } from "express"

import { authenticate } from "../../../middlewares/auth.middleware.js"
import { requireRestaurantAccess } from "../../../middlewares/restaurant-access.middleware.js"
import { requiredRole } from "../../../middlewares/role.middleware.js"

import validate from "../../../middlewares/validate.middleware.js"
import { createPaymentDto } from "../dto/create-payment.dto.js"

import {
    createPaymentController,
    getPaymentByIdController,
    getRestaurantPaymentsController,
    getPaymentsByInvoiceController,
} from "../controllers/payment.controller.js"


const router = Router()


/**
 * @route POST /api/v1/restaurants/:restaurantId/invoices/:invoiceId/payments
 * @desc Create payment for an invoice
 * @access Private - OWNER / MANAGER
 */
router.post(
    "/:restaurantId/invoices/:invoiceId/payments",
    authenticate,
    requireRestaurantAccess,
    requiredRole("OWNER", "MANAGER"),
    validate(createPaymentDto),
    createPaymentController
)

/**
 * @route GET /api/v1/restaurants/:restaurantId/payments/:paymentId
 * @desc Get payment by ID
 * @access Private - OWNER / MANAGER
 */
router.get(
    "/:restaurantId/payments/:paymentId",
    authenticate,
    requireRestaurantAccess,
    requiredRole("OWNER", "MANAGER"),
    getPaymentByIdController
)

/**
 * @route GET /api/v1/restaurants/:restaurantId/payments
 * @desc Get all payments for a restaurant
 * @access Private - OWNER / MANAGER
 */
router.get(
    "/:restaurantId/payments",
    authenticate,
    requireRestaurantAccess,
    requiredRole("OWNER", "MANAGER"),
    getRestaurantPaymentsController
)

/**
 * @route GET /api/v1/restaurants/:restaurantId/invoices/:invoiceId/payments
 * @desc Get payments for an invoice
 * @access Private - OWNER / MANAGER
 */
router.get(
    "/:restaurantId/invoices/:invoiceId/payments",
    authenticate,
    requireRestaurantAccess,
    requiredRole("OWNER", "MANAGER"),
    getPaymentsByInvoiceController
)


export default router
