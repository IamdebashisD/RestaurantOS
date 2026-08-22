import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export function signToken(payload) {
    console.log("Expires In value:", env.jwtExpiresIn);
    return jwt.sign(payload, env.jwtSecret, { algorithm: 'HS256', expiresIn: env.jwtExpiresIn })
}
export function accessToken(payload) {
    return jwt.sign(payload, env.jwtSecret , { algorithm: 'HS256', expiresIn: env.jwtExpiresIn })
} 

export function verifyToken(token) {
    return jwt.verify(token, env.jwtSecret)
}

