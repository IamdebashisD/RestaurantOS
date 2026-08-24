import { z } from "zod"

export const updateMenuItemDto = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Menu item name must be at least 2 characters")
        .max(150, "Menu item name cannot exceed 150 characters")
        .optional(),

    description: z
        .string()
        .trim()
        .max(1000, "Description cannot exceed 1000 characters")
        .optional(),

    price: z
        .number()
        .min(0, "Price cannot be negative")
        .optional(),

    category: z
        .string()
        .trim()
        .min(2, "Category must be at least 2 characters")
        .max(100, "Category cannot exceed 100 characters")
        .optional(),

    image: z
        .string()
        .trim()
        .optional(),

    isAvailable: z
        .boolean()
        .optional()
}).strict()