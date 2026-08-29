import { z } from "zod"

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

    startTime: z
        .string()
        .trim()
        .regex(
            /^([01]\d|2[0-3]):([0-5]\d)$/,
            "Start time must be in HH:mm format"
        )
        .optional(),

    endTime: z
        .string()
        .trim()
        .regex(
            /^([01]\d|2[0-3]):([0-5]\d)$/,
            "End time must be in HH:mm format"
        )
        .optional(),

    guests: z
        .number()
        .int("Guests must be a whole number")
        .min(1, "At least 1 guest is required")
        .optional(),

}).strict()