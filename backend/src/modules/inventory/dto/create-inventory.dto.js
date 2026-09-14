import { z } from "zod"

export const createInventoryDto = z.object({
    name: z
        .string({
            required_error: "Inventory item name is required"
        })
        .trim()
        .min(2, "Item name must be at least 2 characters")
        .max(150, "Item name cannot exceed 150 characters"),

    unit: z.enum(
        ["KG", "G", "L", "ML", "PCS"], 
        {
            invalid_type_error: "Invalid measurement unit type specified",
            required_error: "Measurement unit type is required"
        }
    ),

    minimumQuantity: z
        .number({
            invalid_type_error: "Minimum alert quantity must be a valid number"
        })
        .min(0, "Minimum alert quantity cannot be a negative number")
        .default(0),

    costPerUnit: z
        .number({
            invalid_type_error: "Cost per unit must be a valid number"
        })
        .min(0, "Cost per unit cannot be a negative number")
        .default(0),
}).strict()
