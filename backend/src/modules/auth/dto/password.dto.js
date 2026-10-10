import { z } from "zod"

// 🔒 Schema Rule 1: Forgot Password Gateway Interceptor
export const forgotPasswordSchemaDto = z.object({
    email: z
        .string({ required_error: "Email address is required" })
        .trim()
        .email("Please provide a valid email format layout structural address")
})

// 🔒 Schema Rule 2: Reset Password Execution Interceptor
export const resetPasswordSchemaDto = z.object({
    // Added query validation constraint to capture the URL parameters smoothly
    newPassword: z
        .string({ required_error: "New password string parameter is required" })
        .min(8, "Password must be at least 8 characters")
        .max(72, "Password cannot exceed 72 characters")
})
