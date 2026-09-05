import { Router } from "express"

import { authenticate } from "../../../middlewares/auth.middleware.js"
import { requireRestaurantAccess } from "../../../middlewares/restaurant-access.middleware.js"
import { requiredRole } from "../../../middlewares/role.middleware.js"

import validate from "../../../middlewares/validate.middleware.js"
import { createInvoiceDto } from "../dto/create-invoice.dto.js"

import {
    createInvoiceController,
    getInvoiceByIdController,
    getRestaurantInvoicesController,
    getInvoiceByOrderController,
    getInvoiceByNumberController,
    markInvoiceAsPaidController,
    cancelInvoiceController,
} from "../controllers/invoice.controller.js"


const router = Router()

/** 
 * @route POST /api/v1/restaurants/:restaurantId/orders/:orderId/invoice 
 * @desc Create invoice for a completed order 
 * @access Private - OWNER / MANAGER 
 */
router.post(
    "/:restaurantId/orders/:orderId/invoice",
    authenticate,
    requireRestaurantAccess,
    requiredRole("OWNER", "MANAGER"),
    validate(createInvoiceDto),
    createInvoiceController
)

/** 
 * @route GET /api/v1/restaurants/:restaurantId/invoices/:invoiceId 
 * @desc Get invoice by ID 
 * @access Private - OWNER / MANAGER */
 router.get(
    "/:restaurantId/invoices/:invoiceId",
    authenticate,
    requireRestaurantAccess,
    requiredRole("OWNER", "MANAGER"),
    getInvoiceByIdController
)

/** 
 * @route GET /api/v1/restaurants/:restaurantId/invoices 
 * @desc Get a paginated collection list of invoices for the restaurant
 * @access Private - OWNER / MANAGER 
 */
router.get(
    "/:restaurantId/invoices",
    authenticate,
    requireRestaurantAccess,
    requiredRole("OWNER", "MANAGER"),
    getRestaurantInvoicesController
)

/**
 * @route   GET /api/v1/restaurants/:restaurantId/orders/:orderId/invoice
 * @desc    Get a single invoice matching an active Order ID
 * @access  Private (OWNER, MANAGER)
 */
router.get(
    "/:restaurantId/orders/:orderId/invoice",
    authenticate,
    requireRestaurantAccess,
    requiredRole("OWNER", "MANAGER"),
    getInvoiceByOrderController
)

/**
 * @route GET /api/v1/restaurants/:restaurantId/invoices/number/:invoiceNumber
 * @desc  Get invoice by invoice number
 * @access Private - OWNER / MANAGER
 */
router.get(
    "/:restaurantId/invoices/number/:invoiceNumber",
    authenticate,
    requireRestaurantAccess,
    requiredRole("OWNER", "MANAGER"),
    getInvoiceByNumberController
)

/**
 * @route PATCH /api/v1/restaurants/:restaurantId/invoices/:invoiceId/pay
 * @desc  Mark an invoice as paid
 * @access Private - OWNER / MANAGER
 */
router.patch(
    "/:restaurantId/invoices/:invoiceId/pay",
    authenticate,
    requireRestaurantAccess,
    requiredRole("OWNER", "MANAGER"),
    markInvoiceAsPaidController
)

/**
 * @route PATCH /api/v1/restaurants/:restaurantId/invoices/:invoiceId/cancel
 * @desc  Cancel an invoice
 * @access Private - OWNER / MANAGER
 */
router.patch(
    "/:restaurantId/invoices/:invoiceId/cancel",
    authenticate,
    requireRestaurantAccess,
    requiredRole("OWNER", "MANAGER"),
    cancelInvoiceController
)


export default router