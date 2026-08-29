import { z } from "zod"

export function timeStringSchema(fallbackMessage) {
    return z.string()
        .trim()
        .regex(
            /^([01]\d|2[0-3]):([0-5]\d)$/,
            fallbackMessage
        )
}


export const createReservationDto = z.object({
    table: z
        .string()
        .trim()
        .min(1, "Table ID is required"),

    date: z
        .string()
        .trim()
        .min(1, "Reservation date is required"),

    startTime: timeStringSchema("Start time must be in HH:mm format"),
    
    endTime: timeStringSchema("End time must be in HH:mm format"),

    guests: z
        .number()
        .int("Guests must be a whole number")
        .min(1, "At least 1 guest is required"),

})
.strict()
.refine((data) => data.startTime < data.endTime, {
    message: "Start time must be earlier than end time",
    path: ["startTime"]
})