import ApiResponse from "../../../utils/api-response.js"
import { catchAsync } from "../../../utils/catchAsync.js"

import * as SupplierService from "../services/supplier.service.js"


/**
 * 1. Create Supplier Controller
 * Express controller to handle HTTP requests for creating a new supplier
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
export const createSupplierController = catchAsync(
    async (req, res) => {
        const { restaurantId } = req.params

        const supplier = await SupplierService.createSupplierService({
            restaurantId,
            ...req.body
        })

        return ApiResponse.created(res, {
            message: "Supplier created successfully",
            data: {
                supplier
            }
        })
    }
)

/**
 * 2. Get all suppliers for a restaurant Controller
 * Express controller to handle HTTP requests for fetching paginated restaurant suppliers
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
export const getRestaurantSuppliersController = catchAsync(
    async (req, res) => {
        const { restaurantId } = req.params
        const { page, limit, status, search } = req.query

        const result = await SupplierService
            .getRestaurantSuppliersService({
                restaurantId,
                page,
                limit,
                status,
                search
            })

        return ApiResponse.success(res, {
            message: "Suppliers fetched successfully",
            data: {
                suppliers: result.suppliers,
                meta: result.pagination
            }
        })
    }
)

/**
 * Express controller to handle HTTP requests for fetching a single supplier by ID
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
export const getSupplierByIdController = catchAsync(
    async (req, res) => {
        const { restaurantId, supplierId } = req.params

        const supplier = await SupplierService.getSupplierByIdService({ restaurantId, supplierId })

        return ApiResponse.success(res, {
            message: "Supplier fetched successfully",
            data: {
                supplier
            }
        })
    }
)

/**
 * Express controller to handle HTTP requests for updating supplier details
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
export const updateSupplierController = catchAsync(
    async (req, res) => {
        const { restaurantId, supplierId } = req.params

        const supplier = await SupplierService.updateSupplierService({
            restaurantId,
            supplierId,
            updateData: req.body
        })

        return ApiResponse.success(res, {
            message: "Supplier updated successfully",
            data: {
                supplier
            }
        })
    }
)
