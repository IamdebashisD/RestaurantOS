import { z } from "zod"

export const stockOutDto = z.object({
    quantity: z
        .number({
            required_error: "Stock out quantity is required",
            invalid_type_error: "Stock out quantity must be a valid number"
        })
        .positive("Stock out quantity must be greater than zero"),


    reason: z
        .string({
            invalid_type_error: "Stock-out reason must be a string"
        })
        .trim()
        .min(3, "Stock-out reason must be at least 3 characters")
        .max(500, "Stock-out reason cannot exceed 500 characters")
        .optional()
}).strict()
