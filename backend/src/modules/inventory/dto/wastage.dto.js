import { z } from "zod"

export const wastageDto = z.object({
    quantity: z
        .number({
            required_error: "Wastage quantity is required",
            invalida_type_error: "Wastage quantity must be a valid number"
        })
        .positive("Wastage quantity must be greater than zero"),
    
    reason: z
        .string({
            required_error: "Wastage reason is required",
            invalida_type_error: "Wastage reason must be a string"
        })
        .trim()
        .min(3, "Wastage reason must be at least 3 characters")
        .max(500, "Wastage reason cannot exceed 500 characters")
}).strict()
