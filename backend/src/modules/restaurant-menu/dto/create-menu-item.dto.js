import { z } from "zod"

export const createMenuItemDto = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Menu item must be at least 2 characters")
        .max(150, "Menu item name cannot exceed 150 characters"),

    description: z
        .string()
        .trim()
        .max(1000, "Description cannot exceed 1000 characters")
        .optional()
        .default(""),

    price: z
        .number()
        .min(0, "Price cannot be negative"),

    category: z
        .string()
          .regex(
            /^[0-9a-fA-F]{24}$/,
            "Invalid menu category ID"
        ),
    
    image: z
        .string()
        .trim()
        .optional()
        .default(""),

    isAvailable: z
        .boolean()
        .optional()
        .default(true)
}).strict()