import { EmailVerification } from "../models/email-verification.model.js"


/*
Choosing 'findOneAndUpdate' with 'upsert: true' instead of a simple .create() is a 
critical architectural safety practice when dealing with authentication tokens.

Here is why we use this pattern in simple terms:

🛑 The Problem with .create() (The Double-Click Edge Case)
        Imagine a user signs up, but their internet lags. They get impatient and click 
        the "Sign Up" or "Resend Verification Link" button three times in a row really fast.

        • If you use EmailVerification.create(), your server will try to insert a brand-new database entry three times.
        • Because our schema has a strict rule saying a user must be unique (unique: true), MongoDB will throw a 
            harsh Duplicate Key Error (E11000) on the second and third click. This crashes your request thread and 
            returns an ugly 500 Server Error back to your user.

⚡ The Solution: The "Upsert" Pattern
        By using findOneAndUpdate with { upsert: true }, you are telling the database:
        1. Look in the collection to see if this user already has an active verification token in the system.
        2. If they have one: Don't create a new document. Just overwrite the old token string with a fresh one and reset the 15-minute expiration timer (Update).
        3. If they don't have one: Create a brand new document container for them right now (Insert).
*/

export async function saveVerificationToken({ userId, token, expiresAt }) {
    return EmailVerification.findOneAndUpdate(
        { user: userId },
        { token, expiresAt },
        { returnDocument: "after", upsert: true }
    ).exec()
}

export async function findVerificationToken(token) {
    return EmailVerification.findOne({ token }).populate("user").exec()
}

export async function deleteVerificationTokenByToken(token) {
    return EmailVerification.deleteOne({ token }).exec()
}
