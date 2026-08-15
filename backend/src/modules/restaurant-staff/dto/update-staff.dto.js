import { z } from "zod";

export const updateStaffDto = z.object({
    role: z.enum([
        "MANAGER",
        "CASHIER",
        "KITCHEN_STAFF",
        "WAITER"
    ]).optional(),

    status: z.enum(["ACTIVE", "INACTIVE"]).optional()
}).strict().refine(
    (data) => Object.keys(data).length > 0, 
    { error: "At least one field must be provided for update"}
)