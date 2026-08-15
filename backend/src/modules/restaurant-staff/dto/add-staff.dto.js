import { z } from "zod"

export const addStaffDto = z.object({
    email: z.string().trim().lowercase().email("Invalid Email"),
    role: z.enum([
        "MANAGER",
        "CASHIER",
        "KITCHEN_STAFF",
        "WAITER"
    ]),
}).strict()