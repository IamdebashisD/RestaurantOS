import { z } from "zod"

export const receivePurchaseOrderDto = z.object({
    items: z
        .array(
            z.object({
                inventoryId: z
                    .string({
                        required_error: "Inventory ID is required",
                        invalid_type_error:
                            "Inventory ID must be a string"
                    })
                    .min(
                        1,
                        "Inventory ID cannot be empty"
                    ),

                receivedQuantity: z
                    .number({
                        required_error:
                            "Received quantity is required",
                        invalid_type_error:
                            "Received quantity must be a valid number"
                    })
                    .positive(
                        "Received quantity must be greater than zero"
                    )
            }).strict()
        )
        .min(
            1,
            "At least one inventory item must be received"
        )
}).strict()