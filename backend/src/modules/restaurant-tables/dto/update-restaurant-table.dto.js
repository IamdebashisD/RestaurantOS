import { z } from "zod"

export const updateRestaurantTableDto = z.object({
    tableNumber: z
        .number()
        .int("Table number must be an integer")
        .min(1, "Table number must be at least 1")
        .optional(),

    capacity: z
        .number()
        .int("Table capacity must be an integer")
        .min(1, "Table capacity must be at least 1")
        .optional(),

    status: z
        .enum([
            "AVAILABLE",
            "OCCUPIED",
            "RESERVED",
            "INACTIVE"
        ])
        .optional()
}).strict()