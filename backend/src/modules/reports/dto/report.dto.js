import { z } from "zod"

export const getDashboardSummaryQueryDto = z.object({
    startDate: z
        .string({
            invalid_type_error: "Start date must be a valid ISO date string"
        })
        .datetime({ message: "Start date must follow ISO 8601 date format" })
        .optional(),

    endDate: z
        .string({
            invalid_type_error: "End date must be a valid ISO date string"
        })
        .datetime({ message: "End date must follow ISO 8601 date format" })
        .optional()
}).strict()
