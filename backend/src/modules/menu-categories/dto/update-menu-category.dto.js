import { z } from "zod"

export const updateMenuCategoryDto = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Category name must be at least 2 characters")
        .max(100, "Category name cannot exceed 100 characters")
        .optional(),

    description: z
        .string()
        .trim()
        .max(500, "Description cannot exceed 500 characters")
        .optional(),

    displayOrder: z
        .number()
        .int("Display order must be an integer")
        .min(0, "Display order cannot be negative")
        .optional(),

    isActive: z
        .boolean()
        .optional()
}).strict()