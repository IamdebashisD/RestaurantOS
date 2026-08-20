import { z } from 'zod'

export const createRestaurantTableDto = z.object({
    tableNumber: z
        .number()
        .int("Table number must be an integer")
        .min(1, "Table number must be at least 1"),

    capacity: z
        .number()
        .int("Table capacity must be an integer")
        .min(1, "Table capacity must be at least 1"),

    status: z 
        .enum([
            "AVAILABLE",
            "OCCUPIED",
            "RESERVED",
            "INACTIVE"
        ])
        .optional()
        .default("AVAILABLE")
}).strict()