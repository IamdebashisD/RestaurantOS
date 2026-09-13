import { z } from "zod"

export const refundPaymentDto = z.object({
    refundReason: z
        .string()
        .trim()
        .min(3, "Refund reason must be at least 3 characters")
        .max(500, "Refund reason cannot exceed 500 characters")
        .nullish()
}).strict()