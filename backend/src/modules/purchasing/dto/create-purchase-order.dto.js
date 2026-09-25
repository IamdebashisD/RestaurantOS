import { z } from "zod"

export const OrderItemDto = z.object({
        inventoryId: z
            .string({
                required_error:
                    "Inventory ID is required",
                invalid_type_error:
                    "Inventory ID must be a string"
            })
            .min(
                1,
                "Inventory ID cannot be empty"
            ),

        quantity: z
            .number({
                required_error:
                    "Purchase quantity is required",
                invalid_type_error:
                    "Purchase quantity must be a valid number"
            })
            .positive(
                "Purchase quantity must be greater than zero"
            ),

        costPerUnit: z
            .number({
                required_error:
                    "Cost per unit is required",
                invalid_type_error:
                    "Cost per unit must be a valid number"
            })
            .min(
                0,
                "Cost per unit cannot be negative"
            )
    }).strict()


export const createPurchaseOrderDto = z.object({
    supplierId: z
        .string({
            required_error:
                "Supplier ID is required",
            invalid_type_error:
                "Supplier ID must be a string"
        })
        .min(
            1,
            "Supplier ID cannot be empty"
        ),

    items: z
        .array(
            OrderItemDto
        )
        .min(
            1,
            "Purchase order must contain at least one item"
        ),

    tax: z
        .number({
            invalid_type_error:
                "Tax must be a valid number"
        })
        .min(
            0,
            "Tax cannot be negative"
        )
        .default(0),

    expectedDeliveryDate: z
        .coerce
        .date({
            invalid_type_error:
                "Expected delivery date must be a valid date"
        })
        .optional(),

    notes: z
        .string({
            invalid_type_error:
                "Purchase order notes must be a string"
        })
        .trim()
        .max(
            500,
            "Purchase order notes cannot exceed 500 characters"
        )
        .optional()
}).strict()
