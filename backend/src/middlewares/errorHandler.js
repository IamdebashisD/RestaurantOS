import ApiError from "../utils/api-error.js"
import { isDev } from "../config/env.js"

/**
 * Global Centralized Error Handling Middleware
 * Must be placed after all route definitions in app.js
 */

export function errorHandler(err, req, res, next) {
    let error = err

    if (!(error instanceof ApiError)) {
        const statusCode = error.statusCode || (error.name === "ValidationError" ? 400 : 500)
        const message = error.message || "Internal Server Error"

        error = new ApiError(statusCode, message, error.stack)
    }

    // Production vs Development Logging Toggle
    if (isDev) {
        console.error(`[Error Log]: `, {
            statusCode: error.statusCode,
            message: error.message,
            stack: error.stack?.split("\n")[0],
            details: error.details?.split("\n")[0],
        })
    } else {
        if (error.statusCode === 500) {
            console.error(`Critical System Error: ${error.message}`);
        }
    }

    // Format the final output to match your structural layout
    return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        error: error.details || null,
        ...(isDev && { stack: error.stack?.split("\n")[0] })
    })

}