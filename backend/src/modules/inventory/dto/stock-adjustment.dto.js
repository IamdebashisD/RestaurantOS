import { z } from "zod"

export const stockAdjustmentDto = z.object({
    actualQuantity: z
        .number({
            required_error: "Actual inventory quantity is required",
            invalid_type_error:
                "Actual inventory quantity must be a valid number"
        })
        .min(
            0,
            "Actual inventory quantity cannot be negative"
        ),

    reason: z
        .string({
            invalid_type_error:
                "Stock adjustment reason must be a string"
        })
        .trim()
        .min(
            3,
            "Stock adjustment reason must be at least 3 characters"
        )
        .max(
            500,
            "Stock adjustment reason cannot exceed 500 characters"
        )
        .optional()
}).strict()
