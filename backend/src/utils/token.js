import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

// This 'signToken' only for register purpose
export function signToken(payload) {
    console.log("Expires In value:", env.jwtExpiresIn);
    return jwt.sign(payload, env.jwtSecret, { algorithm: 'HS256', expiresIn: env.jwtExpiresIn })
}

export function generateAccessToken(payload) {
    return jwt.sign(payload, env.jwtSecret, { algorithm: 'HS256', expiresIn: env.jwtExpiresIn })
}
export function verifyToken(token) {
    return jwt.verify(token, env.jwtSecret)
}

export function generateRefreshToken(payload) {
    return jwt.sign(payload, env.jwtRefreshSecret, { algorithm: 'HS256', expiresIn: env.jwtRefreshExpiresIn })
} 
export function verifyRefreshToken(token) {
    return jwt.verify(token, env.jwtRefreshSecret)
}
