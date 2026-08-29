import { z } from "zod"
import { timeStringSchema } from "./create-reservation.dto.js"

export const updateReservationDto = z.object({
    table: z
        .string()
        .trim()
        .min(1, "Table ID is required")
        .optional(),

    date: z
        .string()
        .trim()
        .min(1, "Reservation date is required")
        .optional(),

    startTime: timeStringSchema("Start time must be in HH:mm format").optional(),

    endTime:  timeStringSchema("End time must be in HH:mm format").optional(),

    guests: z
        .number()
        .int("Guests must be a whole number")
        .min(1, "At least 1 guest is required")
        .optional(),

})
.strict()
.refine((data) => {
    if (data.startTime !== undefined && data.endTime !== undefined) {
        return data.startTime < data.endTime
    }
    return true
}, {
    message: "Start time must be earlier than end time",
    path: ["startTime"]
})