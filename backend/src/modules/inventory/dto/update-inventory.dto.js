import { z } from "zod"


export const updateInventoryDto = z.object({
    name: z
        .string({
            invalid_type_error: "Inventory item name must be a string"
        })
        .trim()
        .min(2, "Item name must be at least 2 characters")
        .max(150, "Item name cannot exceed 150 characters")
        .optional(),

    minimumQuantity: z
        .number({
            invalid_type_error: "Minimum alert quantity must be a valid number"
        })
        .min(0, "Minimum alert quantity cannot be a negative number")
        .optional(),

    costPerUnit: z
        .number({
            invalid_type_error: "Cost per unit must be a valid number"
        })
        .min(0, "Cost per unit cannot be a negative number")
        .optional(),

    status: z
        .enum(["ACTIVE", "INACTIVE"], {
            invalid_type_error: "Invalid inventory status specified"
        })
        .optional()
}).strict()