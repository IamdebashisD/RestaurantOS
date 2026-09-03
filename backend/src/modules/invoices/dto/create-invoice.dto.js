import { z } from "zod"

export const createInvoiceDto = z.object({
    discount: z
        .number()
        .min(0, "Discount cannot be negative")
        .default(0),

    tax: z
        .number()
        .min(0, "Tax cannot be negative")
        .default(0),

    serviceCharge: z
        .number()
        .min(0, "Service charge cannot be negative")
        .default(0),
}).strict()