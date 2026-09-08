import { z } from "zod"

export const createPaymentDto = z.object({
    method: z
        .enum([
            "CASH", 
            "CARD", 
            "UPI", 
            "NET_BANKING", 
            "WALLET", 
            "OTHER"
        ], {
            errorMap: () => ({ message: "Invalid payment method specified"}) 
        }),

    transactionId: z
        .string()
        .trim()
        .min(1, "Transaction ID cannot be empty")
        .nullish(),

    gatewayMetadata: z
        .record(z.string(), z.unknown())
        .optional({})
}).strict()