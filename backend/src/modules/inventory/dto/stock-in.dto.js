import { z } from "zod"

export const stockInDto = z.object({
    quantity: z
        .number({
            required_error: "Stock quantity is required",
            invalid_type_error: "Stock quantity must be a valid number"
        })
        .positive("Stock quantity must be greater than zero"),

    costPerUnit: z
        .number({
            required_error: "Cost per unit is required",
            invalid_type_error: "Cost per unit must be a valid number"
        })
        .min(0, "Cost per unit cannot be negative")
        .optional(),

    reason: z
        .string({
            invalid_type_error: "Stock-in reason must be a string"
        })
        .trim()
        .min(3, "Stock-in reason must be at least 3 characters")
        .max(500, "Stock-in reason cannot exceed 500 characters")
        .optional()
}).strict()