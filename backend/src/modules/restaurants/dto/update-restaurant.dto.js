import { z } from "zod"
import { restaurantNameSchema } from "./restaurant.dto.js"


export const updateRestaurantDto = z.object({
    name: restaurantNameSchema.optional(),

    description: z
        .string()
        .trim()
        .max(1000)
        .optional(),

    phone: z
        .string()
        .trim()
        .max(20)
        .optional(),

    email: z
        .string()
        .trim()
        .email("Invalid restaurant email")
        .or(z.literal(""))
        .optional(),

    address: z.object({
        street: z.string().trim().max(200).optional(),
        city: z.string().trim().max(100).optional(),
        state: z.string().trim().max(100).optional(),
        postalCode: z.string().trim().max(20).optional(""),
        country: z.string().trim().max(100).optional(),
    }).optional(),

    status: z
        .enum(["ACTIVE", "INACTIVE", "SUSPENDED"])
        .optional(),
}).strict()