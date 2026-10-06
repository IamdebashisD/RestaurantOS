import { verifyAccessToken } from "../utils/token.js"
import ApiError from "../utils/api-error.js"
import { findUserById } from "../modules/users/repositories/user.repositories.js"


export async function authenticate(req, res, next) {
    try {
        let token = null

        if (req.cookies && req.cookies.accessToken) {
            token = req.cookies.accessToken
        }

        const authorization = req.headers.authorization
        if (!token && authorization) {
            const [scheme, headerToken] = authorization.split(" ")

            if (scheme === "Bearer" && headerToken) {
                token = headerToken
            } else {
                throw ApiError.unauthorized("Invalid authorization scheme layout")
            }
        }

        if (!token) throw ApiError.unauthorized("Authentication required. Token missing.")
        
        let payload
        try {
            payload = verifyAccessToken(token)
        } catch (error) {
            if (error.name === "TokenExpiredError") throw ApiError.unauthorized("Authentication token has expired")
            if (error.name === "JsonWebTokenError") throw ApiError.unauthorized("Invalid authentication token")
            throw error
        }

        if (!payload?.id) throw ApiError.unauthorized("Invalid authentication token")
        
        const user = await findUserById(payload.id)
        if (!user) throw ApiError.unauthorized("User no longer exists")
        if (!user.isActive) throw ApiError.unauthorized("Account is inactive")
        
        req.user = {
            id: user._id,
            name: user.name,
            email: user.email,
            isEmailVerified: user.isEmailVerified,
        }

        next()

    } catch (error) {
        next(error)
    }
}
