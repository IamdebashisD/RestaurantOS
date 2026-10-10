import nodemailer from "nodemailer"
import { env } from "../config/env.js"

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
    host: env.emailHost,
    port: env.emailPort,
    secure: false,
    auth: {
        user: env.emailUser,
        pass: env.emailPass
    }
})

/**
 * Sends a HTML/Text verification email to a newly registered user profile
 * @param {string} to - The recipient's email address
 * @param {string} token - The secure verification token string
 */
export async function sendVerificationEmail(to, token) {
    try {
        const verificationUrl = `${env.frontendUrl || "http://localhost:9000"}/api/v1/auth/verify-email?token=${token}`

        const mailOptions = {
            from : `"RestaurantOS Team" <${env.emailFrom}>`,
            to,
            subject: "Activate your RestaurantOS Account ✔",
            text: `Welcome to the platform! Please verify your email address by copying this link into your browser: ${verificationUrl}`,
            html: 
                `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                    <h2 style="color: #333;">Welcome to RestaurantOS!</h2>
                    <p>Thank you for creating an account. Please click the button below to verify your email address and fully activate your account:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block;">Verify Email Address</a>
                    </div>
                    <p style="color: #666; font-size: 12px;">This link will automatically expire in 15 minutes.</p>
                    <hr style="border: none; border-top: 1px solid #eee;" />
                    <p style="color: #999; font-size: 11px;">If you didn't create this account, you can safely ignore this email.</p>
                </div>`,
        }
        
        const info = await transporter.sendMail(mailOptions)

        console.log("🟢 [Email Pipeline Success] Message sent successfully!")
        console.log("✉️ Message ID Key:", info.messageId)
        console.log("📬 Accepted Recipients Array:", info.accepted)

    } catch (error) {
        switch (error.code) {
            case 'ECONNECTION':
            case 'ETIMEDOUT':
                console.error("Network error - retry later:", error.message)
                break
            case 'EAUTH':
                console.error("Authentication failed:", error.message)
                break
            case 'EENVELOPE':
                console.error("Invalid envelope:", error.message, error.rejected || [])
                break
        
            default:
                console.error("Send failed:", error.message)
                break
        }
        throw error
    }
}


/**
 * Sends a HTML/Text password reset instruction email to a user profile inbox
 * @param {string} to - The recipient's email address
 * @param {string} token - The secure password reset token string
 */
export async function sendPasswordResetEmail(to, token) {
    const resetUrl = `${env.frontendUrl || "http://localhost:9000"}/api/v1/auth/reset-password?token=${token}`

    const mailOptions = {
        from: `"RestaurantOS Security" <${env.emailFrom}>`,
        to,
        subject: "Reset your RestaurantOS Password 🔒",
        text: `You requested a password reset. Please copy this link into your browser to complete the process: ${resetUrl}`,
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
                <p>We received a request to reset your password for your RestaurantOS account. Click the button below to choose a new password:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block;">Reset Password</a>
                </div>
                <p style="color: #666; font-size: 12px;">This link will automatically expire in 10 minutes. If you did not make this request, you can safely ignore this email and your password will remain unchanged.</p>
            </div>
        `,
    }

    return transporter.sendMail(mailOptions)
}
