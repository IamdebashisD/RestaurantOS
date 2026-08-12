import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'

import rootRouter from './modules/routes.js'
import ApiError from './utils/api-error.js'
import { errorHandler } from './middlewares/errorHandler.js'


export function app() {
    const app = express()

    app.use(helmet())
    app.use(cors())
    app.use(express.json({ limit: "10kb" }))
    app.use(express.urlencoded({ extended: true }))
    app.use(cookieParser())
    app.use(morgan("dev"))

    app.get('/api/v1/health', (_req, res) => {
        return res.status(200).json({ 
            success: true, 
            message: 'API is healthy ✔', 
            uptime: process.uptime() 
        })
    })

    // 2. Standardized API Versioning Gateway Mounting
    app.use("/api/v1/", rootRouter)

    // 3. Fallback Route: Handle Unmatched 404 Route Requests
    app.all("*any", (req, res, next) => {
        next(ApiError.notFound(`Can't find ${req.originalUrl} on this server!`));
    });

    app.use(errorHandler)

    return app
}