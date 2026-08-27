import { z } from "zod"

export const createMenuCategoryDto = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Category name must be at elast 2 characters")
        .max(100, "Category name cannot exceed 100 characters"),

    description: z
        .string()
        .trim()
        .max(500, "Description cannot exceed 500 characters")
        .optional()
        .default(""),

    displayOrder: z
        .number()
        .int("Display order must be an integer")
        .min(0, "Display order cannot be negative")
        .optional()
        .default(0),

    isActive: z
        .boolean()
        .optional()
        .default(true)
}).strict()