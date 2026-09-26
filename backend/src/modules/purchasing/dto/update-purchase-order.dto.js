import { z } from "zod"
import { OrderItemDto } from "./create-purchase-order.dto.js"


export const updatePurchaseOrderDto = z.object({
    supplierId: z
        .string({
            invalid_type_error: "Supplier ID must be a string"
        })
        .min(1, "Supplier ID cannot be empty")
        .optional(),
        
    items: z
        .array(OrderItemDto)
        .min(1, "Purchase order must contains at least one item")
        .optional(),

    tax: z
        .number({
            invalid_type_error: "Tax must be a valid number"
        })
        .min(0, "Tax cannot be negative")
        .optional(),

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
        .max(500, "Purchase order notes cannot exceed 500 characters")
        .optional()
}).strict() 
