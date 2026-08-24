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
        .trim()
        .min(2, "Category must be at least 2 characters")
        .max(100, "Category cannot exceed 100 characters"),
    
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