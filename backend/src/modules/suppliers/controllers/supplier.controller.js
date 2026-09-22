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
