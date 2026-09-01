import { z } from "zod"

const orderItemDto = z.object({
    menuItem: z
        .string()
        .trim()
        .min(1, "Menu item ID is required"),

    quantity: z
        .number()
        .int("Quantity must be a whole number")
        .min(1, "Quantity must be at least 1"),
}).strict()

export const createOrderDto = z.object({
    table: z
        .string()
        .trim()
        .min(1, "Table ID is required"),

    items:  z
        .array(orderItemDto)
        .min(1, "Order must contain at least one item"),

    notes: z
        .string()
        .trim()
        .max(500, "Notes cannot exceed 500 characters")
        .optional(),
}).strict()