import dotenv from 'dotenv'

dotenv.config()

export const env = {
    port: Number(process.env.PORT || 9000),
    nodeEnv: process.env.NODE_ENV || "development",
    mongoUri: process.env.MONGO_URI || "",
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "10m",
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",

    emailHost: process.env.SMTP_HOST || "sandbox.smtp.mailtrap.io",
    emailPort: parseInt(process.env.SMTP_PORT || "2525", 10),
    emailUser: process.env.SMTP_USER,
    emailPass: process.env.SMTP_PASS,
    emailFrom: process.env.SMTP_FROM_EMAIL,
    frontendUrl: process.env.FRONTEND_URL,
}

export const isProd = env.nodeEnv === "production"
export const isDev = env.nodeEnv === "development"
