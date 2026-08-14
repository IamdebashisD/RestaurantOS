import { z } from "zod"


export const restaurantNameSchema = z
    .string()
    .trim()
    .min(2, "Restaurant name must be at least 2 characters")
    .max(150, "Restaurant name cannot exceed 150 characters")
    .regex(
        /^[A-Za-z][A-Za-z0-9 _-]*$/,
        "Restaurant name must start with a letter and may contain letters, numbers, spaces, hyphens, and underscores"
    )

export const createRestaurantDto = z.object({
    name: restaurantNameSchema,

    slug: z
        .string()
        .trim()
        .lowercase()
        .min(2, "Slug must be at least 2 characters")
        .max(150, "Slug cannot exceed 150 characters")
        .regex(
            /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
            "Slug must contain only lowercase letters, numbers and hyphens"
        ),

    description: z
        .string()
        .trim()
        .max(1000, "Description cannot exceed 1000 characters")
        .optional()
        .default(""),

    phone: z
        .string()
        .trim()
        .max(20, "Phone number cannot exceed 20 characters")
        .optional()
        .default(""),

    email: z
        .string()
        .trim()
        .email("Invalid restaurant email")
        .or(z.literal(""))
        .optional()
        .default(""),

    address: z
        .object({
            street: z.string().trim().max(200).optional().default(""),
            city: z.string().trim().max(100).optional().default(""),
            state: z.string().trim().max(100).optional().default(""),
            postalCode: z.string().trim().max(20).optional().default(""),

            country: z.string().trim().max(100).optional().default("India"), 
        })
        .optional()
        .default({})
})