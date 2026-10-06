import dotenv from 'dotenv'

dotenv.config()

export const env = {
    port: Number(process.env.PORT || 9000),
    nodeEnv: process.env.NODE_ENV || "development",
    mongoUri: process.env.MONGO_URI || "",
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "10m",
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d"
}

export const isProd = env.nodeEnv === "production"
export const isDev = env.nodeEnv === "development"
