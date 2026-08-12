import { z } from 'zod'

export const loginDto = z.object({
    email: z
        .email()
        .trim()
        .toLowerCase(),

    password: z.string().min(1, 'Password is required')
})